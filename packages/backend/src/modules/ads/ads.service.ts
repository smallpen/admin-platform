import type { FastifyInstance } from 'fastify'
import { toSkipTake } from '../../utils/pagination.js'
import { createActivityLog, type ActivityContext } from '../../utils/activity-log.js'
import type { CreateAdInput, UpdateAdInput, AdListQuery } from './ads.schema.js'

function toStartOfDay(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00+08:00')
}

function toEndOfDay(dateStr: string): Date {
  return new Date(dateStr + 'T23:59:59+08:00')
}

function formatAd(ad: any) {
  return {
    id: ad.id,
    title: ad.title,
    mimeType: ad.mimeType,
    imageName: ad.imageName,
    linkUrl: ad.linkUrl,
    duration: ad.duration,
    isActive: ad.isActive,
    startDate: ad.startDate,
    endDate: ad.endDate,
    sortOrder: ad.sortOrder,
    createdAt: ad.createdAt,
    updatedAt: ad.updatedAt,
  }
}

function formatAdDetail(ad: any) {
  return {
    ...formatAd(ad),
    imageBase64: (ad.imageData as Buffer).toString('base64'),
  }
}

export async function listAdsService(fastify: FastifyInstance, query: AdListQuery) {
  const { page, pageSize, search, isActive } = query

  const where: any = {}
  if (isActive !== undefined) where.isActive = isActive
  if (search) where.title = { contains: search }

  const [total, ads] = await fastify.prisma.$transaction([
    fastify.prisma.advertisement.count({ where }),
    fastify.prisma.advertisement.findMany({
      where,
      select: {
        id: true,
        title: true,
        mimeType: true,
        imageName: true,
        linkUrl: true,
        duration: true,
        isActive: true,
        startDate: true,
        endDate: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      ...toSkipTake({ page, pageSize }),
    }),
  ])

  return { ads, total }
}

export async function getAdService(fastify: FastifyInstance, id: string) {
  const ad = await fastify.prisma.advertisement.findUnique({ where: { id } })
  return ad ? formatAdDetail(ad) : null
}

export async function getAdImageService(fastify: FastifyInstance, id: string) {
  const ad = await fastify.prisma.advertisement.findUnique({
    where: { id },
    select: { imageData: true, mimeType: true },
  })
  return ad ? { imageData: ad.imageData as Buffer, mimeType: ad.mimeType } : null
}

export async function createAdService(fastify: FastifyInstance, input: CreateAdInput, ctx: ActivityContext) {
  const { imageBase64, startDate, endDate, ...rest } = input
  const imageData = Buffer.from(imageBase64, 'base64')

  const ad = await fastify.prisma.advertisement.create({
    data: {
      ...rest,
      imageData,
      startDate: toStartOfDay(startDate),
      endDate: toEndOfDay(endDate),
    },
  })

  const formatted = formatAd(ad)
  await createActivityLog(fastify, {
    ctx,
    action: 'CREATE',
    module: 'ads',
    targetId:   ad.id,
    targetName: ad.title,
    after: formatted as any,
  })

  return formatted
}

export async function updateAdService(fastify: FastifyInstance, id: string, input: UpdateAdInput, ctx: ActivityContext) {
  const before = await fastify.prisma.advertisement.findUnique({
    where: { id },
    select: { id: true, title: true, mimeType: true, imageName: true, linkUrl: true, duration: true, isActive: true, startDate: true, endDate: true, sortOrder: true },
  })

  const { imageBase64, mimeType, imageName, startDate, endDate, ...rest } = input

  const data: any = { ...rest }
  if (imageBase64 !== undefined && mimeType !== undefined && imageName !== undefined) {
    data.imageData = Buffer.from(imageBase64, 'base64')
    data.mimeType = mimeType
    data.imageName = imageName
  }
  if (startDate !== undefined) data.startDate = toStartOfDay(startDate)
  if (endDate !== undefined) data.endDate = toEndOfDay(endDate)

  const ad = await fastify.prisma.advertisement.update({ where: { id }, data })
  const formatted = formatAd(ad)

  await createActivityLog(fastify, {
    ctx,
    action: 'UPDATE',
    module: 'ads',
    targetId:   id,
    targetName: ad.title,
    before: before as any,
    after: formatted as any,
  })

  return formatted
}

export async function deleteAdService(fastify: FastifyInstance, id: string, ctx: ActivityContext) {
  const before = await fastify.prisma.advertisement.findUnique({
    where: { id },
    select: { id: true, title: true, mimeType: true, imageName: true, linkUrl: true, duration: true, isActive: true, startDate: true, endDate: true, sortOrder: true },
  })

  await fastify.prisma.advertisement.delete({ where: { id } })

  await createActivityLog(fastify, {
    ctx,
    action: 'DELETE',
    module: 'ads',
    targetId:   id,
    targetName: before?.title,
    before: before as any,
  })
}
