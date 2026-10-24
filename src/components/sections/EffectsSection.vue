<script setup lang="ts">
import { Sparkles } from '@lucide/vue'

import { LIMITS } from '@/core/config'
import { t } from '@/i18n'
import { config } from '@/state/settings'
import FieldColor from '../controls/FieldColor.vue'
import FieldRange from '../controls/FieldRange.vue'
import FieldSwitch from '../controls/FieldSwitch.vue'
import PanelSection from '../controls/PanelSection.vue'
</script>

<template>
  <PanelSection :title="t('effects.title')" storage-key="effects" :default-open="false">
    <template #icon><Sparkles /></template>

    <template v-if="config.kind === 'text'">
      <FieldSwitch
        v-model="config.frameEnabled"
        :label="t('effects.frame')"
        :hint="t('effects.frameHint')"
      />
      <div v-if="config.frameEnabled" class="group">
        <FieldRange
          v-model="config.frameWidth"
          :label="t('effects.frameWidth')"
          v-bind="LIMITS.frameWidth"
          unit="%"
        />
        <FieldRange
          v-model="config.framePadding"
          :label="t('effects.framePadding')"
          v-bind="LIMITS.framePadding"
          unit="em"
        />
      </div>

      <FieldSwitch
        v-model="config.strokeEnabled"
        :label="t('effects.stroke')"
        :hint="t('effects.strokeHint')"
      />
      <div v-if="config.strokeEnabled" class="group">
        <FieldColor
          v-model="config.strokeColor"
          :label="t('effects.strokeColor')"
          :swatches="['#ffffff', '#000000']"
        />
        <FieldRange
          v-model="config.strokeWidth"
          :label="t('effects.strokeWidth')"
          v-bind="LIMITS.strokeWidth"
          unit="%"
        />
      </div>
    </template>

    <FieldSwitch
      v-model="config.shadowEnabled"
      :label="t('effects.shadow')"
      :hint="t('effects.shadowHint')"
    />
    <div v-if="config.shadowEnabled" class="group">
      <FieldColor
        v-model="config.shadowColor"
        :label="t('effects.shadowColor')"
        :swatches="['#000000', '#ffffff']"
      />
      <FieldRange
        v-model="config.shadowBlur"
        :label="t('effects.shadowBlur')"
        v-bind="LIMITS.shadowBlur"
        unit="%"
      />
      <FieldRange
        v-model="config.shadowOffset"
        :label="t('effects.shadowOffset')"
        v-bind="LIMITS.shadowOffset"
        unit="%"
      />
    </div>
  </PanelSection>
</template>

<style scoped>
.group {
  display: grid;
  gap: 14px;
  margin-top: -4px;
  padding: 12px;
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
</style>
