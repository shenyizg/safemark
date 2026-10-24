<script setup lang="ts">
import { ChevronLeft, ChevronRight, Eye, FileImage, FileText } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import { formatBytes } from '@/core/files'
import type { Size } from '@/core/layout'
import { t } from '@/i18n'
import { activeItem, activePage, items } from '@/state/files'
import { pdfPageSize } from '@/state/preview'
import EmptyState from './EmptyState.vue'
import FileStrip from './FileStrip.vue'
import PreviewCanvas from './PreviewCanvas.vue'

defineEmits<{ pick: []; sample: [] }>()

const comparing = ref(false)

/** Size of the page on screen (PDF pages can differ from each other). */
const pageSize = ref<Size | null>(null)
watch(
  () => [activeItem.value?.id, activeItem.value?.status, activePage.value] as const,
  async () => {
    const item = activeItem.value
    pageSize.value =
      item && item.kind === 'image' ? { width: item.width, height: item.height } : null
    if (item?.kind !== 'pdf' || item.status !== 'ready') return
    const page = activePage.value
    try {
      const size = await pdfPageSize(item, page)
      if (activeItem.value === item && activePage.value === page) pageSize.value = size
    } catch {
      // The preview reports load errors.
    }
  },
  { immediate: true },
)

const meta = computed(() => {
  const item = activeItem.value
  if (!item) return ''
  const parts: string[] = []
  if (item.kind === 'pdf' && item.pages) parts.push(t('preview.pages', { count: item.pages }))
  const size = pageSize.value
  if (size?.width && size.height) {
    const unit = item.kind === 'pdf' ? ' pt' : ' px'
    parts.push(`${Math.round(size.width)} × ${Math.round(size.height)}${unit}`)
  }
  parts.push(formatBytes(item.size))
  return parts.join(' · ')
})

function goToPage(delta: number) {
  const item = activeItem.value
  if (!item) return
  activePage.value = Math.min(Math.max(1, activePage.value + delta), item.pages || 1)
}

function onPageInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = Math.round(Number(input.value))
  const pages = activeItem.value?.pages || 1
  if (Number.isFinite(value)) activePage.value = Math.min(Math.max(1, value), pages)
  input.value = String(activePage.value)
}

defineExpose({ goToPage })
</script>

<template>
  <section class="stage" :aria-label="t('preview.title')">
    <div class="stage-main">
      <EmptyState v-if="!items.length" @pick="$emit('pick')" @sample="$emit('sample')" />
      <template v-else-if="activeItem">
        <header class="toolbar">
          <div class="file-info">
            <FileText v-if="activeItem.kind === 'pdf'" class="file-icon" aria-hidden="true" />
            <FileImage v-else class="file-icon" aria-hidden="true" />
            <div class="file-text">
              <div class="file-name" :title="activeItem.name">{{ activeItem.name }}</div>
              <div class="file-meta">{{ meta }}</div>
            </div>
          </div>
          <div class="tools">
            <div v-if="activeItem.kind === 'pdf' && activeItem.pages > 1" class="pager">
              <button
                type="button"
                class="icon-btn"
                :disabled="activePage <= 1"
                :aria-label="t('preview.prevPage')"
                :title="t('preview.prevPage')"
                @click="goToPage(-1)"
              >
                <ChevronLeft />
              </button>
              <label class="page-input">
                <span class="visually-hidden">{{ t('preview.page') }}</span>
                <input
                  class="input"
                  type="number"
                  min="1"
                  :max="activeItem.pages"
                  :value="activePage"
                  @change="onPageInput"
                />
                <span class="page-total">/ {{ activeItem.pages }}</span>
              </label>
              <button
                type="button"
                class="icon-btn"
                :disabled="activePage >= activeItem.pages"
                :aria-label="t('preview.nextPage')"
                :title="t('preview.nextPage')"
                @click="goToPage(1)"
              >
                <ChevronRight />
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm compare"
              :class="{ active: comparing }"
              :aria-pressed="comparing"
              :title="t('preview.compareHint')"
              @pointerdown="comparing = true"
              @pointerup="comparing = false"
              @pointerleave="comparing = false"
              @pointercancel="comparing = false"
              @keydown.space.prevent="comparing = true"
              @keyup.space.prevent="comparing = false"
              @contextmenu.prevent
            >
              <Eye aria-hidden="true" />
              <span class="compare-label">{{ t('preview.compare') }}</span>
            </button>
          </div>
        </header>
        <PreviewCanvas :item="activeItem" :page="activePage" :comparing="comparing" />
      </template>
    </div>
    <FileStrip v-if="items.length" @add="$emit('pick')" />
  </section>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background-color: var(--c-stage);
  background-image: radial-gradient(var(--c-stage-dot) 1px, transparent 1px);
  background-size: 18px 18px;
}

.stage-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px 0 18px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.file-icon {
  flex: none;
  width: 18px;
  height: 18px;
  color: var(--c-text-3);
}

.file-text {
  min-width: 0;
}

.file-name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  color: var(--c-text-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.tools {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

.pager {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
}

.pager .icon-btn {
  width: 28px;
  height: 28px;
}

.page-input {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.page-input .input {
  width: 46px;
  height: 26px;
  padding: 0 4px;
  text-align: center;
  -moz-appearance: textfield;
}

.page-input .input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.page-total {
  padding-right: 4px;
  color: var(--c-text-3);
  font-variant-numeric: tabular-nums;
}

.compare {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
}

.compare.active {
  border-color: var(--c-accent);
  background: var(--c-accent-soft);
  color: var(--c-accent);
}

@media (max-width: 600px) {
  .compare-label {
    display: none;
  }

  .toolbar {
    padding: 10px 10px 0 14px;
  }
}
</style>
