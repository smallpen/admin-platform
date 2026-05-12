import client from '../client'
import type { ApiResponse, PaginatedResponse, Advertisement, AdvertisementDetail, CreateAdDto, UpdateAdDto, AdListQuery } from '@admin/shared'

export const adsApi = {
  list(params?: AdListQuery) {
    return client.get<PaginatedResponse<Advertisement>>('/ads', { params })
  },

  get(id: string) {
    return client.get<ApiResponse<AdvertisementDetail>>(`/ads/${id}`)
  },

  create(data: CreateAdDto) {
    return client.post<ApiResponse<Advertisement>>('/ads', data)
  },

  update(id: string, data: UpdateAdDto) {
    return client.patch<ApiResponse<Advertisement>>(`/ads/${id}`, data)
  },

  delete(id: string) {
    return client.delete<ApiResponse<null>>(`/ads/${id}`)
  },

  getImageUrl(id: string) {
    return `/api/v1/ads/${id}/image`
  },
}
