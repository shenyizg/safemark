<script setup lang="ts">
import { Code, Keyboard, SearchCheck, ShieldCheck } from '@lucide/vue'
import { computed } from 'vue'

import { t } from '@/i18n'
import BrandMark from './BrandMark.vue'
import ModalDialog from './ModalDialog.vue'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const version = __APP_VERSION__
const repoUrl = __REPO_URL__
const mod =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

const shortcuts = computed(() => [
  { keys: [mod, 'O'], label: t('about.shortcutOpen') },
  { keys: [mod, 'S'], label: t('about.shortcutExport') },
  { keys: [mod, 'Shift', 'S'], label: t('about.shortcutExportAll') },
  { keys: ['←', '→'], label: t('about.shortcutFiles') },
  { keys: ['PgUp', 'PgDn'], label: t('about.shortcutPages') },
])
</script>

<template>
  <ModalDialog :open="open" :title="t('about.title')" wide @close="$emit('close')">
    <div class="about">
      <div class="intro">
        <BrandMark class="logo" />
        <div>
          <strong class="name">SafeMark · {{ t('app.nameZh') }}</strong>
          <p>{{ t('about.intro') }}</p>
        </div>
      </div>

      <section>
        <h3><ShieldCheck aria-hidden="true" />{{ t('about.privacyTitle') }}</h3>
        <ul>
          <li>{{ t('about.privacy1') }}</li>
          <li>{{ t('about.privacy2') }}</li>
          <li>{{ t('about.privacy3') }}</li>
          <li>{{ t('about.privacy4') }}</li>
        </ul>
      </section>

      <section>
        <h3><SearchCheck aria-hidden="true" />{{ t('about.verifyTitle') }}</h3>
        <ul>
          <li>{{ t('about.verify1') }}</li>
          <li>{{ t('about.verify2') }}</li>
          <li>{{ t('about.verify3') }}</li>
        </ul>
      </section>

      <section>
        <h3><Keyboard aria-hidden="true" />{{ t('about.shortcutsTitle') }}</h3>
        <dl class="shortcuts">
          <template v-for="shortcut in shortcuts" :key="shortcut.label">
            <dt>
              <kbd v-for="key in shortcut.keys" :key="key" class="kbd">{{ key }}</kbd>
            </dt>
            <dd>{{ shortcut.label }}</dd>
          </template>
        </dl>
      </section>

      <section>
        <h3><Code aria-hidden="true" />{{ t('about.openSourceTitle') }}</h3>
        <p>
          {{ t('about.openSource') }}
          <a :href="repoUrl" target="_blank" rel="noopener noreferrer">{{
            repoUrl.replace('https://', '')
          }}</a>
        </p>
        <p class="muted">
          {{ t('about.credits') }}
          <a href="./third-party-licenses.txt" target="_blank" rel="noopener">{{
            t('about.licenses')
          }}</a>
        </p>
        <p class="muted">{{ t('about.version', { version }) }}</p>
      </section>
    </div>
  </ModalDialog>
</template>

<style scoped>
.about {
  display: grid;
  gap: 18px;
}

.intro {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.logo {
  flex: none;
  width: 44px;
  height: 44px;
}

.name {
  font-size: 15px;
}

.intro p,
section p {
  margin: 4px 0 0;
  color: var(--c-text-2);
}

h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  font-size: 14px;
}

h3 svg {
  width: 16px;
  height: 16px;
  color: var(--c-accent);
}

ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 22px;
  color: var(--c-text-2);
}

.shortcuts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 14px;
  margin: 0;
  color: var(--c-text-2);
}

.shortcuts dt {
  display: flex;
  gap: 4px;
}

.shortcuts dd {
  margin: 0;
}

.muted {
  color: var(--c-text-3) !important;
  font-size: 12.5px;
}
</style>
