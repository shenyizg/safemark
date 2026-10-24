<script setup lang="ts">
import { Download, FileArchive, LoaderCircle, X } from '@lucide/vue'
import { computed } from 'vue'

import { t } from '@/i18n'
import { cancelExport, exportFiles, exportState } from '@/state/exporter'
import { activeItem, items } from '@/state/files'

const readyItems = computed(() => items.filter((item) => item.status === 'ready'))
const canExportCurrent = computed(() => activeItem.value?.status === 'ready')

const progress = computed(() => {
  if (!exportState.total) return 0
  return Math.min(1, (exportState.done + exportState.fileProgress) / exportState.total)
})

function exportCurrent() {
  if (activeItem.value) void exportFiles([activeItem.value])
}

function exportAll() {
  void exportFiles(readyItems.value)
}
</script>

<template>
  <div class="export-bar">
    <div v-if="exportState.running" class="progress" role="status" aria-live="polite">
      <div class="progress-head">
        <LoaderCircle class="spin" aria-hidden="true" />
        <span class="progress-text">
          {{
            t('export.progress', {
              done: Math.min(exportState.done + 1, exportState.total),
              total: exportState.total,
            })
          }}
          <span class="progress-name">{{ exportState.currentName }}</span>
        </span>
        <button type="button" class="btn btn-sm btn-ghost" @click="cancelExport">
          <X aria-hidden="true" />{{ t('common.cancel') }}
        </button>
      </div>
      <div class="bar"><div class="bar-fill" :style="{ width: `${progress * 100}%` }" /></div>
    </div>
    <div v-else class="buttons" :class="{ single: items.length <= 1 }">
      <button
        v-if="items.length > 1"
        type="button"
        class="btn btn-lg"
        :disabled="!canExportCurrent"
        :title="t('export.currentHint')"
        @click="exportCurrent"
      >
        <Download aria-hidden="true" />{{ t('export.current') }}
      </button>
      <button
        type="button"
        class="btn btn-lg btn-primary"
        :disabled="!readyItems.length"
        @click="exportAll"
      >
        <FileArchive v-if="readyItems.length > 1" aria-hidden="true" />
        <Download v-else aria-hidden="true" />
        {{
          readyItems.length > 1 ? t('export.allZip', { count: readyItems.length }) : t('export.all')
        }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.export-bar {
  padding: 14px 18px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--c-border);
  background: var(--c-surface);
}

.buttons {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
}

.buttons.single {
  grid-template-columns: 1fr;
}

.buttons .btn {
  min-width: 0;
  padding: 0 12px;
}

.progress {
  display: grid;
  gap: 10px;
}

.progress-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
}

.progress-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-name {
  margin-left: 6px;
  color: var(--c-text-3);
  font-weight: 400;
}

.bar {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--c-surface-3);
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--c-accent);
  transition: width 0.2s;
}

.spin {
  flex: none;
  width: 18px;
  height: 18px;
  color: var(--c-accent);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
