import type { RouteRecordRaw } from 'vue-router'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings/maintenance',
    name: 'Maintenance',
    component: () => import('@/views/settings/MaintenanceView.vue'),
    meta: { requiresAuth: true, permission: 'settings:view', title: '網站維護' },
  },
]

export const maintenancePageRoute: RouteRecordRaw = {
  path: '/maintenance',
  name: 'MaintenancePage',
  component: () => import('@/views/errors/MaintenancePageView.vue'),
  meta: { layout: 'blank', title: '系統維護中' },
}
