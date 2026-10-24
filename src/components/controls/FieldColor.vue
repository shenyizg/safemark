<script setup lang="ts">
import { useId } from 'vue'

import { t } from '@/i18n'

const model = defineModel<string>({ required: true })
withDefaults(defineProps<{ label: string; swatches?: string[] }>(), { swatches: () => [] })

const id = useId()

function onHex(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value.trim().toLowerCase()
  if (!value.startsWith('#')) value = `#${value}`
  if (/^#[0-9a-f]{3}$/.test(value)) value = `#${[...value.slice(1)].map((c) => c + c).join('')}`
  if (/^#[0-9a-f]{6}$/.test(value)) model.value = value
  input.value = model.value
}
</script>

<template>
  <div class="field">
    <label :for="id" class="field-label">{{ label }}</label>
    <div class="control">
      <label class="swatch" :style="{ backgroundColor: model }" :title="model">
        <input
          v-model="model"
          type="color"
          class="native"
          :aria-label="t('common.colorPicker', { label })"
        />
      </label>
      <input
        :id="id"
        class="input hex"
        :value="model"
        maxlength="7"
        spellcheck="false"
        autocomplete="off"
        @change="onHex"
        @keydown.enter="onHex"
      />
      <div v-if="swatches.length" class="presets">
        <button
          v-for="color in swatches"
          :key="color"
          type="button"
          class="preset"
          :class="{ active: color === model }"
          :style="{ backgroundColor: color }"
          :title="color"
          :aria-label="color"
          @click="model = color"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 6px;
}

.field-label {
  color: var(--c-text-2);
  font-size: 13px;
}

.control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.swatch {
  position: relative;
  flex: none;
  width: 32px;
  height: 32px;
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-sm);
  box-shadow: inset 0 0 0 2px var(--c-surface);
  cursor: pointer;
}

.native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.hex {
  width: 84px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  text-transform: lowercase;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.preset {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--c-border-strong);
  border-radius: 50%;
  transition: transform 0.12s;
}

.preset:hover {
  transform: scale(1.12);
}

.preset.active {
  box-shadow:
    0 0 0 2px var(--c-surface),
    0 0 0 4px var(--c-accent);
}
</style>
