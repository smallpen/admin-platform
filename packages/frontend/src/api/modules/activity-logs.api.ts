import client from '../client'
import type { PaginatedResponse } from '@admin/shared'

export interface ActivityLogUser {
  id: string
  username: string
  displayName: string
}

export interface ActivityLog {
  id: string
  action: string
  module: string
  targetId: string | null
  targetName: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: ActivityLogUser
}

export interface ActivityLogQuery {
  page?: number
  pageSize?: number
  dateFrom?: string
  dateTo?: string
  module?: string
  action?: string
  username?: string
}

export const activityLogsApi = {
  list(params?: ActivityLogQuery) {
    return client.get<PaginatedResponse<ActivityLog>>('/activity-logs', { params })
  },
}
