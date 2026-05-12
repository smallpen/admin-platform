export const adsRoutes = [
  {
    path: '/website/ads',
    name: 'Ads',
    component: () => import('@/views/website/AdsView.vue'),
    meta: {
      requiresAuth: true,
      permission: 'ad:list',
      title: '廣告列表',
    },
  },
]
