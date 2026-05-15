import type { RouteRecordRaw } from 'vue-router'

export const announcementsRoutes: RouteRecordRaw[] = [
  {
    path: '/announcements',
    name: 'Announcements',
    component: () => import('@/views/announcements/AnnouncementsView.vue'),
    meta: { requiresAuth: true, permission: 'announcement:list', title: '公告管理' },
  },
]
