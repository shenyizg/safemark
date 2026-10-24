<script setup lang="ts">
import { Image as ImageIcon, ImagePlus, RefreshCw, Trash, Type } from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'

import { pickFiles } from '@/core/picker'
import { TEMPLATE_VARIABLES } from '@/core/template'
import { locale, t, type MessageKey } from '@/i18n'
import { TEXT_TEMPLATES } from '@/i18n/templates'
import { clearLogo, config, logo, setLogoFile } from '@/state/settings'
import { showToast } from '@/state/toasts'
import PanelSection from '../controls/PanelSection.vue'
import SegmentedControl from '../controls/SegmentedControl.vue'

const textarea = ref<HTMLTextAreaElement>()
const templates = computed(() => TEXT_TEMPLATES[locale.value])

const kinds = computed(() => [
  { value: 'text' as const, label: t('content.kindText'), icon: Type },
  { value: 'image' as const, label: t('content.kindImage'), icon: ImageIcon },
])

const VARIABLES = TEMPLATE_VARIABLES.filter((name) => name !== 'datetime')
const token = (name: string) => `{${name}}`

function insertVariable(name: string) {
  const text = token(name)
  const el = textarea.value
  const start = el?.selectionStart ?? config.text.length
  const end = el?.selectionEnd ?? start
  config.text = config.text.slice(0, start) + text + config.text.slice(end)
  void nextTick(() => {
    el?.focus()
    el?.setSelectionRange(start + text.length, start + text.length)
  })
}

async function chooseLogo() {
  const [file] = await pickFiles({ accept: 'image/*' })
  if (!file) return
  try {
    await setLogoFile(file)
    config.kind = 'image'
  } catch {
    showToast(t('content.logoFailed', { name: file.name }), 'error')
  }
}
</script>

<template>
  <PanelSection :title="t('content.title')" storage-key="content">
    <template #icon><Type /></template>

    <SegmentedControl v-model="config.kind" :options="kinds" :label="t('content.kind')" />

    <template v-if="config.kind === 'text'">
      <div class="field">
        <label for="watermark-text" class="field-label">{{ t('content.text') }}</label>
        <textarea
          id="watermark-text"
          ref="textarea"
          v-model="config.text"
          class="textarea"
          rows="3"
          maxlength="2000"
          :placeholder="t('content.placeholder')"
          spellcheck="false"
        />
        <div class="variables">
          <span class="mini-label">{{ t('content.variables') }}</span>
          <button
            v-for="name in VARIABLES"
            :key="name"
            type="button"
            class="chip mono"
            :title="t(`variables.${name}` as MessageKey)"
            @click="insertVariable(name)"
          >
            {{ token(name) }}
          </button>
        </div>
      </div>
      <div class="field">
        <span class="mini-label">{{ t('content.templates') }}</span>
        <div class="chips">
          <button
            v-for="text in templates"
            :key="text"
            type="button"
            class="chip"
            :title="text"
            @click="config.text = text"
          >
            {{ text.replace(/\n/g, ' ') }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="logo" class="logo">
        <div class="logo-thumb">
          <img :src="logo.image.src" :alt="logo.name" />
        </div>
        <div class="logo-info">
          <div class="logo-name" :title="logo.name">{{ logo.name }}</div>
          <div class="logo-size">{{ logo.width }} × {{ logo.height }}</div>
          <div class="logo-actions">
            <button type="button" class="btn btn-sm" @click="chooseLogo">
              <RefreshCw aria-hidden="true" />{{ t('content.logoReplace') }}
            </button>
            <button
              type="button"
              class="icon-btn"
              :title="t('content.logoRemove')"
              :aria-label="t('content.logoRemove')"
              @click="clearLogo"
            >
              <Trash />
            </button>
          </div>
        </div>
      </div>
      <button v-else type="button" class="logo-pick" @click="chooseLogo">
        <ImagePlus aria-hidden="true" />
        <span>{{ t('content.logoPick') }}</span>
      </button>
      <p class="hint">{{ t('content.logoHint') }}</p>
    </template>
  </PanelSection>
</template>

<style scoped>
.field {
  display: grid;
  gap: 6px;
}

.field-label,
.mini-label {
  color: var(--c-text-2);
  font-size: 13px;
}

.mini-label {
  margin-right: 2px;
  font-size: 12px;
}

.textarea {
  min-height: 76px;
}

.variables,
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.mono {
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.logo {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logo-thumb {
  display: grid;
  flex: none;
  place-items: center;
  width: 72px;
  height: 72px;
  padding: 6px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: repeating-conic-gradient(var(--c-surface-3) 0 25%, var(--c-surface) 0 50%) 0 0 / 12px
    12px;
}

.logo-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.logo-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.logo-name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logo-size {
  color: var(--c-text-3);
  font-size: 12px;
}

.logo-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.logo-pick {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 72px;
  border: 1.5px dashed var(--c-border-strong);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
  color: var(--c-text-2);
  font-weight: 500;
  transition:
    border-color 0.15s,
    color 0.15s;
}

.logo-pick:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}

.logo-pick svg {
  width: 20px;
  height: 20px;
}

.hint {
  margin: -6px 0 0;
  color: var(--c-text-3);
  font-size: 12px;
}
</style>
