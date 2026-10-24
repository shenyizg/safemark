<script setup lang="ts">
import { computed } from 'vue'

import { t, type MessageKey } from '@/i18n'
import { applyStylePreset, type StylePreset } from '@/state/settings'

const PRESETS: StylePreset[] = ['classic', 'dense', 'center', 'corner', 'stamp']

const presets = computed(() =>
  PRESETS.map((id) => ({ id, label: t(`preset.${id}` as MessageKey) })),
)
</script>

<template>
  <div class="presets" role="group" :aria-label="t('preset.title')">
    <button
      v-for="preset in presets"
      :key="preset.id"
      type="button"
      class="preset"
      :title="preset.label"
      @click="applyStylePreset(preset.id)"
    >
      <svg viewBox="0 0 48 34" class="thumb" aria-hidden="true">
        <rect x="0.5" y="0.5" width="47" height="33" rx="4" class="paper" />
        <g v-if="preset.id === 'classic'" class="ink" transform="rotate(-30 24 17)">
          <path d="M2 8h10M18 8h10M34 8h10M10 17h10M26 17h10M2 26h10M18 26h10M34 26h10" />
        </g>
        <g v-else-if="preset.id === 'dense'" class="ink thin" transform="rotate(-25 24 17)">
          <path
            d="M0 5h6M10 5h6M20 5h6M30 5h6M40 5h6M5 11h6M15 11h6M25 11h6M35 11h6M0 17h6M10 17h6M20 17h6M30 17h6M40 17h6M5 23h6M15 23h6M25 23h6M35 23h6M0 29h6M10 29h6M20 29h6M30 29h6M40 29h6"
          />
        </g>
        <g v-else-if="preset.id === 'center'" class="ink bold" transform="rotate(-30 24 17)">
          <path d="M11 17h26" />
        </g>
        <g v-else-if="preset.id === 'corner'">
          <rect x="0.5" y="0.5" width="47" height="33" rx="4" class="photo" />
          <path d="M30 27h12" class="ink-light" />
        </g>
        <g v-else class="stamp" transform="rotate(-18 24 17)">
          <rect x="12" y="11" width="24" height="12" rx="2.5" />
          <path d="M17 17h14" />
        </g>
      </svg>
      <span class="label">{{ preset.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.presets {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.preset {
  display: grid;
  justify-items: center;
  gap: 4px;
  min-width: 0;
  padding: 6px 2px 5px;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  background: transparent;
  color: var(--c-text-2);
  transition:
    background-color 0.15s,
    border-color 0.15s;
}

.preset:hover {
  border-color: var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-text);
}

.thumb {
  width: 100%;
  max-width: 52px;
  height: auto;
}

.paper {
  fill: var(--c-surface);
  stroke: var(--c-border-strong);
}

.photo {
  fill: #4a4f7a;
  stroke: none;
}

.ink path,
.ink-light,
.stamp path {
  fill: none;
  stroke-linecap: round;
}

.ink path {
  stroke: var(--c-text-3);
  stroke-width: 2.4;
}

.ink.thin path {
  stroke-width: 1.8;
  opacity: 0.8;
}

.ink.bold path {
  stroke-width: 5;
  opacity: 0.55;
}

.ink-light {
  stroke: #fff;
  stroke-width: 2.6;
}

.stamp rect {
  fill: none;
  stroke: #d0312d;
  stroke-width: 1.6;
}

.stamp path {
  stroke: #d0312d;
  stroke-width: 2.6;
}

.label {
  max-width: 100%;
  overflow: hidden;
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
