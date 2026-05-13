export const proxyRoutes = [
  {
    path: '/api-management',
    redirect: '/api-management/apis',
  },
  {
    path: '/api-management/apis',
    name: 'ProxyApis',
    component: () => import('@/views/api-management/ApiListView.vue'),
    meta: {
      requiresAuth: true,
      permission: 'proxy_api:list',
      title: 'API 列表',
    },
  },
  {
    path: '/api-management/api-keys',
    name: 'ApiKeys',
    component: () => import('@/views/api-management/ApiKeyView.vue'),
    meta: {
      requiresAuth: true,
      permission: 'api_key:list',
      title: 'API KEY 管理',
    },
  },
  {
    path: '/api-management/api-logs',
    name: 'ApiLogs',
    component: () => import('@/views/api-management/ApiLogView.vue'),
    meta: {
      requiresAuth: true,
      permission: 'api_log:list',
      title: 'API 歷程記錄',
    },
  },
  {
    path: '/api-management/docs',
    name: 'ApiDocs',
    component: () => import('@/views/api-management/ApiDocsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'API 使用說明',
    },
  },
]
