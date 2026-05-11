<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Key, Delete } from '@element-plus/icons-vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseStatusTag from '@/components/base/BaseStatusTag.vue'
import UserFormModal from '@/components/business/UserFormModal.vue'
import { usersApi } from '@/api/modules/users.api'
import type { User } from '@admin/shared'
import type { TableColumn, TableAction } from '@/components/base/BaseTable.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tableRef = ref()
const showModal = ref(false)
const editingUser = ref<User | null>(null)
const resetPasswordModal = ref(false)
const resetPasswordUserId = ref('')
const newPassword = ref('')

const columns: TableColumn[] = [
  { field: 'username', title: t('users.columns.username'), width: 140, sortable: true },
  { field: 'displayName', title: t('users.columns.displayName'), minWidth: 120 },
  { field: 'email', title: t('users.columns.email'), minWidth: 180 },
  { field: 'status', title: t('users.columns.status'), width: 100, slotName: 'status' },
  { field: 'roles', title: t('users.columns.roles'), minWidth: 150, slotName: 'roles' },
  { field: 'lastLoginAt', title: t('users.columns.lastLoginAt'), width: 160, sortable: true, slotName: 'lastLoginAt' },
  { field: 'createdAt', title: t('users.columns.createdAt'), width: 160, sortable: true, slotName: 'createdAt' },
]

const actions: TableAction[] = [
  {
    label: t('common.actions.edit'),
    type: 'primary',
    icon: EditPen,
    permission: 'user:update',
    handler: (row: User) => {
      editingUser.value = row
      showModal.value = true
    },
  },
  {
    label: t('users.actions.resetPassword'),
    type: 'warning',
    icon: Key,
    permission: 'user:update',
    handler: (row: User) => {
      resetPasswordUserId.value = row.id
      newPassword.value = ''
      resetPasswordModal.value = true
    },
  },
  {
    label: t('common.actions.delete'),
    type: 'danger',
    icon: Delete,
    permission: 'user:delete',
    confirm: t('common.messages.confirmDelete'),
    handler: async (row: User) => {
      try {
        await usersApi.delete(row.id)
        ElMessage.success(t('common.messages.deleteSuccess'))
        tableRef.value?.load()
      } catch (err: any) {
        ElMessage.error(err?.response?.data?.message || '刪除失敗')
      }
    },
  },
]

function fetchUsers(params: any) {
  return usersApi.list(params)
}

function openCreate() {
  editingUser.value = null
  showModal.value = true
}

function onModalSuccess() {
  tableRef.value?.load()
}

async function confirmResetPassword() {
  if (!newPassword.value || newPassword.value.length < 8) {
    ElMessage.warning('密碼至少 8 個字元')
    return
  }
  try {
    await usersApi.updatePassword(resetPasswordUserId.value, newPassword.value)
    ElMessage.success('密碼重設成功')
    resetPasswordModal.value = false
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '操作失敗')
  }
}

function formatDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleString('zh-TW')
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('users.title') }}</h2>
    </div>

    <BaseTable
        ref="tableRef"
        :columns="columns"
        :fetch-fn="fetchUsers"
        :actions="actions"
        export-filename="users"
      >
        <template #toolbar-left>
          <el-button v-permission="'user:create'" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ t('common.actions.create') }}
          </el-button>
        </template>

        <template #status="{ row }">
          <BaseStatusTag :status="row.status" />
        </template>

        <template #roles="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role.id"
            size="small"
            style="margin-right: 4px; margin-bottom: 2px"
          >
            {{ role.displayName }}
          </el-tag>
        </template>

        <template #lastLoginAt="{ row }">
          {{ formatDate(row.lastLoginAt) }}
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </BaseTable>

    <!-- Create/Edit Modal -->
    <UserFormModal
      v-model="showModal"
      :user="editingUser"
      @success="onModalSuccess"
    />

    <!-- Reset Password Modal -->
    <el-dialog v-model="resetPasswordModal" title="重設密碼" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新密碼">
          <el-input v-model="newPassword" type="password" placeholder="請輸入新密碼（至少 8 個字元）" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordModal = false">取消</el-button>
        <el-button type="primary" @click="confirmResetPassword">確認重設</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-title  { margin: 0; font-size: 20px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.3px; }
</style>
