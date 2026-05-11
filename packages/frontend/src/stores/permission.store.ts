import { defineStore } from 'pinia'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    codes: new Set<string>(),
  }),

  actions: {
    setPermissions(permissions: string[]) {
      this.codes = new Set(permissions)
    },

    has(code: string): boolean {
      return this.codes.has(code)
    },

    hasAny(codes: string[]): boolean {
      return codes.some(c => this.codes.has(c))
    },

    hasAll(codes: string[]): boolean {
      return codes.every(c => this.codes.has(c))
    },

    clear() {
      this.codes = new Set()
    },
  },
})
