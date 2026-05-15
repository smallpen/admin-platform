import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { usePermissionStore } from '@/stores/permission.store'
import { useMaintenanceStore } from '@/stores/maintenance.store'
import { useAnnouncementsStore } from '@/stores/announcements.store'
import { useAuth } from '@/composables/useAuth'

export function setupGuards(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const permStore = usePermissionStore()

    // Maintenance check — skip for the maintenance page and login page
    // Login must stay accessible so admins can authenticate during maintenance
    if (to.name !== 'MaintenancePage' && to.name !== 'Login') {
      const maintenanceStore = useMaintenanceStore()

      // Fetch status on first navigation so we have the real value
      if (!maintenanceStore.hasFetched) {
        await maintenanceStore.fetchStatus()
      }

      if (maintenanceStore.status.isActive && !permStore.has('settings:maintenance')) {
        return { name: 'MaintenancePage' }
      }
    }

    if (!to.meta.requiresAuth) return true

    // Has token but no user data yet — try loading from API
    if (authStore.accessToken && !authStore.user) {
      const { loadMe } = useAuth()
      await loadMe()
    }

    if (!authStore.isAuthenticated) {
      // During maintenance, unauthenticated users see the maintenance page, not login
      const maintenanceStore = useMaintenanceStore()
      if (maintenanceStore.status.isActive) {
        return { name: 'MaintenancePage' }
      }
      return { name: 'Login', query: { redirect: to.fullPath } }
    }

    if (to.meta.permission && !permStore.has(to.meta.permission as string)) {
      return { name: 'Forbidden' }
    }

    // Fetch active announcements (non-blocking, once per session)
    const announcementsStore = useAnnouncementsStore()
    if (!announcementsStore.hasFetched) {
      announcementsStore.fetchActive()
    }

    return true
  })
}
