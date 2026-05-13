<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, MagicStick, Loading } from '@element-plus/icons-vue'
import { proxyApiApi, spDiscoveryApi } from '@/api/modules/proxy.api'
import type { ProxyApi, CreateProxyApiDto, ParamMapping } from '@/api/modules/proxy.api'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ api: ProxyApi | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { t } = useI18n()
const loading = ref(false)
const formRef = ref()

// SP 下拉選單相關
const spList = ref<string[]>([])
const spListLoading = ref(false)
const spParamsLoading = ref(false)
const paramsAutoFilled = ref(false)

const defaultForm = (): CreateProxyApiDto => ({
  name:            '',
  path:            '',
  method:          'POST',
  description:     '',
  storedProcedure: '',
  paramMappings:   [],
  requireAuth:     true,
  authType:        'JWT',
  isActive:        true,
})

const form = ref<CreateProxyApiDto>(defaultForm())

watch(() => props.api, (api) => {
  if (api) {
    form.value = {
      name:            api.name,
      path:            api.path,
      method:          api.method,
      description:     api.description ?? '',
      storedProcedure: api.storedProcedure,
      paramMappings:   api.paramMappings.map(m => ({ ...m })),
      requireAuth:     api.requireAuth,
      authType:        api.authType,
      isActive:        api.isActive,
    }
    paramsAutoFilled.value = api.paramMappings.length > 0
  } else {
    form.value = defaultForm()
    paramsAutoFilled.value = false
  }
}, { immediate: true })

async function loadSpList() {
  spListLoading.value = true
  try {
    const { data } = await spDiscoveryApi.listAll()
    spList.value = data.data
  } catch {
    ElMessage.warning('無法載入 Stored Procedure 清單')
  } finally {
    spListLoading.value = false
  }
}

async function onSpChange(spName: string) {
  if (!spName) return
  spParamsLoading.value = true
  paramsAutoFilled.value = false
  try {
    const { data } = await spDiscoveryApi.getParams(spName)
    const params = data.data as ParamMapping[]
    form.value.paramMappings = params
    paramsAutoFilled.value = params.length > 0
    if (params.length > 0) {
      ElMessage.success(`已自動帶入 ${params.length} 個輸入參數`)
    } else {
      ElMessage.info('此 SP 沒有 IN 參數')
    }
  } catch {
    ElMessage.error('無法取得 SP 參數，請手動填寫')
  } finally {
    spParamsLoading.value = false
  }
}

function addParam() {
  form.value.paramMappings.push({
    inputName:    '',
    spParamName:  '',
    type:         'string',
    required:     true,
    defaultValue: '',
    description:  '',
  })
}

function removeParam(index: number) {
  form.value.paramMappings.splice(index, 1)
}

const rules = {
  name: [{ required: true, message: '請輸入 API 名稱', trigger: 'blur' }],
  path: [
    { required: true, message: '請輸入 API 路徑', trigger: 'blur' },
    { pattern: /^[a-z0-9][a-z0-9-]*$/, message: '只能含小寫英文、數字與連字號', trigger: 'blur' },
  ],
  storedProcedure: [
    { required: true, message: '請選擇 Stored Procedure', trigger: 'change' },
  ],
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    if (props.api) {
      await proxyApiApi.update(props.api.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await proxyApiApi.create(form.value)
      ElMessage.success('建立成功')
    }
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失敗')
  } finally {
    loading.value = false
  }
}

onMounted(loadSpList)
</script>

