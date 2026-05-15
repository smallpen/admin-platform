import client from '../client'
import type { ApiResponse, PaginatedResponse } from '@admin/shared'

export interface Announcement {
  id:        string
  title:     string
  content:   string
  type:      'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS'
  status:    'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  startAt:   string | null
  endAt:     string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  creator?: { id: string; username: string; displayName: string }
}

export interface AnnouncementWithRead extends Pick<Announcement, 'id' | 'title' | 'content' | 'type' | 'startAt' | 'endAt' | 'createdAt'> {
  isRead: boolean
}

export interface CreateAnnouncementDto {
  title:   string
  content: string
  type:    'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS'
  status:  'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  startAt?: string | null
  endAt?:   string | null
}

export interface UpdateAnnouncementDto extends Partial<CreateAnnouncementDto> {}

export interface ListAnnouncementsParams {
  page?:     number
  pageSize?: number
  status?:   string
  type?:     string
  keyword?:  string
}

export const announcementsApi = {
  getActive() {
    return client.get<ApiResponse<AnnouncementWithRead[]>>('/announcements/active')
  },

  list(params?: ListAnnouncementsParams) {
    return client.get<PaginatedResponse<Announcement>>('/announcements', { params })
  },

  create(data: CreateAnnouncementDto) {
    return client.post<ApiResponse<Announcement>>('/announcements', data)
  },

  update(id: string, data: UpdateAnnouncementDto) {
    return client.patch<ApiResponse<Announcement>>(`/announcements/${id}`, data)
  },

  remove(id: string) {
    return client.delete<ApiResponse<null>>(`/announcements/${id}`)
  },

  markRead(id: string) {
    return client.post(`/announcements/${id}/read`)
  },

  markAllRead() {
    return client.post<ApiResponse<null>>('/announcements/read-all')
  },
}
