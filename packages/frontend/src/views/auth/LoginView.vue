<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ElMessage } from 'element-plus'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { useMaintenanceStore } from '@/stores/maintenance.store'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { login } = useAuth()
const loading = ref(false)

const maintenanceStore = useMaintenanceStore()
onMounted(async () => {
  if (!maintenanceStore.hasFetched) {
    await maintenanceStore.fetchStatus()
  }
})

const schema = toTypedSchema(z.object({
  username: z.string().min(1, '請輸入帳號'),
  password: z.string().min(1, '請輸入密碼'),
}))

const { handleSubmit, errors } = useForm({ validationSchema: schema })
const { value: username } = useField<string>('username')
const { value: password } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    await login(values.username, values.password)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err: any) {
    const msg = err?.response?.data?.message || t('auth.login.invalidCredentials')
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Maintenance notice -->
      <div v-if="maintenanceStore.status.isActive" class="maintenance-notice">
        <el-icon><Tools /></el-icon>
        <span>系統目前正在維護中，僅供管理員登入</span>
      </div>

      <div class="login-header">
        <h1 class="login-title">{{ t('auth.login.title') }}</h1>
        <p class="login-subtitle">{{ t('auth.login.subtitle') }}</p>
      </div>

      <el-form class="login-form" @submit.prevent="onSubmit">
        <el-form-item :error="errors.username">
          <el-input
            v-model="username"
            :placeholder="t('auth.login.usernamePlaceholder')"
            size="large"
            clearable
            autocomplete="username"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :error="errors.password">
          <el-input
            v-model="password"
            type="password"
            :placeholder="t('auth.login.passwordPlaceholder')"
            size="large"
            show-password
            autocomplete="current-password"
            @keyup.enter="onSubmit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          native-type="submit"
          :loading="loading"
          class="login-btn"
          @click="onSubmit"
        >
          {{ loading ? t('auth.login.loggingIn') : t('auth.login.submit') }}
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #001529 0%, #003366 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #001529;
  margin: 0 0 8px;
}

.login-subtitle {
  color: #888;
  margin: 0;
  font-size: 14px;
}

.maintenance-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #c2410c;
  font-weight: 500;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  margin-top: 8px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }
}
</style>
