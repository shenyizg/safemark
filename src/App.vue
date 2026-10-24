<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { DOCUMENT_ACCEPT, filesFromDataTransfer, pickFiles } from '@/core/picker'
import { createSampleImage, createSamplePdf } from '@/core/sample'
import { t } from '@/i18n'
import { exportFiles, exportState } from '@/state/exporter'
import { activeId, activeItem, activePage, addFiles, items } from '@/state/files'
import { showToast } from '@/state/toasts'
import AboutDialog from './components/AboutDialog.vue'
import AppHeader from './components/AppHeader.vue'
import DropOverlay from './components/DropOverlay.vue'
import PasswordDialog from './components/PasswordDialog.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import StagePane from './components/StagePane.vue'
import ToastHost from './components/ToastHost.vue'

const aboutOpen = ref(false)
const dragging = ref(false)
let dragDepth = 0

function add(files: File[]) {
  if (!files.length) return
  const { unsupported } = addFiles(files)
  if (unsupported.length) {
    const names = unsupported.slice(0, 3).join(', ') + (unsupported.length > 3 ? ', …' : '')
    showToast(t('files.unsupported', { count: unsupported.length, names }), 'error')
  }
}

async function pick() {
  add(await pickFiles({ accept: DOCUMENT_ACCEPT, multiple: true }))
}

async function loadSamples() {
  try {
    add(await Promise.all([createSampleImage(), createSamplePdf()]))
  } catch (error) {
    console.error(error)
    showToast(t('errors.generic'), 'error')
  }
}

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false

function onDragEnter(event: DragEvent) {
  if (!hasFiles(event)) return
  event.preventDefault()
  dragDepth++
  dragging.value = true
}

function onDragOver(event: DragEvent) {
  if (!hasFiles(event)) return
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

function onDragLeave(event: DragEvent) {
  if (!hasFiles(event)) return
  dragDepth = Math.max(0, dragDepth - 1)
  if (!dragDepth) dragging.value = false
}

async function onDrop(event: DragEvent) {
  if (!hasFiles(event)) return
  event.preventDefault()
  dragDepth = 0
  dragging.value = false
  add(await filesFromDataTransfer(event.dataTransfer!))
}

function pastedName(file: File, index: number): File {
  // Pasted screenshots are all called "image.png"; give them distinguishable names.
  if (file.name && file.name !== 'image.png') return file
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  return new File([file], `pasted-${stamp}${index ? `-${index + 1}` : ''}.${ext}`, {
    type: file.type,
  })
}

function onPaste(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files ?? [])
  if (!files.length) return
  event.preventDefault()
  add(files.map(pastedName))
}

function isTyping(target: EventTarget | null): boolean {
  return !!(target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]')
}

function selectRelative(delta: number) {
  const index = items.findIndex((item) => item.id === activeId.value)
  const next = items[Math.min(Math.max(0, index + delta), items.length - 1)]
  if (next) activeId.value = next.id
}

function onKeyDown(event: KeyboardEvent) {
  const mod = event.metaKey || event.ctrlKey
  const key = event.key.toLowerCase()
  if (mod && key === 'o') {
    event.preventDefault()
    void pick()
    return
  }
  if (mod && key === 's') {
    event.preventDefault()
    if (exportState.running) return
    if (event.shiftKey) void exportFiles(items)
    else if (activeItem.value) void exportFiles([activeItem.value])
    return
  }
  if (mod || event.altKey || isTyping(event.target) || document.querySelector('dialog[open]'))
    return
  const pages = activeItem.value?.pages ?? 1
  switch (event.key) {
    case 'ArrowLeft':
      selectRelative(-1)
      break
    case 'ArrowRight':
      selectRelative(1)
      break
    case 'PageUp':
      activePage.value = Math.max(1, activePage.value - 1)
      break
    case 'PageDown':
      activePage.value = Math.min(pages, activePage.value + 1)
      break
    default:
      return
  }
  event.preventDefault()
}

onMounted(() => {
  window.addEventListener('dragenter', onDragEnter)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('dragleave', onDragLeave)
  window.addEventListener('drop', onDrop)
  window.addEventListener('paste', onPaste)
  window.addEventListener('keydown', onKeyDown)
  if (/MicroMessenger/i.test(navigator.userAgent)) {
    showToast(t('app.wechatHint'), 'info', { timeout: 0 })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('dragenter', onDragEnter)
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('dragleave', onDragLeave)
  window.removeEventListener('drop', onDrop)
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="app">
    <AppHeader @about="aboutOpen = true" />
    <main class="workspace">
      <StagePane @pick="pick" @sample="loadSamples" />
      <SettingsPanel />
    </main>
    <DropOverlay :visible="dragging" />
    <ToastHost />
    <PasswordDialog />
    <AboutDialog :open="aboutOpen" @close="aboutOpen = false" />
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100vh;
  height: 100dvh;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--panel-w);
  min-height: 0;
}

@media (max-width: 900px) {
  .app {
    height: auto;
    min-height: 100dvh;
  }

  .workspace {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
  }

  .workspace > :first-child {
    height: max(360px, 58dvh);
  }

  .workspace > :last-child :deep(.export-bar) {
    position: sticky;
    bottom: 0;
    z-index: 5;
  }
}
</style>
