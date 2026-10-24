<script setup lang="ts">
import { Grid3x3, LayoutGrid, Move, Square } from '@lucide/vue'
import { computed, useId } from 'vue'

import { LIMITS } from '@/core/config'
import { t } from '@/i18n'
import { config } from '@/state/settings'
import AnchorGrid from '../controls/AnchorGrid.vue'
import FieldRange from '../controls/FieldRange.vue'
import FieldSwitch from '../controls/FieldSwitch.vue'
import PanelSection from '../controls/PanelSection.vue'
import SegmentedControl from '../controls/SegmentedControl.vue'

const modes = computed(() => [
  { value: 'tile' as const, label: t('layout.tile'), icon: Grid3x3 },
  { value: 'single' as const, label: t('layout.single'), icon: Square },
])

const ANGLES = [-45, 0, 30, 45, 90]
const densityId = useId()
</script>

<template>
  <PanelSection :title="t('layout.title')" storage-key="layout">
    <template #icon><LayoutGrid /></template>

    <SegmentedControl v-model="config.layout" :options="modes" :label="t('layout.mode')" />

    <div class="field">
      <FieldRange
        v-model="config.rotation"
        :label="t('layout.rotation')"
        v-bind="LIMITS.rotation"
        unit="°"
      />
      <div class="chips">
        <button
          v-for="angle in ANGLES"
          :key="angle"
          type="button"
          class="chip"
          :class="{ active: config.rotation === angle }"
          @click="config.rotation = angle"
        >
          {{ angle }}°
        </button>
      </div>
    </div>

    <div v-if="config.layout === 'tile'" class="group" role="group" :aria-labelledby="densityId">
      <div class="group-head">
        <span :id="densityId" class="group-title">{{ t('layout.density') }}</span>
        <span class="hint">{{ t('layout.gapHint') }}</span>
      </div>
      <FieldRange v-model="config.gapX" :label="t('layout.gapX')" v-bind="LIMITS.gapX" unit="×" />
      <FieldRange v-model="config.gapY" :label="t('layout.gapY')" v-bind="LIMITS.gapY" unit="×" />
      <FieldSwitch v-model="config.stagger" :label="t('layout.stagger')" />
    </div>

    <template v-else>
      <div class="anchor">
        <AnchorGrid v-model="config.anchor" :label="t('layout.position')" />
        <div class="anchor-info">
          <span class="field-label">{{ t('layout.position') }}</span>
          <p class="hint">
            <Move class="inline-icon" aria-hidden="true" />
            {{ config.anchor === 'custom' ? t('layout.customPosition') : t('layout.dragHint') }}
          </p>
        </div>
      </div>
      <FieldRange
        v-if="config.anchor !== 'custom' && config.anchor !== 'center'"
        v-model="config.margin"
        :label="t('layout.margin')"
        v-bind="LIMITS.margin"
        unit="%"
      />
    </template>
  </PanelSection>
</template>

<style scoped>
.field {
  display: grid;
  gap: 8px;
}

.field-label {
  color: var(--c-text-2);
  font-size: 13px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip.active {
  border-color: var(--c-accent);
  background: var(--c-accent-soft);
  color: var(--c-accent);
}

.group {
  display: grid;
  gap: 14px;
}

.group-head {
  display: grid;
  gap: 2px;
  margin-top: 2px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
}

.anchor {
  display: flex;
  align-items: center;
  gap: 14px;
}

.anchor-info {
  display: grid;
  gap: 4px;
}

.hint {
  margin: 0;
  color: var(--c-text-3);
  font-size: 12px;
}

.inline-icon {
  width: 13px;
  height: 13px;
  margin-right: 2px;
  vertical-align: -2px;
}
</style>
