import type { RouteRecordRaw } from 'vue-router'

export const activityLogsRoutes: RouteRecordRaw[] = [
  {
    path: '/activity-logs',
    name: 'ActivityLogs',
    component: () => import('@/views/activity-logs/ActivityLogsView.vue'),
    meta: { requiresAuth: true, permission: 'activity_log:list', title: '操作紀錄' },
  },
]
