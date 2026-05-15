import client from '../client'
import type { ApiResponse } from '@admin/shared'

export interface StatsData {
  userCount: number
  roleCount: number
  permissionCount: number
  activeUserCount: number
}

export interface TrendsData {
  labels: string[]
  data: number[]
}

export interface ActionDistributionItem {
  name: string
  value: number
}

export const statsApi = {
  getStats() {
    return client.get<ApiResponse<StatsData>>('/stats')
  },
  getTrends() {
    return client.get<ApiResponse<TrendsData>>('/stats/trends')
  },
  getActionDistribution() {
    return client.get<ApiResponse<ActionDistributionItem[]>>('/stats/action-distribution')
  },
}
