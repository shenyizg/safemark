<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'

import { t } from '@/i18n'
import { resetStyle } from '@/state/settings'
import ExportBar from './ExportBar.vue'
import PresetBar from './PresetBar.vue'
import SavedStyles from './SavedStyles.vue'
import ContentSection from './sections/ContentSection.vue'
import EffectsSection from './sections/EffectsSection.vue'
import ExportSection from './sections/ExportSection.vue'
import LayoutSection from './sections/LayoutSection.vue'
import StyleSection from './sections/StyleSection.vue'
</script>

<template>
  <aside class="panel" :aria-label="t('panel.title')">
    <div class="panel-scroll scroll-thin">
      <div class="panel-head">
        <h2 class="panel-title">{{ t('panel.title') }}</h2>
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          :title="t('panel.resetHint')"
          @click="resetStyle"
        >
          <RotateCcw aria-hidden="true" />{{ t('panel.reset') }}
        </button>
      </div>
      <div class="presets-wrap">
        <PresetBar />
        <SavedStyles />
      </div>
      <ContentSection />
      <StyleSection />
      <LayoutSection />
      <EffectsSection />
      <ExportSection />
      <p class="privacy-note">{{ t('panel.privacyNote') }}</p>
    </div>
    <ExportBar />
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-left: 1px solid var(--c-border);
  background: var(--c-surface);
}

.panel-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px 4px 18px;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.presets-wrap {
  padding: 4px 12px 12px;
  border-bottom: 1px solid var(--c-border);
}

.privacy-note {
  margin: 0;
  padding: 16px 18px 20px;
  color: var(--c-text-3);
  font-size: 12px;
}

@media (max-width: 900px) {
  .panel {
    border-top: 1px solid var(--c-border);
    border-left: 0;
  }

  .panel-scroll {
    overflow: visible;
  }
}
</style>
