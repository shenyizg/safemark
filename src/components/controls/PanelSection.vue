<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { ref, useId, watch } from 'vue'

import { readStored, writeStored } from '@/state/storage'

const props = withDefaults(
  defineProps<{ title: string; storageKey: string; defaultOpen?: boolean }>(),
  {
    defaultOpen: true,
  },
)

const saved = readStored(`section:${props.storageKey}`)
const open = ref(typeof saved === 'boolean' ? saved : props.defaultOpen)
watch(open, (value) => writeStored(`section:${props.storageKey}`, value))

const bodyId = useId()
</script>

<template>
  <section class="section" :class="{ open }">
    <div class="section-head">
      <button
        type="button"
        class="section-toggle"
        :aria-expanded="open"
        :aria-controls="bodyId"
        @click="open = !open"
      >
        <span class="section-icon" aria-hidden="true"><slot name="icon" /></span>
        <span class="section-title">{{ title }}</span>
        <ChevronDown class="chevron" aria-hidden="true" />
      </button>
      <div v-if="$slots.actions" class="section-actions"><slot name="actions" /></div>
    </div>
    <div v-show="open" :id="bodyId" class="section-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.section {
  border-bottom: 1px solid var(--c-border);
}

.section-head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 10px;
}

.section-toggle {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 13px 8px 13px 18px;
  border: 0;
  background: transparent;
  color: var(--c-text);
  font-weight: 600;
  text-align: left;
}

.section-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--c-accent-soft);
  color: var(--c-accent);
}

.section-icon :deep(svg) {
  width: 15px;
  height: 15px;
}

.section-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--c-text-3);
  transform: rotate(-90deg);
  transition: transform 0.18s;
}

.open .chevron {
  transform: none;
}

.section-actions {
  display: flex;
  gap: 2px;
}

.section-body {
  display: grid;
  gap: 14px;
  padding: 2px 18px 18px;
}
</style>
