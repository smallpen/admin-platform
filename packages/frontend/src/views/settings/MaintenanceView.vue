<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Delete, Plus } from '@element-plus/icons-vue'
import type { Component } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import type { TableColumn, TableAction } from '@/components/base/BaseTable.vue'
import { settingsApi, type MaintenanceStatus, type MaintenanceSchedule, type CreateScheduleDto, type UpdateScheduleDto } from '@/api/modules/settings.api'
import { useMaintenanceStore } from '@/stores/maintenance.store'
import { usePermission } from '@/composables/usePermission'

const { has } = usePermission()
const maintenanceStore = useMaintenanceStore()

// ── Maintenance Status ────────────────────────────────────────────────
const status = ref<MaintenanceStatus>({
  isActive: false,
  message: null,
  activatedAt: null,
  activatedBy: null,
})
const messageInput = ref('')
const statusLoading = ref(false)

async function loadStatus() {
  try {
    const res = await settingsApi.getMaintenance()
    status.value = res.data.data
    messageInput.value = status.value.message ?? ''
  } catch {
    // ignore
  }
}

async function toggleMaintenance() {
  const enabling = !status.value.isActive
  const confirmMsg = enabling
    ? '確定要立即開啟網站維護模式嗎？開啟後非管理員將無法登入。'
    : '確定要關閉維護模式嗎？'
  try {
    await ElMessageBox.confirm(confirmMsg, enabling ? '開啟維護' : '關閉維護', {
      confirmButtonText: enabling ? '確定開啟' : '確定關閉',
      cancelButtonText: '取消',
      type: enabling ? 'warning' : 'info',
    })
  } catch {
    return
  }

  statusLoading.value = true
  try {
    const res = await settingsApi.updateMaintenance({
      isActive: enabling,
      message: messageInput.value || null,
    })
    status.value = res.data.data
    maintenanceStore.status.isActive = res.data.data.isActive
    ElMessage.success(enabling ? '維護模式已開啟' : '維護模式已關閉')
  } catch {
    ElMessage.error('操作失敗，請稍後再試')
  } finally {
    statusLoading.value = false
  }
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-TW')
}

// ── Schedules Table ───────────────────────────────────────────────────
const tableRef = ref<{ load: () => void } | null>(null)

const columns: TableColumn[] = [
  { field: 'name',           title: '排程名稱',      minWidth: 140 },
  { field: 'cronExpression', title: 'Cron 表達式',   width: 150 },
  { field: 'duration',       title: '持續（分鐘）', width: 120, slotName: 'duration' },
  { field: 'isEnabled',      title: '啟用',          width: 80,  slotName: 'enabled' },
  { field: 'lastRunAt',      title: '上次執行',      minWidth: 160, slotName: 'lastRunAt' },
]

const actions: TableAction[] = [
  {
    label: '編輯',
    type: 'primary',
    icon: EditPen as Component,
    permission: 'settings:maintenance',
    handler: (row: MaintenanceSchedule) => openEditModal(row),
  },
  {
    label: '刪除',
    type: 'danger',
    icon: Delete as Component,
    permission: 'settings:maintenance',
    confirm: '確定要刪除此排程嗎？',
    handler: (row: MaintenanceSchedule) => deleteSchedule(row.id),
  },
]

async function fetchSchedules(_params?: unknown) {
  const { data } = await settingsApi.listSchedules()
  return {
    data: {
      success: true as const,
      data: data.data,
      pagination: { page: 1, pageSize: data.data.length, total: data.data.length, totalPages: 1 },
    },
  }
}

async function deleteSchedule(id: string) {
  try {
    await settingsApi.deleteSchedule(id)
    ElMessage.success('排程已刪除')
    tableRef.value?.load()
  } catch {
    ElMessage.error('刪除失敗')
  }
}

// ── Schedule Form Modal ───────────────────────────────────────────────
const modalVisible = ref(false)
const modalTitle = ref('新增排程')
const editingId = ref<string | null>(null)
const formLoading = ref(false)

