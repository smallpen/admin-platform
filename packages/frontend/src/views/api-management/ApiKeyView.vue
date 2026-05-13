<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, CopyDocument, Refresh } from '@element-plus/icons-vue'
import { apiKeyApi } from '@/api/modules/proxy.api'
import type { ApiKeyItem, ApiKeyCreated, CreateApiKeyDto } from '@/api/modules/proxy.api'
import { usePermission } from '@/composables/usePermission'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { has } = usePermission()

const keys = ref<ApiKeyItem[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
const showResultModal = ref(false)
const createdKey = ref('')

const createForm = ref<CreateApiKeyDto>({ name: '', allowedApis: ['*'] })
const createLoading = ref(false)
const allowedMode = ref<'all' | 'specific'>('all')

async function loadKeys() {
  loading.value = true
  try {
    const { data } = await apiKeyApi.list()
    keys.value = data.data
  } catch {
    ElMessage.error('載入失敗')
  } finally {
    loading.value = false
  }
}

onMounted(loadKeys)

async function createKey() {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('請輸入 Key 名稱')
    return
  }
  createLoading.value = true
  try {
    const { data } = await apiKeyApi.create(createForm.value)
    const result = data.data as ApiKeyCreated
    createdKey.value = result.rawKey
    showCreateModal.value = false
    showResultModal.value = true
    createForm.value = { name: '', allowedApis: ['*'] }
    allowedMode.value = 'all'
    await loadKeys()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '建立失敗')
  } finally {
    createLoading.value = false
  }
}

async function toggleKey(key: ApiKeyItem) {
  try {
    await apiKeyApi.toggle(key.id, !key.isActive)
    ElMessage.success('更新成功')
    await loadKeys()
  } catch {
    ElMessage.error('更新失敗')
  }
}

