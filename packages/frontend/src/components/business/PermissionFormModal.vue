<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ElMessage } from 'element-plus'
import { permissionsApi } from '@/api/modules/permissions.api'
import type { Permission } from '@admin/shared'

const props = defineProps<{
  modelValue: boolean
  permission: Permission | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.permission)
const loading = ref(false)

const schema = toTypedSchema(z.object({
  code: z.string()
    .min(3, '權限碼至少 3 個字元')
    .regex(/^[a-z]+:[a-z_]+$/, '格式須為 module:action（小寫英文及底線，例如 product:list）'),
  name: z.string().min(1, '請輸入名稱'),
  group: z.string().min(1, '請輸入模組分組').regex(/^[a-z_]+$/, '只能小寫英文及底線'),
  description: z.string().optional(),
}))

const { handleSubmit, errors, resetForm, setValues } = useForm({ validationSchema: schema })
const { value: code } = useField<string>('code')
const { value: name } = useField<string>('name')
const { value: group } = useField<string>('group')
const { value: description } = useField<string>('description')

watch(() => props.modelValue, (open) => {
  if (open) {
    if (props.permission) {
      setValues({
        code: props.permission.code,
        name: props.permission.name,
        group: props.permission.group,
        description: props.permission.description ?? '',
      })
    } else {
      resetForm()
    }
  }
})

// 新增時，從 code 自動填入 group（取冒號前的部分）
watch(code, (val) => {
  if (!isEdit.value && val?.includes(':')) {
    const prefix = val.split(':')[0]
    if (prefix) group.value = prefix
  }
})

const onConfirm = handleSubmit(async (values) => {
  loading.value = true
  try {
    if (isEdit.value && props.permission) {
      await permissionsApi.update(props.permission.id, { name: values.name, description: values.description || null })
      ElMessage.success('權限更新成功')
    } else {
      await permissionsApi.create(values)
      ElMessage.success('權限建立成功')
    }
    emit('success')
    visible.value = false
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '操作失敗')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '編輯權限' : '新增權限'"
    width="480px"
    :close-on-click-modal="false"
    @closed="resetForm()"
  >
    <el-form label-width="90px" @submit.prevent="onConfirm">
      <el-form-item label="權限碼" :error="errors.code" required>
        <el-input
          v-model="code"
          placeholder="例如 product:list"
          :disabled="isEdit"
        />
        <div v-if="!isEdit" class="field-hint">格式：module:action，例如 product:list</div>
      </el-form-item>

      <el-form-item label="名稱" :error="errors.name" required>
        <el-input v-model="name" placeholder="例如 查看產品列表" />
      </el-form-item>

      <el-form-item label="模組分組" :error="errors.group" required>
        <el-input
          v-model="group"
          placeholder="例如 product"
          :disabled="isEdit"
        />
        <div v-if="!isEdit" class="field-hint">輸入 code 後自動填入，可手動修改</div>
      </el-form-item>

      <el-form-item label="描述" :error="errors.description">
        <el-input v-model="description" type="textarea" :rows="2" placeholder="選填" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="onConfirm">
        {{ isEdit ? '儲存' : '建立' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.field-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
