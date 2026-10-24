<script setup lang="ts">
import { FileUp, ScanSearch } from '@lucide/vue'
import { computed, ref, useId } from 'vue'

import { FONT_FILE_ACCEPT, GENERIC_FONTS, supportsLocalFontAccess } from '@/core/fonts'
import { pickFiles } from '@/core/picker'
import { locale, t, type MessageKey } from '@/i18n'
import { addFontFile, fonts, loadLocalFonts } from '@/state/fonts'
import { showToast } from '@/state/toasts'

const model = defineModel<string>({ required: true })
defineProps<{ label: string }>()

const id = useId()
const scanning = ref(false)
const canScan = supportsLocalFontAccess()

interface Option {
  value: string
  label: string
}

const groups = computed(() => {
  const zh = locale.value === 'zh-CN'
  const named = fonts.detected.filter((font) => font.zh)
  const others = fonts.detected.filter((font) => !font.zh)
  const list: { label: string; options: Option[] }[] = [
    {
      label: t('font.group.generic'),
      options: GENERIC_FONTS.map((g) => ({
        value: g,
        label: t(`font.generic.${g}` as MessageKey),
      })),
    },
    {
      label: t('font.group.chinese'),
      options: named.map((f) => ({ value: f.family, label: zh ? f.zh! : f.family })),
    },
    {
      label: t('font.group.other'),
      options: others.map((f) => ({ value: f.family, label: f.family })),
    },
    { label: t('font.group.local'), options: fonts.local.map((f) => ({ value: f, label: f })) },
    {
      label: t('font.group.custom'),
      options: fonts.custom.map((f) => ({ value: f.family, label: f.label })),
    },
  ]
  return list.filter((group) => group.options.length)
})

/** A saved font that is not detected (yet) still shows up as the selected value. */
const unlisted = computed(() =>
  groups.value.some((group) => group.options.some((option) => option.value === model.value))
    ? null
    : model.value,
)

async function scan() {
  scanning.value = true
  try {
    const count = await loadLocalFonts()
    showToast(t('font.scanDone', { count }), 'success')
  } catch {
    showToast(t('font.scanFailed'), 'error')
  } finally {
    scanning.value = false
  }
}

async function upload() {
  const [file] = await pickFiles({ accept: FONT_FILE_ACCEPT })
  if (!file) return
  try {
    model.value = await addFontFile(file)
  } catch {
    showToast(t('font.loadFailed', { name: file.name }), 'error')
  }
}
</script>

<template>
  <div class="field">
    <label :for="id" class="field-label">{{ label }}</label>
    <select :id="id" v-model="model" class="select">
      <option v-if="unlisted" :value="unlisted">{{ unlisted }}</option>
      <optgroup v-for="group in groups" :key="group.label" :label="group.label">
        <option v-for="option in group.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </optgroup>
    </select>
    <div class="actions">
      <button
        v-if="canScan"
        type="button"
        class="btn btn-sm btn-ghost"
        :disabled="scanning"
        @click="scan"
      >
        <ScanSearch aria-hidden="true" />{{ t('font.scan') }}
      </button>
      <button type="button" class="btn btn-sm btn-ghost" @click="upload">
        <FileUp aria-hidden="true" />{{ t('font.upload') }}
      </button>
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-left: -8px;
}

.actions .btn {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
}

.actions svg {
  width: 14px;
  height: 14px;
}
</style>