async function deleteKey(key: ApiKeyItem) {
  try {
    await ElMessageBox.confirm('確定要刪除此 API Key 嗎？此操作無法復原。', '刪除確認', {
      confirmButtonText: '確定刪除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await apiKeyApi.delete(key.id)
    ElMessage.success('刪除成功')
    await loadKeys()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || '刪除失敗')
  }
}

async function copyKey() {
  try {
    await navigator.clipboard.writeText(createdKey.value)
    ElMessage.success(t('proxy.apiKey.copiedSuccess'))
  } catch {
    ElMessage.warning('請手動複製上方的 Key')
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('proxy.apiKey.title') }}</h2>
    </div>

    <div class="base-table">
      <!-- Toolbar — 與 BaseTable 版型一致：按鈕在左，重新整理在右 -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button
            v-if="has('api_key:create')"
            type="primary"
            :icon="Plus"
            @click="showCreateModal = true"
          >
            {{ t('common.actions.create') }}
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="重新整理">
            <el-button :icon="Refresh" circle @click="loadKeys" />
          </el-tooltip>
        </div>
      </div>

      <div v-if="loading" class="skeleton-wrap">
        <div v-for="i in 5" :key="i" class="skeleton-row">
          <div class="skeleton skeleton-cell" style="flex:2" />
          <div class="skeleton skeleton-cell" style="width:160px;flex:none" />
          <div class="skeleton skeleton-cell" style="width:120px;flex:none" />
          <div class="skeleton skeleton-cell" style="width:90px;flex:none" />
          <div class="skeleton skeleton-cell" style="width:160px;flex:none" />
          <div class="skeleton skeleton-cell" style="width:120px;flex:none" />
        </div>
      </div>

      <vxe-table
        v-else
        :data="keys"
        border="inner"
        stripe
        round
        :row-config="{ isHover: true }"
      >
        <vxe-column field="name" :title="t('proxy.apiKey.columns.name')" min-width="140" />
        <vxe-column :title="t('proxy.apiKey.columns.keyPrefix')" width="200">
          <template #default="{ row }">
            <code class="key-prefix">{{ row.keyPrefix }}••••••••</code>
          </template>
        </vxe-column>
        <vxe-column :title="t('proxy.apiKey.columns.allowedApis')" width="140">
          <template #default="{ row }">
            <el-tag
              v-if="(row.allowedApis as string[]).includes('*')"
              type="success"
              size="small"
            >
              {{ t('proxy.apiKey.allApis') }}
            </el-tag>
            <el-tooltip v-else :content="(row.allowedApis as string[]).join(', ')" placement="top">
              <el-tag type="info" size="small">
                {{ (row.allowedApis as string[]).length }} 個 API
              </el-tag>
            </el-tooltip>
          </template>
        </vxe-column>
        <vxe-column :title="t('proxy.apiKey.columns.isActive')" width="90">
          <template #default="{ row }">
            <el-tag :class="row.isActive ? 'status-active' : 'status-inactive'" size="small">
              {{ row.isActive ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column :title="t('proxy.apiKey.columns.expiresAt')" width="150">
          <template #default="{ row }">
            <span v-if="row.expiresAt">{{ new Date(row.expiresAt).toLocaleDateString('zh-TW') }}</span>
            <span v-else class="text-muted">{{ t('proxy.apiKey.neverExpires') }}</span>
          </template>
        </vxe-column>
        <vxe-column :title="t('proxy.apiKey.columns.lastUsedAt')" width="160">
          <template #default="{ row }">
            <span v-if="row.lastUsedAt">{{ new Date(row.lastUsedAt).toLocaleString('zh-TW') }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </vxe-column>
        <vxe-column :title="t('proxy.apiKey.columns.createdAt')" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString('zh-TW') }}
          </template>
        </vxe-column>
        <vxe-column title="操作" width="100" fixed="right">
          <template #default="{ row }">
            <div class="action-cell">
              <el-tooltip :content="row.isActive ? '停用' : '啟用'" placement="top" :show-after="300">
                <el-button
                  v-if="has('api_key:update')"
                  :type="row.isActive ? 'warning' : 'success'"
                  plain
                  circle
                  size="small"
                  @click="toggleKey(row)"
                >
                  <el-icon><component :is="row.isActive ? 'Close' : 'Check'" /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="刪除" placement="top" :show-after="300">
                <el-button
                  v-if="has('api_key:delete')"
                  type="danger"
                  plain
                  circle
                  size="small"
                  :icon="Delete"
                  @click="deleteKey(row)"
                />
              </el-tooltip>
            </div>
          </template>
        </vxe-column>
      </vxe-table>

      <!-- 總筆數 -->
      <div class="table-footer">
        <span class="total-text">共 {{ keys.length }} 筆</span>
      </div>
    </div>

    <!-- 建立 Modal -->
    <el-dialog
      v-model="showCreateModal"
      :title="t('proxy.apiKey.form.createTitle')"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form label-width="120px">
        <el-form-item :label="t('proxy.apiKey.form.name')">
          <el-input
            v-model="createForm.name"
            :placeholder="t('proxy.apiKey.form.namePlaceholder')"
            @keyup.enter="createKey"
          />
        </el-form-item>
        <el-form-item :label="t('proxy.apiKey.form.allowedApis')">
          <el-radio-group
            v-model="allowedMode"
            @change="(v: string | number | boolean | undefined) => createForm.allowedApis = v === 'all' ? ['*'] : []"
          >
            <el-radio value="all">{{ t('proxy.apiKey.form.allowAllApis') }}</el-radio>
            <el-radio value="specific">{{ t('proxy.apiKey.form.selectApis') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('proxy.apiKey.form.expiresAt')">
          <el-date-picker
            v-model="createForm.expiresAt"
            type="datetime"
            placeholder="選擇到期時間（可留空）"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="createLoading" @click="createKey">
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Key 顯示 Modal（僅一次） -->
    <el-dialog
      v-model="showResultModal"
      :title="t('proxy.apiKey.keyCreated')"
      width="520px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-alert type="warning" :closable="false" style="margin-bottom: 16px;">
        <template #title>
          <b>{{ t('proxy.apiKey.copyKeyHint') }}</b>
        </template>
      </el-alert>

      <div class="key-display">
        <code>{{ createdKey }}</code>
      </div>

      <template #footer>
        <el-button type="primary" :icon="CopyDocument" @click="copyKey">
          {{ t('proxy.apiKey.copyKey') }}
        </el-button>
        <el-button @click="showResultModal = false">{{ t('common.actions.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }

.base-table {
  background: #fff;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--gray-200);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 12px;
  border-bottom: 1px solid var(--gray-100);
  background: #fff;
}
.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-footer {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--gray-100);
  background: var(--gray-50);
}
.total-text { font-size: 13px; color: #888; }

.skeleton-wrap { padding: 0 16px; }
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--gray-100);
}
.skeleton-cell { height: 16px; border-radius: 4px; min-width: 60px; }

.action-cell { display: flex; gap: 6px; align-items: center; }
.key-prefix {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--primary);
  background: rgba(79, 106, 245, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
}
.key-display {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  word-break: break-all;
}
.key-display code {
  color: #7dd3fc;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
}
.text-muted { color: #9ca3af; font-size: 13px; }
.skeleton-rows { padding: 0 0 8px; }
</style>
