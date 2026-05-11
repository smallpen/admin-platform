import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '@/router'
import { settingsApi, type MaintenanceStatus } from '@/api/modules/settings.api'
import { usePermissionStore } from './permission.store'

export const useMaintenanceStore = defineStore('maintenance', () => {
  const status = ref<MaintenanceStatus>({
    isActive: false,
    message: null,
    activatedAt: null,
    activatedBy: null,
  })
  const hasFetched = ref(false)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function fetchStatus() {
    try {
      const res = await settingsApi.getMaintenanceStatus()
      status.value = res.data.data
      hasFetched.value = true
    } catch {
      // silently ignore network errors during polling
    }
  }

  async function checkAndRedirect() {
    await fetchStatus()
    if (status.value.isActive) {
      const permStore = usePermissionStore()
      if (!permStore.has('settings:maintenance')) {
        router.push({ name: 'MaintenancePage' })
      }
    }
  }

  function startPolling() {
    pollTimer = setInterval(checkAndRedirect, 5000)
  }

  function stopPolling() {
    if (pollTimer !== null) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return { status, hasFetched, fetchStatus, startPolling, stopPolling }
})