type FrequencyType = 'daily' | 'weekly' | 'custom'

const form = ref<{
  name: string
  frequency: FrequencyType
  time: string
  daysOfWeek: number[]
  cronExpression: string
  duration: number
  isEnabled: boolean
}>({
  name: '',
  frequency: 'daily',
  time: '08:00',
  daysOfWeek: [1],
  cronExpression: '',
  duration: 60,
  isEnabled: true,
})

const DAYS = [
  { label: '週日', value: 0 },
  { label: '週一', value: 1 },
  { label: '週二', value: 2 },
  { label: '週三', value: 3 },
  { label: '週四', value: 4 },
  { label: '週五', value: 5 },
  { label: '週六', value: 6 },
]

function buildCronFromForm(): string {
  const [h, m] = form.value.time.split(':')
  if (form.value.frequency === 'daily') return `${m} ${h} * * *`
  if (form.value.frequency === 'weekly') {
    const days = form.value.daysOfWeek.sort().join(',')
    return `${m} ${h} * * ${days}`
  }
  return form.value.cronExpression
}

function parseCronToForm(cron: string): { frequency: FrequencyType; time: string; daysOfWeek: number[] } {
  const parts = cron.trim().split(/\s+/)
  if (parts.length === 5) {
    const [min, hour, , , dow] = parts
    const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
    if (dow === '*') return { frequency: 'daily', time, daysOfWeek: [1] }
    const days = dow.split(',').map(Number)
    return { frequency: 'weekly', time, daysOfWeek: days }
  }
  return { frequency: 'custom', time: '08:00', daysOfWeek: [1] }
}

function openAddModal() {
  modalTitle.value = '新增排程'
  editingId.value = null
  form.value = { name: '', frequency: 'daily', time: '08:00', daysOfWeek: [1], cronExpression: '', duration: 60, isEnabled: true }
  modalVisible.value = true
}

function openEditModal(row: MaintenanceSchedule) {
  modalTitle.value = '編輯排程'
  editingId.value = row.id
  const { frequency, time, daysOfWeek } = parseCronToForm(row.cronExpression)
  form.value = {
    name: row.name,
    frequency,
    time,
    daysOfWeek,
    cronExpression: row.cronExpression,
    duration: row.duration,
    isEnabled: row.isEnabled,
  }
  modalVisible.value = true
}

const computedCron = computed(() => {
  if (form.value.frequency === 'custom') return form.value.cronExpression
  return buildCronFromForm()
})

async function submitForm() {
  if (!form.value.name.trim()) {
    ElMessage.warning('請輸入排程名稱')
    return
  }
  const cron = computedCron.value
  if (!cron.trim()) {
    ElMessage.warning('請設定 Cron 表達式')
    return
  }
  formLoading.value = true
  try {
    const payload: CreateScheduleDto = {
      name: form.value.name,
      cronExpression: cron,
      duration: form.value.duration,
      isEnabled: form.value.isEnabled,
    }
    if (editingId.value) {
      await settingsApi.updateSchedule(editingId.value, payload as UpdateScheduleDto)
      ElMessage.success('排程已更新')
    } else {
      await settingsApi.createSchedule(payload)
      ElMessage.success('排程已建立')
    }
    modalVisible.value = false
    tableRef.value?.load()
  } catch {
    ElMessage.error('操作失敗，請稍後再試')
  } finally {
    formLoading.value = false
  }
}

