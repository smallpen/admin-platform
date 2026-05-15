import type { FastifyInstance } from 'fastify'
import { createActivityLog, type ActivityContext } from '../../utils/activity-log.js'
import type { CreateAnnouncementInput, UpdateAnnouncementInput, ListAnnouncementsInput } from './announcements.schema.js'

export async function listAnnouncementsService(fastify: FastifyInstance, query: ListAnnouncementsInput) {
  const { page, pageSize, status, type, keyword } = query
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (status)  where.status = status
  if (type)    where.type   = type
  if (keyword) where.OR = [
    { title:   { contains: keyword } },
    { content: { contains: keyword } },
  ]

  const [total, data] = await fastify.prisma.$transaction([
    fastify.prisma.announcement.count({ where }),
    fastify.prisma.announcement.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { id: true, username: true, displayName: true } } },
    }),
  ])

  return {
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  }
}

export async function getActiveAnnouncementsService(fastify: FastifyInstance, userId: string) {
  const now = new Date()
  const announcements = await fastify.prisma.announcement.findMany({
    where: {
      status: 'PUBLISHED',
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null },   { endAt:   { gte: now } }] },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      reads: { where: { userId }, select: { id: true } },
    },
  })

  return announcements.map(a => ({
    id:        a.id,
    title:     a.title,
    content:   a.content,
    type:      a.type,
    startAt:   a.startAt,
    endAt:     a.endAt,
    createdAt: a.createdAt,
    isRead:    a.reads.length > 0,
  }))
}

export async function createAnnouncementService(
  fastify: FastifyInstance,
  data: CreateAnnouncementInput,
  userId: string,
  ctx: ActivityContext,
) {
  const announcement = await fastify.prisma.announcement.create({
    data: {
      title:     data.title,
      content:   data.content,
      type:      data.type,
      status:    data.status,
      startAt:   data.startAt ? new Date(data.startAt) : null,
      endAt:     data.endAt   ? new Date(data.endAt)   : null,
      createdBy: userId,
    },
  })

  await createActivityLog(fastify, {
    ctx,
    action:     'CREATE',
    module:     'announcement',
    targetId:   announcement.id,
    targetName: announcement.title,
    after:      { title: announcement.title, type: announcement.type, status: announcement.status },
  })

  return announcement
}

export async function updateAnnouncementService(
  fastify: FastifyInstance,
  id: string,
  data: UpdateAnnouncementInput,
  ctx: ActivityContext,
) {
  const before = await fastify.prisma.announcement.findUnique({ where: { id } })
  if (!before) return null

  const announcement = await fastify.prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title   !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.type    !== undefined && { type: data.type }),
      ...(data.status  !== undefined && { status: data.status }),
      ...(data.startAt !== undefined && { startAt: data.startAt ? new Date(data.startAt) : null }),
      ...(data.endAt   !== undefined && { endAt:   data.endAt   ? new Date(data.endAt)   : null }),
    },
  })

  await createActivityLog(fastify, {
    ctx,
    action:     'UPDATE',
    module:     'announcement',
    targetId:   id,
    targetName: announcement.title,
    before:     { title: before.title, type: before.type, status: before.status },
    after:      { title: announcement.title, type: announcement.type, status: announcement.status },
  })

  return announcement
}

export async function deleteAnnouncementService(
  fastify: FastifyInstance,
  id: string,
  ctx: ActivityContext,
) {
  const before = await fastify.prisma.announcement.findUnique({ where: { id } })
  if (!before) return false

  await fastify.prisma.announcement.delete({ where: { id } })

  await createActivityLog(fastify, {
    ctx,
    action:     'DELETE',
    module:     'announcement',
    targetId:   id,
    targetName: before.title,
    before:     { title: before.title, type: before.type, status: before.status },
  })

  return true
}

export async function markAsReadService(
  fastify: FastifyInstance,
  userId: string,
  announcementId: string,
) {
  await fastify.prisma.userAnnouncementRead.upsert({
    where: { userId_announcementId: { userId, announcementId } },
    update: {},
    create: { userId, announcementId },
  })
}

export async function markAllAsReadService(fastify: FastifyInstance, userId: string) {
  const now = new Date()
  const active = await fastify.prisma.announcement.findMany({
    where: {
      status: 'PUBLISHED',
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null },   { endAt:   { gte: now } }] },
      ],
    },
    select: { id: true },
  })

  for (const a of active) {
    await fastify.prisma.userAnnouncementRead.upsert({
      where: { userId_announcementId: { userId, announcementId: a.id } },
      update: {},
      create: { userId, announcementId: a.id },
    })
  }
}
