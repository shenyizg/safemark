<script setup lang="ts">
import { Italic, Palette, TextAlignCenter, TextAlignEnd, TextAlignStart } from '@lucide/vue'
import { computed, useId } from 'vue'

import { LIMITS } from '@/core/config'
import { t } from '@/i18n'
import { config } from '@/state/settings'
import FieldColor from '../controls/FieldColor.vue'
import FieldRange from '../controls/FieldRange.vue'
import FontSelect from '../controls/FontSelect.vue'
import PanelSection from '../controls/PanelSection.vue'
import SegmentedControl from '../controls/SegmentedControl.vue'

const weightId = useId()
const multiline = computed(() => config.text.trim().includes('\n'))

const WEIGHTS = [100, 300, 400, 500, 600, 700, 800, 900] as const
const weights = computed(() =>
  WEIGHTS.map((value) => ({ value, label: `${value} · ${t(`weight.${value}`)}` })),
)

const aligns = computed(() => [
  { value: 'left' as const, label: t('style.alignLeft'), icon: TextAlignStart },
  { value: 'center' as const, label: t('style.alignCenter'), icon: TextAlignCenter },
  { value: 'right' as const, label: t('style.alignRight'), icon: TextAlignEnd },
])

const SWATCHES = ['#7f7f7f', '#000000', '#ffffff', '#d0312d', '#1f5fbf', '#0b8287', '#e08a00']
</script>

<template>
  <PanelSection :title="t('style.title')" storage-key="style">
    <template #icon><Palette /></template>

    <template v-if="config.kind === 'text'">
      <FontSelect v-model="config.fontFamily" :label="t('style.font')" />

      <div class="row">
        <div class="field grow">
          <label :for="weightId" class="field-label">{{ t('style.weight') }}</label>
          <select :id="weightId" v-model="config.fontWeight" class="select">
            <option v-for="w in weights" :key="w.value" :value="w.value">{{ w.label }}</option>
          </select>
        </div>
        <button
          type="button"
          class="toggle"
          :aria-pressed="config.italic"
          :title="t('style.italic')"
          :aria-label="t('style.italic')"
          @click="config.italic = !config.italic"
        >
          <Italic />
        </button>
      </div>

      <FieldRange
        v-model="config.fontSize"
        :label="t('style.size')"
        v-bind="LIMITS.fontSize"
        unit="%"
        :hint="t('style.sizeHint')"
      />
    </template>

    <FieldRange
      v-else
      v-model="config.imageSize"
      :label="t('style.logoSize')"
      v-bind="LIMITS.imageSize"
      unit="%"
      :hint="t('style.logoSizeHint')"
    />

    <FieldRange
      v-model="config.opacity"
      :label="t('style.opacity')"
      v-bind="LIMITS.opacity"
      unit="%"
    />

    <template v-if="config.kind === 'text'">
      <FieldColor v-model="config.color" :label="t('style.color')" :swatches="SWATCHES" />
      <FieldRange
        v-model="config.letterSpacing"
        :label="t('style.letterSpacing')"
        v-bind="LIMITS.letterSpacing"
        unit="em"
      />
      <template v-if="multiline">
        <FieldRange
          v-model="config.lineHeight"
          :label="t('style.lineHeight')"
          v-bind="LIMITS.lineHeight"
          unit="×"
        />
        <div class="field">
          <span class="field-label">{{ t('style.align') }}</span>
          <SegmentedControl
            v-model="config.textAlign"
            :options="aligns"
            :label="t('style.align')"
            icon-only
          />
        </div>
      </template>
    </template>
  </PanelSection>
</template>

<style scoped>
.row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.grow {
  flex: 1;
  min-width: 0;
}

.field {
  display: grid;
  gap: 6px;
}

.field-label {
  color: var(--c-text-2);
  font-size: 13px;
}

.toggle {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-sm);
  background: var(--c-surface-2);
  color: var(--c-text-2);
}

.toggle svg {
  width: 16px;
  height: 16px;
}

.toggle[aria-pressed='true'] {
  border-color: var(--c-accent);
  background: var(--c-accent-soft);
  color: var(--c-accent);
}
</style>
