import type { DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/stores/permission.store'

export const vPermission = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const store = usePermissionStore()
    const codes = Array.isArray(binding.value) ? binding.value : [binding.value]
    const mode = binding.modifiers.any ? 'any' : 'all'

    const allowed = mode === 'any' ? store.hasAny(codes) : store.hasAll(codes)

    if (!allowed) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const store = usePermissionStore()
    const codes = Array.isArray(binding.value) ? binding.value : [binding.value]
    const mode = binding.modifiers.any ? 'any' : 'all'

    const allowed = mode === 'any' ? store.hasAny(codes) : store.hasAll(codes)

    el.style.display = allowed ? '' : 'none'
  },
}
