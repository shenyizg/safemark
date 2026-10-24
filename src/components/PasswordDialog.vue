<script setup lang="ts">
import { KeyRound } from '@lucide/vue'
import { nextTick, ref, watch } from 'vue'

import { t } from '@/i18n'
import { passwordRequest } from '@/state/dialogs'
import ModalDialog from './ModalDialog.vue'

const password = ref('')
const input = ref<HTMLInputElement>()

watch(passwordRequest, (request) => {
  password.value = ''
  if (request) void nextTick(() => input.value?.focus())
})

function submit() {
  passwordRequest.value?.resolve(password.value)
}

function cancel() {
  passwordRequest.value?.resolve(null)
}
</script>

<template>
  <ModalDialog :open="!!passwordRequest" :title="t('password.title')" @close="cancel">
    <form class="form" @submit.prevent="submit">
      <p class="message">
        <KeyRound class="icon" aria-hidden="true" />
        <span>{{ t('password.message', { name: passwordRequest?.fileName ?? '' }) }}</span>
      </p>
      <p v-if="passwordRequest?.retry" class="error" role="alert">{{ t('password.wrong') }}</p>
      <input
        ref="input"
        v-model="password"
        class="input"
        type="password"
        autocomplete="off"
        :aria-label="t('password.label')"
        :placeholder="t('password.label')"
      />
      <p class="note">{{ t('password.note') }}</p>
      <div class="buttons">
        <button type="button" class="btn" @click="cancel">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary" :disabled="!password">
          {{ t('password.open') }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<style scoped>
.form {
  display: grid;
  gap: 12px;
}

.message {
  display: flex;
  gap: 10px;
  margin: 0;
  color: var(--c-text-2);
  overflow-wrap: anywhere;
}

.icon {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  color: var(--c-accent);
}

.error {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  background: var(--c-danger-soft);
  color: var(--c-danger);
  font-size: 13px;
}

.input {
  height: 38px;
}

.note {
  margin: -4px 0 0;
  color: var(--c-text-3);
  font-size: 12px;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
