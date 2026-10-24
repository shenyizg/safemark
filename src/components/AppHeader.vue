<script setup lang="ts">
import { Info, Moon, ShieldCheck, Sun, SunMoon } from '@lucide/vue'
import { computed } from 'vue'

import { locale, t } from '@/i18n'
import { cycleTheme, theme } from '@/state/theme'
import BrandMark from './BrandMark.vue'
import GithubIcon from './GithubIcon.vue'

defineEmits<{ about: [] }>()

const repoUrl = __REPO_URL__
const themeIcon = computed(() =>
  theme.value === 'light' ? Sun : theme.value === 'dark' ? Moon : SunMoon,
)
const themeLabel = computed(() => t(`theme.${theme.value}`))

function toggleLocale() {
  locale.value = locale.value === 'zh-CN' ? 'en' : 'zh-CN'
}
</script>

<template>
  <header class="header">
    <div class="brand">
      <BrandMark class="logo" />
      <div class="brand-text">
        <h1 class="brand-name">SafeMark</h1>
        <span class="brand-tagline">{{ t('app.tagline') }}</span>
      </div>
    </div>

    <button type="button" class="privacy" @click="$emit('about')">
      <ShieldCheck aria-hidden="true" />
      <span>{{ t('app.privacyBadge') }}</span>
    </button>

    <nav class="actions" :aria-label="t('app.actions')">
      <button
        type="button"
        class="btn btn-sm btn-ghost lang"
        :title="t('app.language')"
        @click="toggleLocale"
      >
        {{ locale === 'zh-CN' ? 'EN' : '中文' }}
        <span class="visually-hidden">{{ t('app.language') }}</span>
      </button>
      <button
        type="button"
        class="icon-btn"
        :title="themeLabel"
        :aria-label="themeLabel"
        @click="cycleTheme"
      >
        <component :is="themeIcon" />
      </button>
      <button
        type="button"
        class="icon-btn"
        :title="t('about.title')"
        :aria-label="t('about.title')"
        @click="$emit('about')"
      >
        <Info />
      </button>
      <a
        class="icon-btn"
        :href="repoUrl"
        target="_blank"
        rel="noopener noreferrer"
        :title="t('app.source')"
        :aria-label="t('app.source')"
      >
        <GithubIcon />
      </a>
    </nav>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  height: var(--header-h);
  padding: 0 12px 0 18px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.logo {
  flex: none;
  width: 30px;
  height: 30px;
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.brand-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brand-tagline {
  overflow: hidden;
  color: var(--c-text-3);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.privacy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin-left: auto;
  padding: 0 11px;
  border: 1px solid color-mix(in srgb, var(--c-success) 35%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-success) 10%, transparent);
  color: var(--c-success);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}

.privacy svg {
  width: 15px;
  height: 15px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.lang {
  min-width: 46px;
  font-weight: 600;
}

.actions a.icon-btn {
  text-decoration: none;
}

.actions a.icon-btn svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 720px) {
  .brand-tagline {
    display: none;
  }

  .header {
    gap: 8px;
    padding: 0 6px 0 12px;
  }
}

@media (max-width: 480px) {
  .privacy span {
    display: none;
  }

  .privacy {
    width: 30px;
    padding: 0;
    justify-content: center;
  }
}
</style>