<template>
  <el-dialog
    :model-value="true"
    :title="api ? t('proxy.apiList.form.editTitle') : t('proxy.apiList.form.createTitle')"
    width="800px"
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      label-position="right"
    >
      <!-- 基本資訊 -->
      <el-form-item :label="t('proxy.apiList.form.name')" prop="name">
        <el-input v-model="form.name" :placeholder="t('proxy.apiList.form.namePlaceholder')" />
      </el-form-item>

      <el-form-item :label="t('proxy.apiList.form.path')" prop="path">
        <el-input
          v-model="form.path"
          :placeholder="t('proxy.apiList.form.pathPlaceholder')"
          :disabled="!!api"
        >
          <template #prepend>/api/proxy/</template>
        </el-input>
      </el-form-item>

      <el-form-item :label="t('proxy.apiList.form.method')">
        <el-select v-model="form.method" style="width: 140px">
          <el-option value="GET"    label="GET" />
          <el-option value="POST"   label="POST" />
          <el-option value="PUT"    label="PUT" />
          <el-option value="DELETE" label="DELETE" />
        </el-select>
      </el-form-item>

      <!-- SP 下拉選單 -->
      <el-form-item :label="t('proxy.apiList.form.storedProcedure')" prop="storedProcedure">
        <div class="sp-select-wrap">
          <el-select
            v-model="form.storedProcedure"
            filterable
            clearable
            :placeholder="spListLoading ? '載入中...' : '請選擇 Stored Procedure'"
            :loading="spListLoading"
            style="flex: 1"
            @change="onSpChange"
          >
            <el-option
              v-for="sp in spList"
              :key="sp"
              :value="sp"
              :label="sp"
            >
              <div class="sp-option">
                <el-icon size="13" style="color: var(--primary)"><Coin /></el-icon>
                <span>{{ sp }}</span>
              </div>
            </el-option>
          </el-select>

          <el-tooltip
            :content="spParamsLoading ? '讀取參數中...' : '重新讀取 SP 參數'"
            placement="top"
          >
            <el-button
              :icon="spParamsLoading ? Loading : MagicStick"
              :loading="spParamsLoading"
              :disabled="!form.storedProcedure"
              @click="onSpChange(form.storedProcedure)"
            >
              {{ spParamsLoading ? '讀取中' : '讀取參數' }}
            </el-button>
          </el-tooltip>
        </div>
      </el-form-item>

      <el-form-item :label="t('proxy.apiList.form.description')">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="t('proxy.apiList.form.descPlaceholder')"
        />
      </el-form-item>

      <!-- 認證設定 -->
      <el-form-item :label="t('proxy.apiList.form.authType')">
        <el-select v-model="form.authType" style="width: 180px">
          <el-option value="JWT"     :label="t('proxy.apiList.authTypes.JWT')" />
          <el-option value="API_KEY" :label="t('proxy.apiList.authTypes.API_KEY')" />
          <el-option value="BOTH"    :label="t('proxy.apiList.authTypes.BOTH')" />
          <el-option value="NONE"    :label="t('proxy.apiList.authTypes.NONE')" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('proxy.apiList.form.isActive')">
        <el-switch v-model="form.isActive" />
      </el-form-item>

      <!-- 參數映射 -->
      <el-form-item :label="t('proxy.apiList.form.paramMappings')" class="param-form-item">
        <div class="param-section">
          <!-- 標題列 -->
          <div v-if="form.paramMappings.length > 0" class="param-header">
            <div class="param-row-index" />
            <span class="param-col-label" style="flex:2">請求參數名</span>
            <span class="param-col-label" style="flex:2">SP 參數名</span>
            <span class="param-col-label" style="flex:1.4">型別</span>
            <span class="param-col-label" style="width:44px;flex:none;text-align:center">必填</span>
            <span class="param-col-label" style="flex:1.4">預設值</span>
            <div style="width:28px;flex:none" />
          </div>

          <div v-if="form.paramMappings.length === 0" class="param-empty">
            <el-icon size="18" style="color:#d1d5db;margin-bottom:4px"><Document /></el-icon>
            <div>尚未設定參數映射，SP 將以無參數方式呼叫</div>
            <div v-if="form.storedProcedure" class="param-hint">
              點擊上方「讀取參數」可自動從 DB 帶入
            </div>
          </div>

          <transition-group name="param-list" tag="div">
            <div
              v-for="(param, i) in form.paramMappings"
              :key="`param-${i}`"
              class="param-row"
              :class="{ 'param-row-autofilled': paramsAutoFilled && !param.inputName.startsWith('_') }"
            >
              <div class="param-row-index">{{ i + 1 }}</div>

              <el-input
                v-model="param.inputName"
                placeholder="請求參數名"
                class="param-input"
              />
              <el-input
                v-model="param.spParamName"
                placeholder="@param"
                class="param-input"
              />
              <el-select v-model="param.type" class="param-type">
                <el-option value="string"   label="string" />
                <el-option value="int"      label="int" />
                <el-option value="decimal"  label="decimal" />
                <el-option value="boolean"  label="boolean" />
                <el-option value="datetime" label="datetime" />
              </el-select>

              <el-tooltip content="必填" placement="top">
                <el-checkbox v-model="param.required" class="param-required" />
              </el-tooltip>

              <el-input
                v-model="param.defaultValue"
                :placeholder="param.required ? '—' : '預設值'"
                :disabled="param.required"
                class="param-default"
              />

              <el-button
                :icon="Delete"
                type="danger"
                text
                size="small"
                @click="removeParam(i)"
              />
            </div>
          </transition-group>

          <div class="param-footer">
            <el-button :icon="Plus" size="small" @click="addParam">
              {{ t('proxy.apiList.form.addParam') }}
            </el-button>
            <span v-if="paramsAutoFilled && form.paramMappings.length > 0" class="autofill-badge">
              <el-icon size="12"><MagicStick /></el-icon>
              已從 DB 自動帶入，可手動調整
            </span>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('close')">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        {{ t('common.actions.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* SP 選擇列 */
.sp-select-wrap {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: center;
}
.sp-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
}

/* 參數映射區 */
.param-form-item :deep(.el-form-item__content) {
  width: 100%;
}
.param-section {
  width: 100%;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}
.param-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f1f5f9;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}
.param-col-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.param-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 13px;
  gap: 4px;
}
.param-hint {
  font-size: 12px;
  color: var(--primary);
  margin-top: 2px;
}
.param-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--gray-100, #f3f4f6);
  transition: background 0.15s;
}
.param-row:last-child { border-bottom: none; }
.param-row:hover { background: #f8fafc; }

.param-row-index {
  width: 20px;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
}
.param-input   { flex: 2; }
.param-type    { flex: 1.4; min-width: 100px; }
.param-default { flex: 1.4; }
.param-required { width: 44px; flex-shrink: 0; display: flex; justify-content: center; }

.param-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-top: 1px dashed var(--gray-200, #e5e7eb);
  background: #fff;
}
.autofill-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--primary);
  background: rgba(79, 106, 245, 0.07);
  border-radius: 20px;
  padding: 2px 8px;
}

/* 動畫 */
.param-list-enter-active { transition: all 0.2s ease; }
.param-list-leave-active { transition: all 0.15s ease; }
.param-list-enter-from  { opacity: 0; transform: translateY(-6px); }
.param-list-leave-to    { opacity: 0; transform: translateX(10px); }
</style>
