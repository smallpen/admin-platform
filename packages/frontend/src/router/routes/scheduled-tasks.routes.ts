import type { RouteRecordRaw } from 'vue-router'

export const scheduledTasksRoutes: RouteRecordRaw[] = [
  {
    path: '/scheduled-tasks',
    name: 'ScheduledTasks',
    component: () => import('@/views/scheduled-tasks/ScheduledTasksView.vue'),
    meta: { requiresAuth: true, permission: 'scheduled_task:list', title: '排程任務' },
  },
]
