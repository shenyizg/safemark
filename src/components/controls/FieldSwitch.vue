<script setup lang="ts">
import { useId } from 'vue'

const model = defineModel<boolean>({ required: true })
defineProps<{ label: string; hint?: string }>()

const id = useId()
</script>

<template>
  <div class="field">
    <div class="row">
      <label :id="id" class="field-label" @click="model = !model">{{ label }}</label>
      <button
        type="button"
        role="switch"
        class="switch"
        :aria-checked="model"
        :aria-labelledby="id"
        @click="model = !model"
      >
        <span class="knob" />
      </button>
    </div>
    <p v-if="hint" class="hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.field-label {
  color: var(--c-text-2);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.switch {
  position: relative;
  flex: none;
  width: 36px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--c-border-strong);
  transition: background-color 0.18s;
}

.switch[aria-checked='true'] {
  background: var(--c-accent);
}

.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.18s;
}

.switch[aria-checked='true'] .knob {
  transform: translateX(16px);
}

.hint {
  margin: 4px 0 0;
  color: var(--c-text-3);
  font-size: 12px;
}
</style>
