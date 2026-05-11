import type { RouteRecordRaw } from 'vue-router'

export const usersRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/users/UsersView.vue'),
    meta: { requiresAuth: true, permission: 'user:list', title: '使用者管理' },
  },
]
