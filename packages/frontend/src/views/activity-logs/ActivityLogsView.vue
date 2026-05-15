<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import { activityLogsApi, type ActivityLog } from '@/api/modules/activity-logs.api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const logs = ref<ActivityLog[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  dateRange: null as [string, string] | null,
  module:    '',
  action:    '',
  username:  '',
})

const detailDrawer = ref(false)
const selectedLog = ref<ActivityLog | null>(null)
const activeDetailTab = ref('before')

const MODULE_OPTIONS = [
  { value: 'users',       label: t('activityLogs.modules.users') },
  { value: 'roles',       label: t('activityLogs.modules.roles') },
  { value: 'permissions', label: t('activityLogs.modules.permissions') },
  { value: 'ads',         label: t('activityLogs.modules.ads') },
  { value: 'proxy_api',   label: t('activityLogs.modules.proxy_api') },
  { value: 'api_key',     label: t('activityLogs.modules.api_key') },
  { value: 'settings',    label: t('activityLogs.modules.settings') },
  { value: 'auth',        label: t('activityLogs.modules.auth') },
]

const ACTION_OPTIONS = [
  { value: 'CREATE', label: t('activityLogs.actions.CREATE') },
  { value: 'UPDATE', label: t('activityLogs.actions.UPDATE') },
  { value: 'DELETE', label: t('activityLogs.actions.DELETE') },
  { value: 'LOGIN',  label: t('activityLogs.actions.LOGIN') },
  { value: 'LOGOUT', label: t('activityLogs.actions.LOGOUT') },
  { value: 'ASSIGN', label: t('activityLogs.actions.ASSIGN') },
]

const ACTION_TAG_TYPE: Record<string, string> = {
  CREATE: 'success',
  UPDATE: 'primary',
  DELETE: 'danger',
  LOGIN:  'info',
  LOGOUT: '',
  ASSIGN: 'warning',
}

function getModuleLabel(module: string) {
  return MODULE_OPTIONS.find(m => m.value === module)?.label ?? module
}

function getActionLabel(action: string) {
  return ACTION_OPTIONS.find(a => a.value === action)?.label ?? action
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-TW', {
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

async function loadLogs() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (filters.value.dateRange) {
      params.dateFrom = filters.value.dateRange[0]
      params.dateTo   = filters.value.dateRange[1]
    }
    if (filters.value.module)   params.module   = filters.value.module
    if (filters.value.action)   params.action   = filters.value.action
    if (filters.value.username) params.username = filters.value.username

    const { data } = await activityLogsApi.list(params)
    logs.value  = data.data
    total.value = data.pagination.total
  } catch {
    ElMessage.error('載入失敗')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadLogs()
}

function resetFilters() {
  filters.value = { dateRange: null, module: '', action: '', username: '' }
  page.value = 1
  loadLogs()
}

function handlePageChange(p: number) {
  page.value = p
  loadLogs()
}

function openDetail(log: ActivityLog) {
  selectedLog.value  = log
  activeDetailTab.value = log.before ? 'before' : 'after'
  detailDrawer.value = true
}

