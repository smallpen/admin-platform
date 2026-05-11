<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ElMessage } from 'element-plus'
import { rolesApi } from '@/api/modules/roles.api'
import type { Role } from '@admin/shared'
import BaseModal from '@/components/base/BaseModal.vue'
import PermissionTree from './PermissionTree.vue'

const props = defineProps<{
  role?: Role | null
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const visible = defineModel<boolean>({ required: true })
const loading = ref(false)
const selectedPermissionIds = ref<string[]>([])

const isEdit = computed(() => !!props.role)
const title = computed(() => isEdit.value ? '編輯角色' : '新增角色')

const createSchema = toTypedSchema(z.object({
  name: z.string().min(2).regex(/^[a-z_]+$/, '只能包含小寫英文及底線'),
  displayName: z.string().min(1, '請輸入角色名稱'),
  description: z.string().optional(),
}))

const editSchema = toTypedSchema(z.object({
  displayName: z.string().min(1, '請輸入角色名稱'),
  description: z.string().optional(),
}))

const { handleSubmit, errors, resetForm, setValues } = useForm({
  validationSchema: computed(() => isEdit.value ? editSchema : createSchema),
})
const { value: name } = useField<string>('name')
const { value: displayName } = useField<string>('displayName')
const { value: description } = useField<string>('description')

watch(visible, (val) => {
  if (val) {
    if (props.role) {
      setValues({
        displayName: props.role.displayName,
        description: props.role.description || '',
      })
      selectedPermissionIds.value = props.role.permissions.map(p => p.id)
    } else {
      resetForm()
      selectedPermissionIds.value = []
    }
  }
})

const onConfirm = handleSubmit(async (values) => {
  loading.value = true
  try {
    if (isEdit.value && props.role) {
      await rolesApi.update(props.role.id, {
        displayName: values.displayName,
        description: values.description,
      })
      await rolesApi.assignPermissions(props.role.id, { permissionIds: selectedPermissionIds.value })
    } else {
      const { data } = await rolesApi.create({
        name: (values as any).name,
        displayName: values.displayName,
        description: values.description,
        permissionIds: selectedPermissionIds.value,
      })
    }
    ElMessage.success(isEdit.value ? '角色更新成功' : '角色建立成功')
    visible.value = false
    emit('success')
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '操作失敗')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <BaseModal v-model="visible" :title="title" :loading="loading" width="640px" @confirm="onConfirm" @cancel="visible = false">
    <el-form label-width="100px">
      <el-form-item v-if="!isEdit" label="識別碼" :error="errors.name">
        <el-input v-model="name" placeholder="小寫英文及底線，如：content_manager" />
      </el-form-item>
      <el-form-item label="角色名稱" :error="errors.displayName">
        <el-input v-model="displayName" placeholder="請輸入角色顯示名稱" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="description" type="textarea" :rows="2" placeholder="角色描述（選填）" />
      </el-form-item>
      <el-form-item label="權限">
        <PermissionTree v-model:selected-ids="selectedPermissionIds" />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>
