<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/modules/auth.api'

const { t } = useI18n()
const authStore = useAuthStore()

// ── 基本資訊表單 ──────────────────────────────────
const profileSchema = toTypedSchema(z.object({
  displayName: z.string().min(1, '顯示名稱不得為空').max(100),
  email: z.string().email('請輸入有效的電子郵件'),
}))

const { handleSubmit: handleProfileSubmit, errors: profileErrors, setValues } = useForm({
  validationSchema: profileSchema,
})
const { value: displayName } = useField<string>('displayName')
const { value: email } = useField<string>('email')

watch(() => authStore.user, (user) => {
  if (user) setValues({ displayName: user.displayName, email: user.email })
}, { immediate: true })

const profileLoading = ref(false)
const onProfileSubmit = handleProfileSubmit(async (values) => {
  profileLoading.value = true
  try {
    const { data } = await authApi.updateMe(values)
    authStore.setUser(data.data)
    ElMessage.success(t('profile.messages.profileUpdated'))
  } catch (e: any) {
    const msg = e?.response?.data?.message || '更新失敗'
    ElMessage.error(msg)
  } finally {
    profileLoading.value = false
  }
})

// ── 修改密碼表單 ──────────────────────────────────
const passwordSchema = toTypedSchema(z.object({
  currentPassword: z.string().min(1, '請輸入目前密碼'),
  newPassword: z.string().min(8, '密碼至少 8 個字元'),
  confirmNewPassword: z.string().min(1, '請確認新密碼'),
}).refine(d => d.newPassword === d.confirmNewPassword, {
  message: '兩次密碼輸入不一致',
  path: ['confirmNewPassword'],
}))

const { handleSubmit: handlePasswordSubmit, errors: passwordErrors, resetForm: resetPassword } = useForm({
  validationSchema: passwordSchema,
})
const { value: currentPassword } = useField<string>('currentPassword')
const { value: newPassword } = useField<string>('newPassword')
const { value: confirmNewPassword } = useField<string>('confirmNewPassword')

const passwordLoading = ref(false)
const onPasswordSubmit = handlePasswordSubmit(async (values) => {
  passwordLoading.value = true
  try {
    await authApi.updateMyPassword(values)
    ElMessage.success(t('profile.messages.passwordUpdated'))
    resetPassword()
  } catch (e: any) {
    const code = e?.response?.data?.code
    const msg = code === 'INVALID_PASSWORD'
      ? t('profile.messages.currentPasswordWrong')
      : (e?.response?.data?.message || '更新失敗')
    ElMessage.error(msg)
  } finally {
    passwordLoading.value = false
  }
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('profile.title') }}</h2>
    </div>

    <div class="profile-layout">
      <!-- 基本資訊 -->
      <el-card class="admin-card">
        <template #header>
          <span class="card-title">{{ t('profile.basicInfo.title') }}</span>
        </template>
        <form @submit.prevent="onProfileSubmit">
          <div class="form-grid">
            <el-form-item :label="t('profile.basicInfo.username')" class="form-item">
              <el-input :value="authStore.user?.username" disabled />
            </el-form-item>

            <el-form-item
              :label="t('profile.basicInfo.displayName')"
              :error="profileErrors.displayName"
              class="form-item"
            >
              <el-input
                v-model="displayName"
                :placeholder="t('profile.basicInfo.displayNamePlaceholder')"
              />
            </el-form-item>

            <el-form-item
              :label="t('profile.basicInfo.email')"
              :error="profileErrors.email"
              class="form-item"
            >
              <el-input
                v-model="email"
                :placeholder="t('profile.basicInfo.emailPlaceholder')"
              />
            </el-form-item>
          </div>

          <div class="form-footer">
            <el-button type="primary" native-type="submit" :loading="profileLoading">
              {{ t('profile.basicInfo.saveBtn') }}
            </el-button>
          </div>
        </form>
      </el-card>

      <!-- 修改密碼 -->
      <el-card class="admin-card">
        <template #header>
          <span class="card-title">{{ t('profile.changePassword.title') }}</span>
        </template>
        <form @submit.prevent="onPasswordSubmit">
          <div class="form-grid">
            <el-form-item
              :label="t('profile.changePassword.currentPassword')"
              :error="passwordErrors.currentPassword"
              class="form-item"
            >
              <el-input
                v-model="currentPassword"
                type="password"
                show-password
                :placeholder="t('profile.changePassword.currentPasswordPlaceholder')"
              />
            </el-form-item>

            <el-form-item
              :label="t('profile.changePassword.newPassword')"
              :error="passwordErrors.newPassword"
              class="form-item"
            >
              <el-input
                v-model="newPassword"
                type="password"
                show-password
                :placeholder="t('profile.changePassword.newPasswordPlaceholder')"
              />
            </el-form-item>

            <el-form-item
              :label="t('profile.changePassword.confirmNewPassword')"
              :error="passwordErrors.confirmNewPassword"
              class="form-item"
            >
              <el-input
                v-model="confirmNewPassword"
                type="password"
                show-password
                :placeholder="t('profile.changePassword.confirmNewPasswordPlaceholder')"
              />
            </el-form-item>
          </div>

          <div class="form-footer">
            <el-button type="primary" native-type="submit" :loading="passwordLoading">
              {{ t('profile.changePassword.saveBtn') }}
            </el-button>
          </div>
        </form>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.profile-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 640px;
}

.card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--gray-800);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-footer {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--gray-100);
}
</style>
