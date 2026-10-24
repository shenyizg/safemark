<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue'

const model = defineModel<T>({ required: true })
defineProps<{ label: string; options: { value: T; label: string }[]; hint?: string }>()

const id = useId()
</script>

<template>
  <div class="field">
    <label :for="id" class="field-label">{{ label }}</label>
    <select :id="id" v-model="model" class="select">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="hint" class="hint">{{ hint }}</p>
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

.hint {
  margin: 0;
  color: var(--c-text-3);
  font-size: 12px;
}
</style>
