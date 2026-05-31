<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Delete, Plus } from '@element-plus/icons-vue'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { announcementsApi, type Announcement, type CreateAnnouncementDto } from '@/api/modules/announcements.api'
import BaseTable from '@/components/base/BaseTable.vue'
import type { TableColumn, TableAction } from '@/components/base/BaseTable.vue'

const { t } = useI18n()

// ── 篩選 ─────────────────────────────────────────
const filters = reactive({ keyword: '', type: '', status: '' })

// ── BaseTable ref ─────────────────────────────────
const tableRef = ref<{ load: () => void } | null>(null)

async function fetchAnnouncements(params: any) {
  const query = {
    ...params,
    ...(filters.keyword && { keyword: filters.keyword }),
    ...(filters.type    && { type:    filters.type }),
    ...(filters.status  && { status:  filters.status }),
  }
  return announcementsApi.list(query)
}

function handleSearch() { tableRef.value?.load() }
function handleReset() {
  filters.keyword = ''
  filters.type    = ''
  filters.status  = ''
  tableRef.value?.load()
}

// ── 欄位 ─────────────────────────────────────────
const columns: TableColumn[] = [
  { field: 'title',     title: t('announcements.columns.title'),     minWidth: 180 },
  { field: 'type',      title: t('announcements.columns.type'),      width: 90, slotName: 'type' },
  { field: 'status',    title: t('announcements.columns.status'),    width: 100, slotName: 'status' },
  { field: 'startAt',   title: t('announcements.columns.startAt'),   width: 160, slotName: 'startAt' },
  { field: 'endAt',     title: t('announcements.columns.endAt'),     width: 160, slotName: 'endAt' },
  { field: 'createdBy', title: t('announcements.columns.createdBy'), width: 120, slotName: 'creator' },
  { field: 'createdAt', title: t('announcements.columns.createdAt'), width: 160, slotName: 'createdAt' },
]

type ElTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'
const TYPE_TAG: Partial<Record<string, ElTagType>> = { WARNING: 'warning', DANGER: 'danger', SUCCESS: 'success' }
const STATUS_TAG: Partial<Record<string, ElTagType>> = { DRAFT: 'info', PUBLISHED: 'success' }

// ── Actions ───────────────────────────────────────
const actions: TableAction<Announcement>[] = [
  {
    label: '編輯',
    type: 'primary',
    icon: EditPen as Component,
    permission: 'announcement:update',
    handler: (row) => openDialog(row),
  },
  {
    label: '刪除',
    type: 'danger',
    icon: Delete as Component,
    permission: 'announcement:delete',
    confirm: t('announcements.messages.deleteConfirm'),
    handler: async (row) => {
      await announcementsApi.remove(row.id)
      ElMessage.success(t('announcements.messages.deleteSuccess'))
      tableRef.value?.load()
    },
  },
]

// ── Dialog ────────────────────────────────────────
const dialogVisible = ref(false)
const dialogMode    = ref<'create' | 'edit'>('create')
const editingId     = ref<string | null>(null)
const formLoading   = ref(false)

const form = reactive<CreateAnnouncementDto & { startAt?: string | null; endAt?: string | null }>({
  title:   '',
  content: '',
  type:    'INFO',
  status:  'DRAFT',
  startAt: null,
  endAt:   null,
})

