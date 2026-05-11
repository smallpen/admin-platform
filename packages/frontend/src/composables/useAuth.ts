import { useAuthStore } from '@/stores/auth.store'
import { usePermissionStore } from '@/stores/permission.store'
import { authApi } from '@/api/modules/auth.api'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const permStore = usePermissionStore()
  const router = useRouter()

  async function login(username: string, password: string) {
    const { data } = await authApi.login(username, password)
    const { accessToken, refreshToken, user } = data.data
    authStore.setTokens(accessToken, refreshToken)
    authStore.setUser(user)
    permStore.setPermissions(user.permissions)
  }

  async function logout() {
    try {
      if (authStore.refreshToken) {
        await authApi.logout(authStore.refreshToken)
      }
    } finally {
      authStore.clear()
      permStore.clear()
      router.push('/login')
    }
  }

  async function loadMe() {
    try {
      const { data } = await authApi.me()
      authStore.setUser(data.data)
      permStore.setPermissions(data.data.permissions)
    } catch {
      authStore.clear()
      permStore.clear()
    }
  }

  return { login, logout, loadMe }
}
