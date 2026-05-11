<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Delete } from '@element-plus/icons-vue'
import BaseTable from '@/components/base/BaseTable.vue'
import PermissionFormModal from '@/components/business/PermissionFormModal.vue'
import { permissionsApi } from '@/api/modules/permissions.api'
import type { Permission, PermissionGroup } from '@admin/shared'
import type { TableColumn, TableAction } from '@/components/base/BaseTable.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tableRef = ref()
const showModal = ref(false)
const editingPermission = ref<Permission | null>(null)

const columns: TableColumn[] = [
  { field: 'code',        title: t('permissions.columns.code'),        width: 200, slotName: 'code' },
  { field: 'name',        title: t('permissions.columns.name'),        minWidth: 140 },
  { field: 'group',       title: t('permissions.columns.group'),       width: 120, slotName: 'group' },
  { field: 'description', title: t('permissions.columns.description'), minWidth: 180 },
  { field: 'createdAt',   title: t('roles.columns.createdAt'),         width: 160, sortable: true, slotName: 'createdAt' },
]

const actions: TableAction[] = [
  {
    label: t('common.actions.edit'),
    type: 'primary',
    icon: EditPen,
    permission: 'permission:update',
    handler: (row: Permission) => {
      editingPermission.value = row
      showModal.value = true
    },
  },
  {
    label: t('common.actions.delete'),
    type: 'danger',
    icon: Delete,
    permission: 'permission:delete',
    confirm: t('common.messages.confirmDelete'),
    handler: async (row: Permission) => {
      try {
        await permissionsApi.delete(row.id)
        ElMessage.success(t('common.messages.deleteSuccess'))
        tableRef.value?.load()
      } catch (err: any) {
        ElMessage.error(err?.response?.data?.message || '刪除失敗')
      }
    },
  },
]

// 將分組結構展平成 BaseTable 所需的列表格式
async function fetchPermissions(_params?: unknown) {
  const { data } = await permissionsApi.list()
  const groups: PermissionGroup[] = data.data
  const flatList: Permission[] = groups.flatMap(g => g.permissions)
  return {
    data: {
      success: true as const,
      data: flatList,
      pagination: { page: 1, pageSize: flatList.length, total: flatList.length, totalPages: 1 },
    },
  }
}

function openCreate() {
  editingPermission.value = null
  showModal.value = true
}

function formatDate(val: string) {
  return new Date(val).toLocaleString('zh-TW')
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('permissions.title') }}</h2>
    </div>

    <BaseTable
        ref="tableRef"
        :columns="columns"
        :fetch-fn="fetchPermissions"
        :actions="actions"
        export-filename="permissions"
      >
        <template #toolbar-left>
          <el-button v-permission="'permission:create'" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ t('common.actions.create') }}
          </el-button>
        </template>

        <template #code="{ row }">
          <el-tag type="warning" size="small" effect="plain">{{ row.code }}</el-tag>
        </template>

        <template #group="{ row }">
          <el-tag type="info" size="small">{{ t(`permissions.groups.${row.group}`, row.group) }}</el-tag>
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </BaseTable>

    <PermissionFormModal
      v-model="showModal"
      :permission="editingPermission"
      @success="tableRef?.load()"
    />
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-title  { margin: 0; font-size: 20px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.3px; }
</style>
