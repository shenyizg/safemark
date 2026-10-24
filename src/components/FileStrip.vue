<script setup lang="ts">
import { CircleAlert, FileText, LoaderCircle, Plus, Trash, X } from '@lucide/vue'

import { formatBytes } from '@/core/files'
import { t } from '@/i18n'
import { activeId, clearItems, items, removeItem } from '@/state/files'

defineEmits<{ add: [] }>()

function select(id: string) {
  activeId.value = id
}
</script>

<template>
  <div class="strip">
    <ul class="list scroll-thin" :aria-label="t('files.title')">
      <li
        v-for="item in items"
        :key="item.id"
        class="file"
        :class="{ active: item.id === activeId, error: item.status === 'error' }"
      >
        <button
          type="button"
          class="file-button"
          :aria-current="item.id === activeId ? 'true' : undefined"
          :title="`${item.name} · ${formatBytes(item.size)}`"
          @click="select(item.id)"
          @keydown.delete.prevent="removeItem(item.id)"
        >
          <span class="thumb">
            <img v-if="item.thumbnail" :src="item.thumbnail" alt="" draggable="false" />
            <LoaderCircle v-else-if="item.status === 'loading'" class="spin" aria-hidden="true" />
            <CircleAlert v-else-if="item.status === 'error'" aria-hidden="true" />
            <FileText v-else aria-hidden="true" />
            <span v-if="item.kind === 'pdf'" class="badge">
              PDF{{ item.pages ? ` · ${item.pages}` : '' }}
            </span>
          </span>
          <span class="name">{{ item.name }}</span>
        </button>
        <button
          type="button"
          class="remove"
          :aria-label="t('files.remove', { name: item.name })"
          :title="t('files.remove', { name: item.name })"
          @click="removeItem(item.id)"
        >
          <X aria-hidden="true" />
        </button>
      </li>
      <li class="add-wrap">
        <button type="button" class="add" :title="t('files.add')" @click="$emit('add')">
          <Plus aria-hidden="true" />
          <span>{{ t('files.add') }}</span>
        </button>
      </li>
    </ul>
    <div class="meta">
      <span>{{ t('files.count', { count: items.length }) }}</span>
      <button type="button" class="btn btn-sm btn-ghost" @click="clearItems">
        <Trash aria-hidden="true" />{{ t('files.clear') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.strip {
  display: flex;
  flex: none;
  align-items: stretch;
  gap: 8px;
  padding: 10px 12px 10px 16px;
  border-top: 1px solid var(--c-border);
  background: var(--c-surface);
}

.list {
  display: flex;
  flex: 1;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 2px 2px 6px;
  overflow-x: auto;
  list-style: none;
}

.file {
  position: relative;
  flex: none;
  width: 92px;
}

.file-button {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 4px;
  border: 1.5px solid transparent;
  border-radius: var(--r-md);
  background: transparent;
  color: inherit;
  text-align: left;
  transition:
    border-color 0.15s,
    background-color 0.15s;
}

.file-button:hover {
  background: var(--c-surface-2);
}

.file.active .file-button {
  border-color: var(--c-accent);
  background: var(--c-accent-soft);
}

.thumb {
  position: relative;
  display: grid;
  width: 100%;
  place-items: center;
  height: 64px;
  overflow: hidden;
  border-radius: 6px;
  background: repeating-conic-gradient(var(--c-surface-3) 0 25%, var(--c-surface) 0 50%) 0 0 / 10px
    10px;
  color: var(--c-text-3);
}

.file.error .thumb {
  color: var(--c-danger);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb svg {
  width: 20px;
  height: 20px;
}

.badge {
  position: absolute;
  right: 3px;
  bottom: 3px;
  padding: 0 5px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.62);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
}

.name {
  display: block;
  overflow: hidden;
  color: var(--c-text-2);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove {
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--c-border-strong);
  border-radius: 50%;
  background: var(--c-surface);
  color: var(--c-text-2);
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transition: opacity 0.15s;
}

.remove svg {
  width: 12px;
  height: 12px;
}

.file:hover .remove,
.file:focus-within .remove,
.file.active .remove {
  opacity: 1;
}

@media (hover: none) {
  .remove {
    opacity: 1;
  }
}

.add-wrap {
  display: flex;
  flex: none;
}

.add {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 4px;
  width: 92px;
  border: 1.5px dashed var(--c-border-strong);
  border-radius: var(--r-md);
  background: transparent;
  color: var(--c-text-2);
  font-size: 12px;
}

.add:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}

.add svg {
  width: 20px;
  height: 20px;
}

.meta {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  color: var(--c-text-3);
  font-size: 12px;
}

.spin {
  color: var(--c-accent);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .meta {
    display: none;
  }
}
</style>
