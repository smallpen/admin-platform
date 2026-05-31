<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { usePermission } from '@/composables/usePermission'
import { scheduledTasksApi, type ScheduledTask } from '@/api/modules/scheduled-tasks.api'

const { t }   = useI18n()
const { has } = usePermission()

const tasks   = ref<ScheduledTask[]>([])
const loading = ref(false)

async function loadTasks() {
  loading.value = true
  try {
    const { data } = await scheduledTasksApi.list()
    tasks.value = data.data
  } finally {
    loading.value = false
  }
}

onMounted(loadTasks)

// ── 啟用開關 ──────────────────────────────────────
async function handleToggle(task: ScheduledTask) {
  try {
    const { data } = await scheduledTasksApi.update(task.id, { isEnabled: task.isEnabled })
    const idx = tasks.value.findIndex(t => t.id === task.id)
    if (idx !== -1) tasks.value[idx] = data.data
    ElMessage.success(t('scheduledTasks.messages.updateSuccess'))
  } catch (e: any) {
    // Revert toggle on failure
    task.isEnabled = !task.isEnabled
    ElMessage.error(e?.response?.data?.message ?? '操作失敗')
  }
}

// ── 手動觸發 ──────────────────────────────────────
const triggeringId = ref<string | null>(null)

async function handleTrigger(task: ScheduledTask) {
  try {
    await ElMessageBox.confirm(
      `確定要立即執行「${task.name}」嗎？`,
      '確認執行',
      { confirmButtonText: '執行', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  triggeringId.value = task.id
  try {
    const { data } = await scheduledTasksApi.trigger(task.id)
    const idx = tasks.value.findIndex(t => t.id === task.id)
    if (idx !== -1) tasks.value[idx] = data.data
    ElMessage.success(data.message ?? t('scheduledTasks.messages.triggerSuccess'))
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message ?? t('scheduledTasks.messages.triggerFailed'))
    await loadTasks()
  } finally {
    triggeringId.value = null
  }
}

// ── Cron Dialog ───────────────────────────────────
const cronDialogVisible = ref(false)
const cronTarget        = ref<ScheduledTask | null>(null)
const cronInput         = ref('')
const cronSaving        = ref(false)

function openCronDialog(task: ScheduledTask) {
  cronTarget.value = task
  cronInput.value  = task.cronExpression
  cronDialogVisible.value = true
}

async function handleSaveCron() {
  if (!cronTarget.value) return
  cronSaving.value = true
  try {
    const { data } = await scheduledTasksApi.update(cronTarget.value.id, { cronExpression: cronInput.value })
    const idx = tasks.value.findIndex(t => t.id === cronTarget.value!.id)
    if (idx !== -1) tasks.value[idx] = data.data
    ElMessage.success(t('scheduledTasks.messages.updateSuccess'))
    cronDialogVisible.value = false
  } catch (e: any) {
    const code = e?.response?.data?.code
    ElMessage.error(code === 'INVALID_CRON'
      ? t('scheduledTasks.messages.invalidCron')
      : (e?.response?.data?.message ?? '操作失敗'))
  } finally {
    cronSaving.value = false
  }
}

// ── Helpers ───────────────────────────────────────
const TASK_TYPE_LABEL: Record<string, string> = {
  CLEANUP_EXPIRED_TOKENS: t('scheduledTasks.taskTypes.CLEANUP_EXPIRED_TOKENS'),
  CLEANUP_ACTIVITY_LOGS:  t('scheduledTasks.taskTypes.CLEANUP_ACTIVITY_LOGS'),
}

type ElTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'
const STATUS_TYPE: Partial<Record<string, ElTagType>> = {
  SUCCESS: 'success',
  FAILED:  'danger',
  RUNNING: 'warning',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('scheduledTasks.title') }}</h2>
    </div>

    <el-alert
      :title="t('scheduledTasks.info')"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <el-card v-loading="loading" class="admin-card">
      <el-table :data="tasks" style="width: 100%">
        <el-table-column :label="t('scheduledTasks.columns.name')" prop="name" min-width="140" />

        <el-table-column :label="t('scheduledTasks.columns.taskType')" width="200">
          <template #default="{ row }">
            <el-tag type="info" size="small" effect="plain">
              {{ TASK_TYPE_LABEL[row.taskType] ?? row.taskType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('scheduledTasks.columns.cronExpression')" prop="cronExpression" width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.cronExpression" placement="top">
              <code class="cron-code">{{ row.cronExpression }}</code>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column :label="t('scheduledTasks.columns.isEnabled')" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              :disabled="!has('scheduled_task:update')"
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>

        <el-table-column :label="t('scheduledTasks.columns.lastRunAt')" width="175">
          <template #default="{ row }">
            {{ formatDate(row.lastRunAt) }}
          </template>
        </el-table-column>

        <el-table-column :label="t('scheduledTasks.columns.lastStatus')" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.lastStatus"
              :type="STATUS_TYPE[row.lastStatus] ?? 'info'"
              size="small"
            >
              {{ t(`scheduledTasks.statuses.${row.lastStatus}`) }}
            </el-tag>
            <span v-else style="color: var(--gray-400)">—</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('scheduledTasks.columns.lastMessage')" min-width="180">
          <template #default="{ row }">
            <el-tooltip v-if="row.lastMessage" :content="row.lastMessage" placement="top" :show-after="300">
              <span class="last-message">{{ row.lastMessage }}</span>
            </el-tooltip>
            <span v-else style="color: var(--gray-400)">—</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <div v-if="has('scheduled_task:update')" class="action-btns">
              <el-tooltip content="設定 Cron" placement="top">
                <el-button
                  size="small"
                  circle
                  class="action-btn action-btn--primary"
                  @click="openCronDialog(row)"
                >
                  <el-icon><EditPen /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="立即執行" placement="top">
                <el-button
                  size="small"
                  circle
                  class="action-btn action-btn--success"
                  :loading="triggeringId === row.id"
                  @click="handleTrigger(row)"
                >
                  <el-icon><VideoPlay /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Cron Dialog -->
    <el-dialog
      v-model="cronDialogVisible"
      :title="t('scheduledTasks.cronDialog.title')"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item :label="t('scheduledTasks.cronDialog.label')">
          <el-input
            v-model="cronInput"
            :placeholder="t('scheduledTasks.cronDialog.placeholder')"
            style="font-family: monospace"
          />
          <div class="cron-hint">{{ t('scheduledTasks.cronDialog.hint') }}</div>
          <div class="cron-examples">{{ t('scheduledTasks.cronDialog.examples') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cronDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="cronSaving" @click="handleSaveCron">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }

.cron-code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: var(--gray-100);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--gray-700);
}

.last-message {
  font-size: 12px;
  color: var(--gray-600);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: default;
}

.action-btns {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid;
  background: #fff;
  transition: all 0.15s;
}
.action-btn--primary {
  color: var(--primary);
  border-color: var(--primary);
}
.action-btn--primary:hover {
  background: var(--primary);
  color: #fff;
}
.action-btn--success {
  color: var(--success);
  border-color: var(--success);
}
.action-btn--success:hover {
  background: var(--success);
  color: #fff;
}

.cron-hint {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 6px;
}
.cron-examples {
  font-size: 11px;
  color: var(--gray-400);
  margin-top: 4px;
  line-height: 1.5;
}
</style>