function openDialog(row?: Announcement) {
  if (row) {
    dialogMode.value = 'edit'
    editingId.value  = row.id
    form.title   = row.title
    form.content = row.content
    form.type    = row.type
    form.status  = row.status
    form.startAt = row.startAt ? row.startAt.slice(0, 16) : null
    form.endAt   = row.endAt   ? row.endAt.slice(0, 16)   : null
  } else {
    dialogMode.value = 'create'
    editingId.value  = null
    form.title   = ''
    form.content = ''
    form.type    = 'INFO'
    form.status  = 'DRAFT'
    form.startAt = null
    form.endAt   = null
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.title.trim() || !form.content.trim()) {
    ElMessage.warning('標題與內容為必填')
    return
  }
  formLoading.value = true
  try {
    const payload = {
      ...form,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt:   form.endAt   ? new Date(form.endAt).toISOString()   : null,
    }
    if (dialogMode.value === 'create') {
      await announcementsApi.create(payload)
      ElMessage.success(t('announcements.messages.createSuccess'))
    } else {
      await announcementsApi.update(editingId.value!, payload)
      ElMessage.success(t('announcements.messages.updateSuccess'))
    }
    dialogVisible.value = false
    tableRef.value?.load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message ?? '操作失敗')
  } finally {
    formLoading.value = false
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('announcements.title') }}</h2>
    </div>

    <!-- 搜尋欄 -->
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        placeholder="搜尋標題或內容"
        clearable
        style="width:220px"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="filters.type" placeholder="類型" clearable style="width:120px">
        <el-option label="資訊" value="INFO" />
        <el-option label="警告" value="WARNING" />
        <el-option label="緊急" value="DANGER" />
        <el-option label="成功" value="SUCCESS" />
      </el-select>
      <el-select v-model="filters.status" placeholder="狀態" clearable style="width:120px">
        <el-option label="草稿"   value="DRAFT" />
        <el-option label="已發布" value="PUBLISHED" />
        <el-option label="已封存" value="ARCHIVED" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜尋</el-button>
      <el-button @click="handleReset">重設</el-button>
      <el-button type="primary" :icon="Plus" style="margin-left:auto" @click="openDialog()">
        新增公告
      </el-button>
    </div>

    <BaseTable
      ref="tableRef"
      :columns="columns"
      :fetch-fn="fetchAnnouncements"
      :actions="actions"
      row-key="id"
    >
      <template #type="{ row }">
        <el-tag :type="TYPE_TAG[row.type]" size="small" effect="light">
          {{ t(`announcements.types.${row.type}`) }}
        </el-tag>
      </template>

      <template #status="{ row }">
        <el-tag :type="STATUS_TAG[row.status]" size="small">
          {{ t(`announcements.statuses.${row.status}`) }}
        </el-tag>
      </template>

      <template #startAt="{ row }">{{ formatDate(row.startAt) }}</template>
      <template #endAt="{ row }">{{ formatDate(row.endAt) }}</template>

      <template #creator="{ row }">
        {{ row.creator?.displayName ?? '—' }}
      </template>

      <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
    </BaseTable>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增公告' : '編輯公告'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px" label-position="top" style="padding: 0 4px">
        <el-form-item :label="t('announcements.form.titleLabel')" required>
          <el-input
            v-model="form.title"
            :placeholder="t('announcements.form.titlePlaceholder')"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item :label="t('announcements.form.contentLabel')" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            :placeholder="t('announcements.form.contentPlaceholder')"
          />
        </el-form-item>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <el-form-item :label="t('announcements.form.typeLabel')">
            <el-select v-model="form.type" style="width:100%">
              <el-option label="資訊"  value="INFO" />
              <el-option label="警告"  value="WARNING" />
              <el-option label="緊急"  value="DANGER" />
              <el-option label="成功"  value="SUCCESS" />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('announcements.form.statusLabel')">
            <el-select v-model="form.status" style="width:100%">
              <el-option label="草稿"   value="DRAFT" />
              <el-option label="已發布" value="PUBLISHED" />
              <el-option label="已封存" value="ARCHIVED" />
            </el-select>
          </el-form-item>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <el-form-item :label="t('announcements.form.startAtLabel')">
            <el-input
              v-model="form.startAt"
              type="datetime-local"
              :placeholder="t('announcements.form.startAtPlaceholder')"
              clearable
              style="width:100%"
            />
          </el-form-item>

          <el-form-item :label="t('announcements.form.endAtLabel')">
            <el-input
              v-model="form.endAt"
              type="datetime-local"
              :placeholder="t('announcements.form.endAtPlaceholder')"
              clearable
              style="width:100%"
            />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">
          {{ dialogMode === 'create' ? '建立' : '儲存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
</style>