onMounted(loadLogs)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('activityLogs.title') }}</h2>
    </div>

    <!-- 篩選卡片 -->
    <div class="filter-card admin-card">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">{{ t('activityLogs.filters.dateRange') }}</label>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            value-format="YYYY-MM-DD"
            style="width: 300px"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('activityLogs.filters.module') }}</label>
          <el-select
            v-model="filters.module"
            clearable
            :placeholder="t('activityLogs.filters.allModules')"
            style="width: 160px"
          >
            <el-option
              v-for="m in MODULE_OPTIONS"
              :key="m.value"
              :value="m.value"
              :label="m.label"
            />
          </el-select>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('activityLogs.filters.action') }}</label>
          <el-select
            v-model="filters.action"
            clearable
            :placeholder="t('activityLogs.filters.allActions')"
            style="width: 130px"
          >
            <el-option
              v-for="a in ACTION_OPTIONS"
              :key="a.value"
              :value="a.value"
              :label="a.label"
            />
          </el-select>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('activityLogs.filters.username') }}</label>
          <el-input
            v-model="filters.username"
            clearable
            :placeholder="t('activityLogs.filters.username')"
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>

      <div class="filter-actions">
        <el-button type="primary" @click="handleSearch">{{ t('common.actions.search') }}</el-button>
        <el-button @click="resetFilters">{{ t('common.actions.reset') }}</el-button>
      </div>
    </div>

    <!-- 紀錄表格 -->
    <div class="admin-card">
      <div v-if="loading" class="skeleton-rows">
        <div v-for="i in 5" :key="i" class="skeleton" style="height: 52px; margin-bottom: 4px; border-radius: 4px;" />
      </div>

      <el-table v-else :data="logs" style="width: 100%">
        <el-table-column :label="t('activityLogs.columns.createdAt')" width="175">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column :label="t('activityLogs.columns.user')" width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-name">{{ row.user.username }}</span>
              <span class="user-display">{{ row.user.displayName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="t('activityLogs.columns.action')" width="90">
          <template #default="{ row }">
            <el-tag :type="ACTION_TAG_TYPE[row.action] as any" size="small">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('activityLogs.columns.module')" width="110">
          <template #default="{ row }">
            {{ getModuleLabel(row.module) }}
          </template>
        </el-table-column>

        <el-table-column :label="t('activityLogs.columns.targetName')" min-width="150">
          <template #default="{ row }">
            <span v-if="row.targetName">{{ row.targetName }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('activityLogs.columns.ipAddress')" width="135">
          <template #default="{ row }">
            <code v-if="row.ipAddress" class="ip-code">{{ row.ipAddress }}</code>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('activityLogs.columns.detail')" width="80" fixed="right">
          <template #default="{ row }">
            <div class="action-cell">
              <el-tooltip v-if="row.before || row.after" content="查看詳情" placement="top" :show-after="300">
                <el-button
                  type="primary"
                  :icon="View"
                  plain
                  circle
                  size="small"
                  @click="openDetail(row)"
                />
              </el-tooltip>
              <span v-else class="text-muted">—</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 詳情 Drawer -->
    <el-drawer
      v-model="detailDrawer"
      :title="t('activityLogs.detail.title')"
      size="500px"
      direction="rtl"
    >
      <template v-if="selectedLog">
        <el-descriptions :column="1" border size="small" class="detail-desc">
          <el-descriptions-item :label="t('activityLogs.columns.createdAt')">
            {{ formatDate(selectedLog.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('activityLogs.columns.user')">
            {{ selectedLog.user.username }} ({{ selectedLog.user.displayName }})
          </el-descriptions-item>
          <el-descriptions-item :label="t('activityLogs.columns.action')">
            <el-tag :type="ACTION_TAG_TYPE[selectedLog.action] as any" size="small">
              {{ getActionLabel(selectedLog.action) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('activityLogs.columns.module')">
            {{ getModuleLabel(selectedLog.module) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedLog.targetName" :label="t('activityLogs.columns.targetName')">
            {{ selectedLog.targetName }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedLog.ipAddress" :label="t('activityLogs.columns.ipAddress')">
            <code>{{ selectedLog.ipAddress }}</code>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedLog.before !== null || selectedLog.after !== null" class="json-section">
          <el-tabs v-model="activeDetailTab">
            <el-tab-pane :label="t('activityLogs.detail.before')" name="before">
              <pre v-if="selectedLog.before" class="json-viewer">{{ JSON.stringify(selectedLog.before, null, 2) }}</pre>
              <div v-else class="json-empty">{{ t('activityLogs.detail.noData') }}</div>
            </el-tab-pane>
            <el-tab-pane :label="t('activityLogs.detail.after')" name="after">
              <pre v-if="selectedLog.after" class="json-viewer">{{ JSON.stringify(selectedLog.after, null, 2) }}</pre>
              <div v-else class="json-empty">{{ t('activityLogs.detail.noData') }}</div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }

.filter-card {
  margin-bottom: 16px;
  padding: 16px 20px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 14px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-600, #4b5563);
  white-space: nowrap;
}
.filter-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--gray-100, #f3f4f6);
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-name {
  font-weight: 500;
  font-size: 13px;
}
.user-display {
  font-size: 11px;
  color: #9ca3af;
}

.ip-code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--primary);
}

.text-muted { color: #9ca3af; font-size: 13px; }

.skeleton-rows { padding: 0 0 8px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

.detail-desc { margin-bottom: 20px; }

.json-section { margin-top: 20px; }

.json-viewer {
  background: var(--el-fill-color-light);
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 480px;
  overflow-y: auto;
  margin: 0;
  line-height: 1.6;
}

.json-empty {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-cell :deep(.el-button.is-circle) {
  width: 28px !important;
  height: 28px !important;
  padding: 0 !important;
}
.action-cell :deep(.el-button--primary.is-plain) {
  background-color: #fff !important;
  border-color: #a5b4fc !important;
  color: var(--primary) !important;
  box-shadow: none !important;
  transform: none !important;
}
.action-cell :deep(.el-button--primary.is-plain:hover) {
  background-color: var(--primary) !important;
  border-color: var(--primary) !important;
  color: #fff !important;
  transform: none !important;
  box-shadow: none !important;
}
</style>
