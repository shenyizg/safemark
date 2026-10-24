<script setup lang="ts">
import { X } from '@lucide/vue'
import { onMounted, ref, useId, watch } from 'vue'

import { t } from '@/i18n'

const props = defineProps<{ open: boolean; title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement>()
const titleId = useId()

function sync() {
  const el = dialog.value
  if (!el) return
  if (props.open && !el.open) el.showModal()
  else if (!props.open && el.open) el.close()
}

watch(() => props.open, sync, { flush: 'post' })
onMounted(sync)

function onClick(event: MouseEvent) {
  // A click on the backdrop targets the <dialog> element itself.
  if (event.target === dialog.value) emit('close')
}

/**
 * The native `close` event fires asynchronously. Only report closes the user caused (Escape):
 * by the time an event from closing it programmatically arrives, the dialog may already show
 * new content (e.g. the next password prompt) that must not be dismissed.
 */
function onNativeClose() {
  if (props.open && !dialog.value?.open) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    :class="{ wide }"
    :aria-labelledby="titleId"
    @close="onNativeClose"
    @click="onClick"
  >
    <div class="modal-content">
      <header class="modal-head">
        <h2 :id="titleId" class="modal-title">{{ title }}</h2>
        <button
          type="button"
          class="icon-btn"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          <X />
        </button>
      </header>
      <div class="modal-body scroll-thin">
        <slot />
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(440px, calc(100vw - 32px));
  max-height: min(720px, calc(100dvh - 32px));
  padding: 0;
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  background: var(--c-surface);
  color: var(--c-text);
  box-shadow: var(--shadow-lg);
}

.modal.wide {
  width: min(640px, calc(100vw - 32px));
}

.modal::backdrop {
  background: var(--c-overlay);
  backdrop-filter: blur(2px);
}

.modal[open] {
  animation: pop 0.16s ease-out;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
}

.modal-content {
  display: flex;
  flex-direction: column;
  max-height: inherit;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 12px 6px 20px;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}

.modal-body {
  padding: 4px 20px 20px;
  overflow-y: auto;
}
</style>
