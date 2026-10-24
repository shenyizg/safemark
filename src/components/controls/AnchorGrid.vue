<script setup lang="ts">
import type { Anchor } from '@/core/config'
import { t, type MessageKey } from '@/i18n'

const model = defineModel<Anchor>({ required: true })
defineProps<{ label: string }>()

const ANCHORS: Exclude<Anchor, 'custom'>[] = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
]
</script>

<template>
  <div class="grid" role="radiogroup" :aria-label="label">
    <button
      v-for="anchor in ANCHORS"
      :key="anchor"
      type="button"
      role="radio"
      class="cell"
      :aria-checked="model === anchor"
      :aria-label="t(`anchor.${anchor}` as MessageKey)"
      :title="t(`anchor.${anchor}` as MessageKey)"
      @click="model = anchor"
    >
      <span class="dot" />
    </button>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  width: 96px;
  padding: 3px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}

.cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
}

.cell:hover {
  background: var(--c-surface-3);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-border-strong);
  transition:
    transform 0.15s,
    background-color 0.15s;
}

.cell[aria-checked='true'] .dot {
  background: var(--c-accent);
  transform: scale(1.5);
}
</style>
