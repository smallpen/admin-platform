<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ElMessage } from 'element-plus'
import { usersApi } from '@/api/modules/users.api'
import { rolesApi } from '@/api/modules/roles.api'
import type { User } from '@admin/shared'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps<{
  user?: User | null
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const visible = defineModel<boolean>({ required: true })
const loading = ref(false)
const roles = ref<Array<{ id: string; displayName: string }>>([])

const isEdit = computed(() => !!props.user)
const title = computed(() => isEdit.value ? '編輯使用者' : '新增使用者')

const createSchema = z.object({
  username: z.string().min(3, '帳號至少 3 個字元').regex(/^[a-zA-Z0-9_]+$/, '只能包含英文、數字及底線'),
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(8, '密碼至少 8 個字元'),
  displayName: z.string().min(1, '請輸入顯示名稱'),
  roleIds: z.array(z.string()).optional(),
})

const editSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  displayName: z.string().min(1, '請輸入顯示名稱'),
  roleIds: z.array(z.string()).optional(),
})

const schema = computed(() => toTypedSchema(isEdit.value ? editSchema : createSchema))

const { handleSubmit, errors, resetForm, setValues } = useForm({ validationSchema: schema })
const { value: username } = useField<string>('username')
const { value: email } = useField<string>('email')
const { value: password } = useField<string>('password')
const { value: displayName } = useField<string>('displayName')
const { value: roleIds } = useField<string[]>('roleIds', undefined, { initialValue: [] })

async function loadRoles() {
  try {
    const { data } = await rolesApi.list()
    roles.value = data.data.map(r => ({ id: r.id, displayName: r.displayName }))
  } catch {}
}

watch(visible, async (val) => {
  if (val) {
    await loadRoles()
    if (props.user) {
      setValues({
        email: props.user.email,
        displayName: props.user.displayName,
        roleIds: props.user.roles.map(r => r.id),
      })
    } else {
      resetForm()
    }
  }
})

const onConfirm = handleSubmit(async (values) => {
  loading.value = true
  try {
    if (isEdit.value && props.user) {
      await usersApi.update(props.user.id, {
        email: values.email,
        displayName: values.displayName,
        roleIds: values.roleIds,
      })
    } else {
      await usersApi.create({
        username: (values as any).username,
        email: values.email,
        password: (values as any).password,
        displayName: values.displayName,
        roleIds: values.roleIds,
      })
    }
    ElMessage.success(isEdit.value ? '使用者更新成功' : '使用者建立成功')
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
  <BaseModal v-model="visible" :title="title" :loading="loading" width="560px" @confirm="onConfirm" @cancel="visible = false">
    <el-form label-width="100px" label-position="right">
      <el-form-item v-if="!isEdit" label="帳號" :error="errors.username">
        <el-input v-model="username" placeholder="請輸入帳號（英文、數字、底線）" />
      </el-form-item>
      <el-form-item label="顯示名稱" :error="errors.displayName">
        <el-input v-model="displayName" placeholder="請輸入顯示名稱" />
      </el-form-item>
      <el-form-item label="電子郵件" :error="errors.email">
        <el-input v-model="email" placeholder="請輸入電子郵件" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="密碼" :error="errors.password">
        <el-input v-model="password" type="password" placeholder="請輸入密碼（至少 8 個字元）" show-password />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="roleIds" multiple collapse-tags placeholder="請選擇角色" style="width:100%">
          <el-option v-for="role in roles" :key="role.id" :label="role.displayName" :value="role.id" />
        </el-select>
      </el-form-item>
    </el-form>
  </BaseModal>
</template>
