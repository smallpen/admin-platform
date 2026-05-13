<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiLogApi, proxyApiApi } from '@/api/modules/proxy.api'
import type { ApiCallLog, ProxyApi } from '@/api/modules/proxy.api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const logs = ref<ApiCallLog[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const apiOptions = ref<ProxyApi[]>([])

const filters = ref({
  apiId:        '',
  responseCode: '',
  dateFrom:     '',
  dateTo:       '',
})

async function loadApis() {
  try {
    const { data } = await proxyApiApi.list({ pageSize: 200 })
    apiOptions.value = data.data
  } catch {}
}

async function loadLogs() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (filters.value.apiId) params.apiId = filters.value.apiId
    if (filters.value.responseCode) params.responseCode = Number(filters.value.responseCode)
    if (filters.value.dateFrom) params.dateFrom = new Date(filters.value.dateFrom).toISOString()
    if (filters.value.dateTo) params.dateTo = new Date(filters.value.dateTo + 'T23:59:59').toISOString()

    const { data } = await apiLogApi.list(params)
    logs.value = data.data
    total.value = data.pagination.total
  } catch {
    ElMessage.error('載入失敗')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value = { apiId: '', responseCode: '', dateFrom: '', dateTo: '' }
  page.value = 1
  loadLogs()
}

function handlePageChange(p: number) {
  page.value = p
  loadLogs()
}

function isSuccess(code: number) {
  return code >= 200 && code < 300
}

onMounted(() => {
  loadApis()
  loadLogs()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('proxy.apiLog.title') }}</h2>
    </div>

    <!-- 篩選卡片 -->
    <div class="filter-card admin-card">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">{{ t('proxy.apiLog.filters.allApis') }}</label>
          <el-select
            v-model="filters.apiId"
            clearable
            placeholder="全部 API"
            style="width: 220px"
          >
            <el-option
              v-for="api in apiOptions"
              :key="api.id"
              :value="api.id"
              :label="api.name"
            />
          </el-select>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('proxy.apiLog.filters.allStatus') }}</label>
          <el-select
            v-model="filters.responseCode"
            clearable
            placeholder="全部狀態"
            style="width: 160px"
          >
            <el-option value="200" label="200 成功" />
            <el-option value="400" label="400 參數錯誤" />
            <el-option value="401" label="401 未認證" />
            <el-option value="403" label="403 無權限" />
            <el-option value="404" label="404 不存在" />
            <el-option value="500" label="500 執行錯誤" />
          </el-select>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('proxy.apiLog.filters.dateRange') }}</label>
          <div class="date-range-wrap">
            <el-date-picker
              v-model="filters.dateFrom"
              type="date"
              placeholder="開始日期"
              value-format="YYYY-MM-DD"
              style="width: 148px"
            />
            <span class="date-separator">至</span>
            <el-date-picker
              v-model="filters.dateTo"
              type="date"
              placeholder="結束日期"
              value-format="YYYY-MM-DD"
              style="width: 148px"
            />
          </div>
        </div>
      </div>

      <div class="filter-actions">
        <el-button type="primary" @click="() => { page = 1; loadLogs() }">
          {{ t('common.actions.search') }}
        </el-button>
        <el-button @click="resetFilters">{{ t('common.actions.reset') }}</el-button>
      </div>
    </div>

    <!-- 日誌表格 -->
    <div class="admin-card">
      <div v-if="loading" class="skeleton-rows">
        <div v-for="i in 5" :key="i" class="skeleton" style="height: 52px; margin-bottom: 4px; border-radius: 4px;" />
      </div>

      <el-table v-else :data="logs" style="width: 100%">
        <el-table-column :label="t('proxy.apiLog.columns.calledAt')" width="170">
          <template #default="{ row }">
            {{ new Date(row.calledAt).toLocaleString('zh-TW') }}
          </template>
        </el-table-column>

        <el-table-column :label="t('proxy.apiLog.columns.apiName')" min-width="150">
          <template #default="{ row }">
            <span>{{ row.proxyApi?.name }}</span>
            <br>
            <code class="path-code">/api/proxy/{{ row.proxyApi?.path }}</code>
          </template>
        </el-table-column>

        <el-table-column :label="t('proxy.apiLog.columns.callerIp')" width="140">
          <template #default="{ row }">
            <code>{{ row.callerIp }}</code>
          </template>
        </el-table-column>

        <el-table-column :label="t('proxy.apiLog.columns.responseCode')" width="110">
          <template #default="{ row }">
            <el-tag
              :type="isSuccess(row.responseCode) ? 'success' : 'danger'"
              size="small"
            >
              {{ row.responseCode }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('proxy.apiLog.columns.durationMs')" width="100">
          <template #default="{ row }">
            <span :class="row.durationMs > 1000 ? 'text-warning' : ''">
              {{ row.durationMs }} ms
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="t('proxy.apiLog.columns.apiKey')" width="160">
          <template #default="{ row }">
            <code v-if="row.apiKey" class="key-prefix">{{ row.apiKey.keyPrefix }}••••</code>
            <span v-else class="text-muted">JWT</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('proxy.apiLog.columns.errorMsg')" min-width="200">
          <template #default="{ row }">
            <el-tooltip v-if="row.errorMsg" :content="row.errorMsg" placement="top" :show-after="300">
              <span class="error-text">{{ row.errorMsg.slice(0, 60) }}{{ row.errorMsg.length > 60 ? '...' : '' }}</span>
            </el-tooltip>
            <span v-else class="text-muted">—</span>
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
.date-range-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.date-separator {
  font-size: 13px;
  color: var(--gray-500, #6b7280);
  white-space: nowrap;
}
.filter-actions {
  display: flex;
  gap: 8px;
  padding-top: 2px;
  border-top: 1px solid var(--gray-100, #f3f4f6);
}
.path-code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px;
  color: #6b7280;
}
.key-prefix {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--primary);
}
.error-text { color: var(--danger, #ef4444); font-size: 12px; }
.text-muted  { color: #9ca3af; font-size: 13px; }
.text-warning { color: var(--warning, #f59e0b); }
.skeleton-rows { padding: 0 0 8px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
