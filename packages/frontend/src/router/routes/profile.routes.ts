import type { RouteRecordRaw } from 'vue-router'

export const profileRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { requiresAuth: true, title: '個人資料' },
  },
]
