import client from '../client'
import type { ApiResponse } from '@admin/shared'

export interface MaintenanceStatus {
  isActive: boolean
  message: string | null
  activatedAt: string | null
  activatedBy: string | null
}

export interface MaintenanceSchedule {
  id: string
  name: string
  cronExpression: string
  duration: number
  isEnabled: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateMaintenanceDto {
  isActive: boolean
  message?: string | null
}

export interface CreateScheduleDto {
  name: string
  cronExpression: string
  duration: number
  isEnabled: boolean
}

export interface UpdateScheduleDto {
  name?: string
  cronExpression?: string
  duration?: number
  isEnabled?: boolean
}

export const settingsApi = {
  getMaintenanceStatus() {
    return client.get<ApiResponse<MaintenanceStatus>>('/settings/maintenance/status')
  },

  getMaintenance() {
    return client.get<ApiResponse<MaintenanceStatus>>('/settings/maintenance')
  },

  updateMaintenance(data: UpdateMaintenanceDto) {
    return client.put<ApiResponse<MaintenanceStatus>>('/settings/maintenance', data)
  },

  listSchedules() {
    return client.get<ApiResponse<MaintenanceSchedule[]>>('/settings/maintenance/schedules')
  },

  createSchedule(data: CreateScheduleDto) {
    return client.post<ApiResponse<MaintenanceSchedule>>('/settings/maintenance/schedules', data)
  },

  updateSchedule(id: string, data: UpdateScheduleDto) {
    return client.put<ApiResponse<MaintenanceSchedule>>(`/settings/maintenance/schedules/${id}`, data)
  },

  deleteSchedule(id: string) {
    return client.delete<ApiResponse<null>>(`/settings/maintenance/schedules/${id}`)
  },
}
