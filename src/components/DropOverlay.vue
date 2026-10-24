<script setup lang="ts">
import { Upload } from '@lucide/vue'

import { t } from '@/i18n'

defineProps<{ visible: boolean }>()
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="overlay" aria-hidden="true">
      <div class="card">
        <Upload class="icon" />
        <strong>{{ t('drop.title') }}</strong>
        <span>{{ t('drop.subtitle') }}</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--c-accent) 14%, var(--c-overlay));
  backdrop-filter: blur(3px);
  pointer-events: none;
}

.card {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 36px 48px;
  border: 2px dashed var(--c-accent);
  border-radius: 20px;
  background: var(--c-surface);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.icon {
  width: 34px;
  height: 34px;
  margin-bottom: 6px;
  color: var(--c-accent);
}

strong {
  font-size: 17px;
}

span {
  color: var(--c-text-2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
