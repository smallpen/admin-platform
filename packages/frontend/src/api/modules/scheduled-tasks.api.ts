import client from '../client'
import type { ApiResponse } from '@admin/shared'

export interface ScheduledTask {
  id:             string
  name:           string
  taskType:       string
  cronExpression: string
  isEnabled:      boolean
  lastRunAt:      string | null
  lastStatus:     string | null
  lastMessage:    string | null
  createdAt:      string
  updatedAt:      string
}

export interface UpdateScheduledTaskDto {
  cronExpression?: string
  isEnabled?:      boolean
}

export const scheduledTasksApi = {
  list() {
    return client.get<ApiResponse<ScheduledTask[]>>('/scheduled-tasks')
  },

  update(id: string, data: UpdateScheduledTaskDto) {
    return client.patch<ApiResponse<ScheduledTask>>(`/scheduled-tasks/${id}`, data)
  },

  trigger(id: string) {
    return client.post<ApiResponse<ScheduledTask>>(`/scheduled-tasks/${id}/trigger`)
  },
}
