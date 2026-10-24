<script setup lang="ts" generic="T extends string | number">
import type { SegmentOption } from './types'

const model = defineModel<T>({ required: true })
defineProps<{ options: SegmentOption<T>[]; label: string; iconOnly?: boolean }>()
</script>

<template>
  <div class="segmented" role="radiogroup" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      class="segment"
      :class="{ 'icon-only': iconOnly }"
      :aria-checked="model === option.value"
      :aria-label="iconOnly ? option.label : undefined"
      :title="option.title ?? (iconOnly ? option.label : undefined)"
      @click="model = option.value"
    >
      <component :is="option.icon" v-if="option.icon" class="icon" aria-hidden="true" />
      <span v-if="!iconOnly">{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.segmented {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--r-md);
  background: var(--c-surface-3);
}

.segment {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--c-text-2);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition:
    background-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}

.segment:hover {
  color: var(--c-text);
}

.segment[aria-checked='true'] {
  background: var(--c-surface);
  color: var(--c-text);
  box-shadow: var(--shadow-md);
}

.segment.icon-only {
  flex: none;
  width: 34px;
  padding: 0;
}

.icon {
  flex: none;
  width: 15px;
  height: 15px;
}
</style>
