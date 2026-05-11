<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Delete } from '@element-plus/icons-vue'
import BaseTable from '@/components/base/BaseTable.vue'
import RoleFormModal from '@/components/business/RoleFormModal.vue'
import { rolesApi } from '@/api/modules/roles.api'
import type { Role } from '@admin/shared'
import type { TableColumn, TableAction } from '@/components/base/BaseTable.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tableRef = ref()
const showModal = ref(false)
const editingRole = ref<Role | null>(null)

const columns: TableColumn[] = [
  { field: 'name', title: t('roles.columns.name'), width: 160 },
  { field: 'displayName', title: t('roles.columns.displayName'), minWidth: 140 },
  { field: 'description', title: t('roles.columns.description'), minWidth: 180 },
  { field: 'isSystem', title: t('roles.columns.isSystem'), width: 110, slotName: 'isSystem' },
  { field: 'userCount', title: t('roles.columns.userCount'), width: 100 },
  { field: 'permissions', title: t('roles.columns.permissionCount'), width: 100, slotName: 'permCount' },
  { field: 'createdAt', title: t('roles.columns.createdAt'), width: 160, sortable: true, slotName: 'createdAt' },
]

const actions: TableAction[] = [
  {
    label: t('common.actions.edit'),
    type: 'primary',
    icon: EditPen,
    permission: 'role:update',
    show: (row: Role) => !row.isSystem,
    handler: (row: Role) => {
      editingRole.value = row
      showModal.value = true
    },
  },
  {
    label: t('common.actions.delete'),
    type: 'danger',
    icon: Delete,
    permission: 'role:delete',
    confirm: t('common.messages.confirmDelete'),
    show: (row: Role) => !row.isSystem,
    handler: async (row: Role) => {
      try {
        await rolesApi.delete(row.id)
        ElMessage.success(t('common.messages.deleteSuccess'))
        tableRef.value?.load()
      } catch (err: any) {
        ElMessage.error(err?.response?.data?.message || '刪除失敗')
      }
    },
  },
]

// Roles API doesn't paginate — wrap it for BaseTable compatibility
async function fetchRoles() {
  const { data } = await rolesApi.list()
  return {
    data: {
      success: true,
      data: data.data,
      pagination: { page: 1, pageSize: data.data.length, total: data.data.length, totalPages: 1 },
    },
  }
}

function openCreate() {
  editingRole.value = null
  showModal.value = true
}

function formatDate(val: string) {
  return new Date(val).toLocaleString('zh-TW')
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('roles.title') }}</h2>
    </div>

    <BaseTable
        ref="tableRef"
        :columns="columns"
        :fetch-fn="fetchRoles"
        :actions="actions"
        export-filename="roles"
      >
        <template #toolbar-left>
          <el-button v-permission="'role:create'" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ t('common.actions.create') }}
          </el-button>
        </template>

        <template #isSystem="{ row }">
          <el-tag :type="row.isSystem ? 'danger' : 'info'" size="small">
            {{ row.isSystem ? t('roles.system') : t('roles.custom') }}
          </el-tag>
        </template>

        <template #permCount="{ row }">
          {{ row.permissions?.length ?? 0 }}
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </BaseTable>

    <RoleFormModal
      v-model="showModal"
      :role="editingRole"
      @success="tableRef?.load()"
    />
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-title  { margin: 0; font-size: 20px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.3px; }
</style>
