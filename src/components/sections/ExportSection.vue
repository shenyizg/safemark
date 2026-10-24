<script setup lang="ts">
import { FileText, Image as ImageIcon, Layers, Settings2 } from '@lucide/vue'
import { computed, useId } from 'vue'

import { LIMITS, PDF_DPI_OPTIONS } from '@/core/config'
import { t } from '@/i18n'
import { exportOptions } from '@/state/settings'
import FieldRange from '../controls/FieldRange.vue'
import FieldSelect from '../controls/FieldSelect.vue'
import PanelSection from '../controls/PanelSection.vue'
import SegmentedControl from '../controls/SegmentedControl.vue'

const suffixId = useId()

const formats = computed(() => [
  { value: 'original' as const, label: t('export.formatOriginal') },
  { value: 'png' as const, label: 'PNG' },
  { value: 'jpeg' as const, label: 'JPEG' },
  { value: 'webp' as const, label: 'WebP' },
])

const pdfModes = computed(() => [
  { value: 'overlay' as const, label: t('export.pdfOverlay'), icon: Layers },
  { value: 'flatten' as const, label: t('export.pdfFlatten'), icon: ImageIcon },
])

const dpis = computed(() =>
  PDF_DPI_OPTIONS.map((value) => ({
    value,
    label: `${value} DPI${value === 150 ? ` · ${t('export.recommended')}` : ''}`,
  })),
)

const usesQuality = computed(
  () =>
    exportOptions.imageFormat === 'jpeg' ||
    exportOptions.imageFormat === 'webp' ||
    exportOptions.imageFormat === 'original' ||
    exportOptions.pdfMode === 'flatten',
)
</script>

<template>
  <PanelSection :title="t('export.title')" storage-key="export" :default-open="false">
    <template #icon><Settings2 /></template>

    <FieldSelect
      v-model="exportOptions.imageFormat"
      :label="t('export.imageFormat')"
      :options="formats"
      :hint="t('export.exifHint')"
    />
    <FieldRange
      v-if="usesQuality"
      v-model="exportOptions.quality"
      :label="t('export.quality')"
      v-bind="LIMITS.quality"
      unit="%"
      :hint="t('export.qualityHint')"
    />

    <div class="field">
      <span class="field-label"
        ><FileText class="inline-icon" aria-hidden="true" />{{ t('export.pdfMode') }}</span
      >
      <SegmentedControl
        v-model="exportOptions.pdfMode"
        :options="pdfModes"
        :label="t('export.pdfMode')"
      />
      <p class="hint">
        {{
          exportOptions.pdfMode === 'overlay'
            ? t('export.pdfOverlayHint')
            : t('export.pdfFlattenHint')
        }}
      </p>
    </div>
    <FieldSelect
      v-model="exportOptions.pdfDpi"
      :label="t('export.pdfDpi')"
      :options="dpis"
      :hint="t('export.pdfDpiHint')"
    />

    <div class="field">
      <label :for="suffixId" class="field-label">{{ t('export.suffix') }}</label>
      <input
        :id="suffixId"
        v-model="exportOptions.suffix"
        class="input"
        maxlength="100"
        spellcheck="false"
        autocomplete="off"
      />
      <p class="hint">
        {{ t('export.suffixHint', { example: `photo${exportOptions.suffix}.jpg` }) }}
      </p>
    </div>
  </PanelSection>
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

.hint {
  margin: 0;
  color: var(--c-text-3);
  font-size: 12px;
}

.inline-icon {
  width: 14px;
  height: 14px;
  margin-right: 5px;
  vertical-align: -2px;
}
</style>
