import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './routes/auth.routes'
import { dashboardRoutes } from './routes/dashboard.routes'
import { usersRoutes } from './routes/users.routes'
import { rolesRoutes } from './routes/roles.routes'
import { settingsRoutes, maintenancePageRoute } from './routes/settings.routes'
import { adsRoutes } from './routes/ads.routes'
import { proxyRoutes } from './routes/proxy.routes'
import { activityLogsRoutes } from './routes/activity-logs.routes'
import { profileRoutes } from './routes/profile.routes'
import { announcementsRoutes } from './routes/announcements.routes'
import { scheduledTasksRoutes } from './routes/scheduled-tasks.routes'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    ...authRoutes,
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      children: [
        ...dashboardRoutes,
        ...usersRoutes,
        ...rolesRoutes,
        ...settingsRoutes,
        ...adsRoutes,
        ...proxyRoutes,
        ...activityLogsRoutes,
        ...profileRoutes,
        ...announcementsRoutes,
        ...scheduledTasksRoutes,
      ],
    },
    maintenancePageRoute,
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/errors/ForbiddenView.vue'),
      meta: { layout: 'blank' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/errors/NotFoundView.vue'),
      meta: { layout: 'blank' },
    },
  ],
})

setupGuards(router)

export default router
