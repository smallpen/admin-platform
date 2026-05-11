import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { usePermissionStore } from '@/stores/permission.store'
import { useAuth } from '@/composables/useAuth'

export function setupGuards(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const permStore = usePermissionStore()

    if (!to.meta.requiresAuth) return true

    // Has token but no user data yet — try loading from API
    if (authStore.accessToken && !authStore.user) {
      const { loadMe } = useAuth()
      await loadMe()
    }

    if (!authStore.isAuthenticated) {
      return { name: 'Login', query: { redirect: to.fullPath } }
    }

    if (to.meta.permission && !permStore.has(to.meta.permission as string)) {
      return { name: 'Forbidden' }
    }

    return true
  })
}
