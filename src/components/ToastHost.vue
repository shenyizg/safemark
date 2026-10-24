<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, X } from '@lucide/vue'

import { t } from '@/i18n'
import { dismissToast, toasts, type Toast } from '@/state/toasts'

const ICONS = { info: Info, success: CircleCheck, error: CircleAlert }

function run(toast: Toast) {
  toast.action?.run()
  dismissToast(toast.id)
}
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.kind"
        :role="toast.kind === 'error' ? 'alert' : 'status'"
      >
        <component :is="ICONS[toast.kind]" class="icon" aria-hidden="true" />
        <p class="message">{{ toast.message }}</p>
        <button v-if="toast.action" type="button" class="btn btn-sm action" @click="run(toast)">
          {{ toast.action.label }}
        </button>
        <button
          type="button"
          class="icon-btn close"
          :aria-label="t('common.close')"
          @click="dismissToast(toast.id)"
        >
          <X />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  bottom: calc(20px + env(safe-area-inset-bottom));
  left: 50%;
  z-index: 60;
  display: grid;
  gap: 8px;
  width: min(440px, calc(100vw - 24px));
  transform: translateX(calc(-50% - var(--panel-w) / 2));
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 6px 10px 14px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.icon {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  color: var(--c-accent);
}

.success .icon {
  color: var(--c-success);
}

.error .icon {
  color: var(--c-danger);
}

.message {
  flex: 1;
  min-width: 0;
  margin: 1px 0;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.action {
  flex: none;
}

.close {
  flex: none;
  width: 26px;
  height: 26px;
}

.close svg {
  width: 15px;
  height: 15px;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .toasts {
    top: calc(var(--header-h) + 10px);
    bottom: auto;
    transform: translateX(-50%);
  }
}
</style>
