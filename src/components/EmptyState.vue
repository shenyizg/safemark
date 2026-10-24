<script setup lang="ts">
import { FolderOpen, ImagePlus, LockKeyhole, Sparkles, WifiOff, Files } from '@lucide/vue'

import { t } from '@/i18n'

defineEmits<{ pick: []; sample: [] }>()
</script>

<template>
  <div class="empty">
    <button type="button" class="drop" @click="$emit('pick')">
      <span class="drop-icon"><ImagePlus aria-hidden="true" /></span>
      <span class="drop-title">{{ t('empty.title') }}</span>
      <span class="drop-subtitle">{{ t('empty.subtitle') }}</span>
      <span class="drop-formats">JPG · PNG · WebP · GIF · BMP · AVIF · PDF</span>
    </button>
    <div class="actions">
      <button type="button" class="btn btn-primary btn-lg" @click="$emit('pick')">
        <FolderOpen aria-hidden="true" />{{ t('empty.pick') }}
      </button>
      <button type="button" class="btn btn-lg" @click="$emit('sample')">
        <Sparkles aria-hidden="true" />{{ t('empty.sample') }}
      </button>
    </div>
    <ul class="features">
      <li>
        <LockKeyhole aria-hidden="true" />
        <div>
          <strong>{{ t('empty.featurePrivateTitle') }}</strong>
          <span>{{ t('empty.featurePrivate') }}</span>
        </div>
      </li>
      <li>
        <Files aria-hidden="true" />
        <div>
          <strong>{{ t('empty.featureBatchTitle') }}</strong>
          <span>{{ t('empty.featureBatch') }}</span>
        </div>
      </li>
      <li>
        <WifiOff aria-hidden="true" />
        <div>
          <strong>{{ t('empty.featureOfflineTitle') }}</strong>
          <span>{{ t('empty.featureOffline') }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 24px;
}

.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 44px 24px 38px;
  border: 2px dashed var(--c-border-strong);
  border-radius: 18px;
  background: color-mix(in srgb, var(--c-surface) 72%, transparent);
  color: var(--c-text);
  transition:
    border-color 0.18s,
    background-color 0.18s,
    transform 0.18s;
}

.drop:hover {
  border-color: var(--c-accent);
  background: var(--c-surface);
}

.drop-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 6px;
  border-radius: 16px;
  background: var(--c-accent-soft);
  color: var(--c-accent);
}

.drop-icon svg {
  width: 28px;
  height: 28px;
}

.drop-title {
  font-size: 19px;
  font-weight: 650;
}

.drop-subtitle {
  color: var(--c-text-2);
}

.drop-formats {
  margin-top: 4px;
  color: var(--c-text-3);
  font-size: 12px;
  letter-spacing: 0.02em;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.features li {
  display: flex;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  background: var(--c-surface);
}

.features svg {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  color: var(--c-accent);
}

.features div {
  display: grid;
  gap: 2px;
}

.features strong {
  font-size: 13.5px;
}

.features span {
  color: var(--c-text-2);
  font-size: 12.5px;
}

@media (max-width: 720px) {
  .features {
    grid-template-columns: 1fr;
  }

  .drop {
    padding: 32px 18px 28px;
  }
}
</style>
