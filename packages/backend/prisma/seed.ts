import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const PERMISSIONS = [
  // User module
  { code: 'user:list',   name: '查看使用者列表', group: 'user' },
  { code: 'user:create', name: '新增使用者',     group: 'user' },
  { code: 'user:update', name: '編輯使用者',     group: 'user' },
  { code: 'user:delete', name: '刪除使用者',     group: 'user' },
  // Role module
  { code: 'role:list',   name: '查看角色列表', group: 'role' },
  { code: 'role:create', name: '新增角色',     group: 'role' },
  { code: 'role:update', name: '編輯角色',     group: 'role' },
  { code: 'role:delete', name: '刪除角色',     group: 'role' },
  // Permission module
  { code: 'permission:list',   name: '查看權限列表', group: 'permission' },
  { code: 'permission:assign', name: '指派權限',     group: 'permission' },
  { code: 'permission:create', name: '新增權限',     group: 'permission' },
  { code: 'permission:update', name: '編輯權限',     group: 'permission' },
  { code: 'permission:delete', name: '刪除權限',     group: 'permission' },
  // Settings module
  { code: 'settings:view',        name: '查看系統設定', group: 'settings' },
  { code: 'settings:maintenance', name: '管理維護模式', group: 'settings' },
  // Ad module
  { code: 'ad:list',   name: '查看廣告列表', group: 'ad' },
  { code: 'ad:create', name: '新增廣告',     group: 'ad' },
  { code: 'ad:update', name: '編輯廣告',     group: 'ad' },
  { code: 'ad:delete', name: '刪除廣告',     group: 'ad' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Upsert permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, group: perm.group },
      create: perm,
    })
  }
  console.log(`✅ ${PERMISSIONS.length} permissions seeded`)

  // Create super_admin role with all permissions
  const allPermissions = await prisma.permission.findMany()
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: { displayName: '超級管理員', isSystem: true },
    create: {
      name: 'super_admin',
      displayName: '超級管理員',
      description: '擁有所有系統權限',
      isSystem: true,
    },
  })

  await prisma.rolePermission.deleteMany({ where: { roleId: superAdminRole.id } })
  await prisma.rolePermission.createMany({
    data: allPermissions.map(p => ({ roleId: superAdminRole.id, permissionId: p.id })),
  })
  console.log(`✅ super_admin role seeded with ${allPermissions.length} permissions`)

  // Create viewer role with list-only permissions
  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: { displayName: '觀察者', isSystem: false },
    create: {
      name: 'viewer',
      displayName: '觀察者',
      description: '只能查看資料，無法修改',
      isSystem: false,
    },
  })

  const listPerms = allPermissions.filter(p => p.code.endsWith(':list'))
  await prisma.rolePermission.deleteMany({ where: { roleId: viewerRole.id } })
  await prisma.rolePermission.createMany({
    data: listPerms.map(p => ({ roleId: viewerRole.id, permissionId: p.id })),
  })
  console.log(`✅ viewer role seeded`)

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin@123456', 12)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      displayName: '系統管理員',
      status: 'ACTIVE',
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdminRole.id },
  })
  console.log(`✅ admin user seeded (username: admin, password: Admin@123456)`)

  // Initialize MaintenanceStatus singleton
  await prisma.maintenanceStatus.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isActive: false },
  })
  console.log(`✅ maintenance status initialized`)

  console.log('🎉 Seed completed!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
