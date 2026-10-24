<script setup lang="ts">
import { CircleAlert, LoaderCircle } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import { singleCenter, type Size } from '@/core/layout'
import { drawWatermark, watermarkBlockSize, type WatermarkContent } from '@/core/render'
import { resolveTemplate } from '@/core/template'
import { t, type MessageKey } from '@/i18n'
import { errorMessageKey, type FileItem } from '@/state/files'
import { pdfPageSize, previewBase } from '@/state/preview'
import { config, logo } from '@/state/settings'

const props = defineProps<{ item: FileItem; page: number; comparing: boolean }>()

const host = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()
const hostSize = ref<Size>({ width: 0, height: 0 })
const dpr = ref(1)
/** Size of the current image (pixels) or page (points). */
const natural = ref<Size | null>(null)
const base = shallowRef<{ key: string; canvas: HTMLCanvasElement } | null>(null)
const error = ref<MessageKey | null>(null)

const PADDING = 24
const sourceKey = computed(() => `${props.item.id}:${props.page}`)

/** CSS size of the preview: the source fitted into the available space. */
const display = computed<Size | null>(() => {
  const source = natural.value
  const { width, height } = hostSize.value
  if (!source || width <= 0 || height <= 0) return null
  const scale = Math.min(
    Math.max(32, width - 2 * PADDING) / source.width,
    Math.max(32, height - 2 * PADDING) / source.height,
  )
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  }
})

const pixels = computed<Size | null>(() =>
  display.value
    ? {
        width: Math.round(display.value.width * dpr.value),
        height: Math.round(display.value.height * dpr.value),
      }
    : null,
)

const loading = computed(
  () => !error.value && (props.item.status === 'loading' || base.value?.key !== sourceKey.value),
)

let naturalToken = 0
watch(
  () => [props.item.id, props.item.status, props.page] as const,
  async () => {
    const token = ++naturalToken
    error.value = props.item.status === 'error' ? props.item.error : null
    if (props.item.status !== 'ready') return
    try {
      const size =
        props.item.kind === 'image'
          ? { width: props.item.width, height: props.item.height }
          : await pdfPageSize(props.item, props.page)
      if (token === naturalToken) natural.value = size
    } catch (e) {
      if (token === naturalToken) error.value = errorMessageKey(e)
    }
  },
  { immediate: true },
)

let baseToken = 0
let resizeTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () =>
    [
      sourceKey.value,
      natural.value,
      pixels.value && Math.max(pixels.value.width, pixels.value.height),
    ] as const,
  ([key, size, longSide], previous) => {
    if (!size || !longSide || props.item.status !== 'ready') return
    const load = async () => {
      const token = ++baseToken
      try {
        const rendition = await previewBase(props.item, props.page, longSide)
        if (token === baseToken) base.value = { key, canvas: rendition }
      } catch (e) {
        if (token === baseToken) error.value = errorMessageKey(e)
      }
    }
    // Resizing the window: wait until it settles, the current rendition is scaled meanwhile.
    clearTimeout(resizeTimer)
    if (previous && previous[0] === key && base.value?.key === key)
      resizeTimer = setTimeout(load, 200)
    else void load()
  },
)

function content(): WatermarkContent {
  return {
    text: resolveTemplate(config.text, {
      fileName: props.item.name,
      page: props.page,
      pages: props.item.pages || 1,
      now: new Date(),
    }),
    logo: logo.value
      ? { source: logo.value.image, width: logo.value.width, height: logo.value.height }
      : null,
  }
}

let frame = 0
function scheduleDraw() {
  if (!frame) {
    frame = requestAnimationFrame(() => {
      frame = 0
      draw()
    })
  }
}

function draw() {
  const el = canvas.value
  const size = pixels.value
  if (!el || !size || !base.value || base.value.key !== sourceKey.value) return
  if (el.width !== size.width || el.height !== size.height) {
    el.width = size.width
    el.height = size.height
  }
  const ctx = el.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, size.width, size.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(base.value.canvas, 0, 0, size.width, size.height)
  if (!props.comparing) drawWatermark(ctx, size, config, content())
}

watch([config, logo, base, pixels, () => props.comparing], scheduleDraw, { deep: true })

// Dragging moves a single watermark (switching it to a free position).
let drag: {
  pointer: number
  x: number
  y: number
  posX: number
  posY: number
  rect: DOMRect
} | null = null

const draggable = computed(() => config.layout === 'single' && !props.comparing)

function onPointerDown(event: PointerEvent) {
  const el = canvas.value
  const size = pixels.value
  if (!draggable.value || !el || !size || event.button !== 0) return
  const block = watermarkBlockSize(config, content(), size)
  if (!block) return
  const center = singleCenter({
    canvas: size,
    block,
    angle: (-config.rotation * Math.PI) / 180,
    anchor: config.anchor,
    margin: (config.margin / 100) * Math.min(size.width, size.height),
    position: { x: config.posX, y: config.posY },
  })
  drag = {
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    posX: center.x / size.width,
    posY: center.y / size.height,
    rect: el.getBoundingClientRect(),
  }
  el.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function onPointerMove(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointer) return
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  config.anchor = 'custom'
  config.posX = clamp(drag.posX + (event.clientX - drag.x) / drag.rect.width)
  config.posY = clamp(drag.posY + (event.clientY - drag.y) / drag.rect.height)
}

function onPointerUp(event: PointerEvent) {
  if (drag && event.pointerId === drag.pointer) drag = null
}

let observer: ResizeObserver | null = null
const onFontsLoaded = () => scheduleDraw()

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    dpr.value = Math.min(3, window.devicePixelRatio || 1)
    hostSize.value = { width: entry.contentRect.width, height: entry.contentRect.height }
  })
  observer.observe(host.value!)
  document.fonts?.addEventListener('loadingdone', onFontsLoaded)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.fonts?.removeEventListener('loadingdone', onFontsLoaded)
  cancelAnimationFrame(frame)
  clearTimeout(resizeTimer)
})
</script>

<template>
  <div ref="host" class="preview">
    <canvas
      v-show="display && base?.key === sourceKey && !error"
      ref="canvas"
      class="canvas"
      :class="{ draggable }"
      :style="display ? { width: `${display.width}px`, height: `${display.height}px` } : undefined"
      role="img"
      :aria-label="t('preview.alt', { name: item.name })"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
    <div v-if="error" class="state error">
      <CircleAlert aria-hidden="true" />
      <span>{{ t(error) }}</span>
    </div>
    <div v-else-if="loading" class="state">
      <LoaderCircle class="spin" aria-hidden="true" />
      <span>{{ t('preview.loading') }}</span>
    </div>
  </div>
</template>

<style scoped>
.preview {
  position: relative;
  display: grid;
  flex: 1;
  place-items: center;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  border-radius: 3px;
  background: repeating-conic-gradient(#e9ebee 0 25%, #fff 0 50%) 0 0 / 16px 16px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 8px 30px rgba(0, 0, 0, 0.14);
}

.canvas.draggable {
  cursor: move;
  touch-action: none;
}

.state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: var(--c-text-2);
  text-align: center;
}

.state svg {
  width: 28px;
  height: 28px;
}

.state.error {
  color: var(--c-danger);
}

.spin {
  color: var(--c-accent);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