onMounted(loadStatus)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">網站維護</h2>
    </div>

    <!-- Status Card -->
    <div class="admin-card status-card">
      <div class="status-header">
        <div class="status-info">
          <span class="status-label">目前狀態</span>
          <el-tag
            :type="status.isActive ? 'danger' : 'success'"
            size="large"
            effect="light"
            class="status-badge"
          >
            {{ status.isActive ? '維護中' : '正常運作' }}
          </el-tag>
        </div>
        <el-button
          v-if="has('settings:maintenance')"
          :type="status.isActive ? 'info' : 'warning'"
          :loading="statusLoading"
          @click="toggleMaintenance"
        >
          {{ status.isActive ? '關閉維護' : '立即開啟維護' }}
        </el-button>
      </div>

      <div v-if="status.isActive" class="status-meta">
        <span>啟動時間：{{ formatDateTime(status.activatedAt) }}</span>
        <span v-if="status.activatedBy">・操作人：{{ status.activatedBy }}</span>
      </div>

      <div class="message-row">
        <span class="field-label">維護說明訊息</span>
        <el-input
          v-model="messageInput"
          placeholder="輸入顯示給使用者的維護說明（選填）"
          clearable
          :disabled="!has('settings:maintenance')"
          style="max-width: 520px;"
        />
      </div>
    </div>

    <!-- Schedules Table -->
    <div style="margin-top: 24px;">
      <div class="section-header">
        <h3 class="section-title">維護排程</h3>
        <el-button
          v-if="has('settings:maintenance')"
          type="primary"
          :icon="Plus"
          @click="openAddModal"
        >
          新增排程
        </el-button>
      </div>

      <BaseTable
        ref="tableRef"
        :columns="columns"
        :fetch-fn="fetchSchedules"
        :actions="actions"
        :export-filename="'維護排程'"
      >
        <template #duration="{ row }">
          {{ row.duration }} 分鐘
        </template>
        <template #enabled="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
            {{ row.isEnabled ? '啟用' : '停用' }}
          </el-tag>
        </template>
        <template #lastRunAt="{ row }">
          {{ formatDateTime(row.lastRunAt) }}
        </template>
      </BaseTable>
    </div>

    <!-- Schedule Form Modal -->
    <el-dialog
      v-model="modalVisible"
      :title="modalTitle"
      width="520px"
      destroy-on-close
    >
      <el-form label-position="top" class="schedule-form">
        <el-form-item label="排程名稱" required>
          <el-input v-model="form.name" placeholder="例如：每週一早上維護" />
        </el-form-item>

        <el-form-item label="頻率">
          <el-radio-group v-model="form.frequency">
            <el-radio-button value="daily">每日</el-radio-button>
            <el-radio-button value="weekly">每週</el-radio-button>
            <el-radio-button value="custom">自訂 Cron</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.frequency !== 'custom'">
          <el-form-item label="時間">
            <el-time-picker
              v-model="form.time"
              value-format="HH:mm"
              format="HH:mm"
              placeholder="選擇時間"
              style="width: 160px;"
            />
          </el-form-item>

          <el-form-item v-if="form.frequency === 'weekly'" label="星期">
            <el-checkbox-group v-model="form.daysOfWeek">
              <el-checkbox v-for="d in DAYS" :key="d.value" :value="d.value">
                {{ d.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </template>

        <el-form-item v-else label="Cron 表達式">
          <el-input v-model="form.cronExpression" placeholder="例如：0 8 * * 1" />
          <div class="cron-hint">格式：分 時 日 月 週（0=週日，1=週一，…）</div>
        </el-form-item>

        <el-form-item label="預覽 Cron">
          <el-tag type="warning" effect="plain">{{ computedCron || '—' }}</el-tag>
        </el-form-item>

        <el-form-item label="持續時間（分鐘）">
          <el-input-number v-model="form.duration" :min="1" :max="1440" style="width: 160px;" />
        </el-form-item>

        <el-form-item label="啟用排程">
          <el-switch v-model="form.isEnabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="submitForm">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.status-card {
  padding: 24px;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-600);
}

.status-badge {
  font-size: 14px;
  padding: 0 12px;
  height: 30px;
}

.status-meta {
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 16px;
}

.message-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
  white-space: nowrap;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.schedule-form {
  padding: 0 4px;
}

.cron-hint {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 4px;
}
</style>
