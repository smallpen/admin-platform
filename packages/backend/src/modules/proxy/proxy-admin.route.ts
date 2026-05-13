import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import {
  listProxyApis, getProxyApi, createProxyApi, updateProxyApi, deleteProxyApi,
  listApiKeys, createApiKey, toggleApiKey, deleteApiKey,
  listApiLogs,
  listStoredProcedures, getSpParams,
} from './proxy-admin.controller.js'

export async function proxyAdminRoutes(fastify: FastifyInstance) {
  const h = (fn: Function) => fn as RouteHandlerMethod

  // ── Proxy APIs management ──
  // 靜態路由必須在 /:id 之前，Fastify 會優先匹配靜態路由
  fastify.get('/proxy-apis/sp-list',          { preHandler: [verifyJWT, requirePermission('proxy_api:list')] }, h(listStoredProcedures))
  fastify.get('/proxy-apis/sp-params/:spName', { preHandler: [verifyJWT, requirePermission('proxy_api:list')] }, h(getSpParams))

  fastify.get('/proxy-apis',     { preHandler: [verifyJWT, requirePermission('proxy_api:list')]   }, h(listProxyApis))
  fastify.get('/proxy-apis/:id', { preHandler: [verifyJWT, requirePermission('proxy_api:list')]   }, h(getProxyApi))
  fastify.post('/proxy-apis',    { preHandler: [verifyJWT, requirePermission('proxy_api:create')] }, h(createProxyApi))
  fastify.patch('/proxy-apis/:id', { preHandler: [verifyJWT, requirePermission('proxy_api:update')] }, h(updateProxyApi))
  fastify.delete('/proxy-apis/:id', { preHandler: [verifyJWT, requirePermission('proxy_api:delete')] }, h(deleteProxyApi))

  // ── API Keys management ──
  fastify.get('/api-keys',     { preHandler: [verifyJWT, requirePermission('api_key:list')]   }, h(listApiKeys))
  fastify.post('/api-keys',    { preHandler: [verifyJWT, requirePermission('api_key:create')] }, h(createApiKey))
  fastify.patch('/api-keys/:id', { preHandler: [verifyJWT, requirePermission('api_key:update')] }, h(toggleApiKey))
  fastify.delete('/api-keys/:id', { preHandler: [verifyJWT, requirePermission('api_key:delete')] }, h(deleteApiKey))

  // ── API Call Logs ──
  fastify.get('/api-logs', { preHandler: [verifyJWT, requirePermission('api_log:list')] }, h(listApiLogs))
}
