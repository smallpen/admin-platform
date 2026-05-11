import type { RouteRecordRaw } from 'vue-router'

export const rolesRoutes: RouteRecordRaw[] = [
  {
    path: '/roles',
    name: 'Roles',
    component: () => import('@/views/roles/RolesView.vue'),
    meta: { requiresAuth: true, permission: 'role:list', title: '角色管理' },
  },
  {
    path: '/permissions',
    name: 'Permissions',
    component: () => import('@/views/permissions/PermissionsView.vue'),
    meta: { requiresAuth: true, permission: 'permission:list', title: '權限管理' },
  },
]
