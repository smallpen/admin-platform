export interface Advertisement {
  id: string
  title: string
  mimeType: string
  imageName: string
  linkUrl: string | null
  duration: number
  isActive: boolean
  startDate: string
  endDate: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AdvertisementDetail extends Advertisement {
  imageBase64: string
}

export interface CreateAdDto {
  title: string
  imageBase64: string
  mimeType: string
  imageName: string
  linkUrl?: string | null
  duration: number
  isActive: boolean
  startDate: string
  endDate: string
  sortOrder: number
}

export interface UpdateAdDto {
  title?: string
  imageBase64?: string
  mimeType?: string
  imageName?: string
  linkUrl?: string | null
  duration?: number
  isActive?: boolean
  startDate?: string
  endDate?: string
  sortOrder?: number
}

export interface AdListQuery {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}
