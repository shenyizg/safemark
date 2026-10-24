import './core/polyfills'
import './styles/main.css'

import { createApp } from 'vue'

import App from './App.vue'
import { t } from './i18n'
import { detectFonts } from './state/fonts'
import { restoreLogo } from './state/settings'
import { showToast } from './state/toasts'

createApp(App).mount('#app')

detectFonts()
void restoreLogo()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // A controller change on a page that already had one means a new version took over.
  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return
    showToast(t('update.ready'), 'info', {
      timeout: 0,
      action: { label: t('update.reload'), run: () => location.reload() },
    })
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
      console.warn('Service worker registration failed', error)
    })
  })
}
