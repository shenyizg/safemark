<script setup lang="ts">
import { computed, useId } from 'vue'

const model = defineModel<number>({ required: true })
const props = withDefaults(
  defineProps<{
    label: string
    min: number
    max: number
    step?: number
    unit?: string
    hint?: string
    /** Display multiplier, e.g. 100 to show a 0–1 value as percent. */
    scale?: number
  }>(),
  { step: 1, unit: '', hint: '', scale: 1 },
)

const id = useId()
const decimals = computed(() => {
  const text = String(props.step * props.scale)
  return text.includes('.') ? text.split('.')[1]!.length : 0
})
const display = computed(() => Number((model.value * props.scale).toFixed(decimals.value)))
const fill = computed(() => {
  const ratio = (model.value - props.min) / (props.max - props.min)
  return `${Math.min(100, Math.max(0, ratio * 100))}%`
})

function clamp(value: number): number {
  const stepped = Math.round((value - props.min) / props.step) * props.step + props.min
  return Number(Math.min(props.max, Math.max(props.min, stepped)).toFixed(6))
}

function onSlide(event: Event) {
  model.value = clamp(Number((event.target as HTMLInputElement).value))
}

function onType(event: Event) {
  const input = event.target as HTMLInputElement
  const value = Number(input.value)
  if (input.value.trim() !== '' && Number.isFinite(value)) model.value = clamp(value / props.scale)
  input.value = String(display.value)
}
</script>

<template>
  <div class="field">
    <div class="field-head">
      <label :for="id" class="field-label">{{ label }}</label>
      <span class="field-value">
        <input
          class="input number"
          type="number"
          inputmode="decimal"
          :min="min * scale"
          :max="max * scale"
          :step="step * scale"
          :value="display"
          :aria-label="label"
          @change="onType"
          @keydown.enter="onType"
        />
        <span v-if="unit" class="unit">{{ unit }}</span>
      </span>
    </div>
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="model"
      :style="{ '--fill': fill }"
      @input="onSlide"
    />
    <p v-if="hint" class="hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 4px;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.field-label {
  color: var(--c-text-2);
  font-size: 13px;
}

.field-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.number {
  width: 64px;
  height: 26px;
  padding: 0 6px;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  -moz-appearance: textfield;
}

.number::-webkit-inner-spin-button,
.number::-webkit-outer-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.unit {
  min-width: 18px;
  color: var(--c-text-3);
  font-size: 12px;
}

.hint {
  margin: 2px 0 0;
  color: var(--c-text-3);
  font-size: 12px;
}
</style>
