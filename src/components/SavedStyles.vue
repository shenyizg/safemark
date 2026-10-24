<script setup lang="ts">
import { Bookmark, Check, Plus, X } from '@lucide/vue'
import { nextTick, ref } from 'vue'

import { t } from '@/i18n'
import {
  applySavedStyle,
  deleteSavedStyle,
  MAX_SAVED_STYLES,
  savedStyles,
  saveStyle,
} from '@/state/settings'
import { showToast } from '@/state/toasts'

const naming = ref(false)
const name = ref('')
const input = ref<HTMLInputElement>()

async function startNaming() {
  if (savedStyles.length >= MAX_SAVED_STYLES) {
    showToast(t('styles.limit', { max: MAX_SAVED_STYLES }), 'error')
    return
  }
  name.value = ''
  naming.value = true
  await nextTick()
  input.value?.focus()
}

function save() {
  if (!name.value.trim()) return
  const style = saveStyle(name.value)
  naming.value = false
  if (style) showToast(t('styles.saved', { name: style.name }), 'success')
}
</script>

<template>
  <div class="saved" role="group" :aria-label="t('styles.title')">
    <span class="title"><Bookmark aria-hidden="true" />{{ t('styles.title') }}</span>
    <div class="list">
      <span v-for="style in savedStyles" :key="style.id" class="style">
        <button
          type="button"
          class="chip"
          :title="t('styles.apply', { name: style.name })"
          @click="applySavedStyle(style.id)"
        >
          {{ style.name }}
        </button>
        <button
          type="button"
          class="remove"
          :title="t('styles.delete', { name: style.name })"
          :aria-label="t('styles.delete', { name: style.name })"
          @click="deleteSavedStyle(style.id)"
        >
          <X aria-hidden="true" />
        </button>
      </span>

      <form v-if="naming" class="naming" @submit.prevent="save">
        <input
          ref="input"
          v-model="name"
          class="input"
          maxlength="40"
          :placeholder="t('styles.namePlaceholder')"
          :aria-label="t('styles.namePlaceholder')"
          @keydown.esc.prevent="naming = false"
        />
        <button
          type="submit"
          class="icon-btn"
          :disabled="!name.trim()"
          :title="t('styles.confirm')"
          :aria-label="t('styles.confirm')"
        >
          <Check />
        </button>
        <button
          type="button"
          class="icon-btn"
          :title="t('common.cancel')"
          :aria-label="t('common.cancel')"
          @click="naming = false"
        >
          <X />
        </button>
      </form>
      <button v-else type="button" class="chip add" @click="startNaming">
        <Plus aria-hidden="true" />{{ t('styles.save') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.saved {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--c-text-2);
  font-size: 12px;
}

.title svg {
  width: 13px;
  height: 13px;
}

.list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.style {
  position: relative;
  display: inline-flex;
  max-width: 100%;
}

.style .chip {
  padding-right: 22px;
}

.remove {
  position: absolute;
  top: 50%;
  right: 4px;
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--c-text-3);
  transform: translateY(-50%);
}

.remove:hover {
  background: var(--c-danger-soft);
  color: var(--c-danger);
}

.remove svg {
  width: 11px;
  height: 11px;
}

.add {
  border-style: dashed;
}

.add svg {
  width: 13px;
  height: 13px;
}

.naming {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 2px;
  min-width: 180px;
}

.naming .input {
  height: 28px;
  font-size: 12.5px;
}

.naming .icon-btn {
  width: 28px;
  height: 28px;
}

.naming .icon-btn svg {
  width: 15px;
  height: 15px;
}
</style>
