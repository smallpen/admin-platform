import { usePermissionStore } from '@/stores/permission.store'

export function usePermission() {
  const store = usePermissionStore()

  return {
    has: (code: string) => store.has(code),
    hasAny: (codes: string[]) => store.hasAny(codes),
    hasAll: (codes: string[]) => store.hasAll(codes),
  }
}
