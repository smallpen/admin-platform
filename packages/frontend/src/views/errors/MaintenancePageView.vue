<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { settingsApi } from '@/api/modules/settings.api'

const POLL_INTERVAL = 30000
const COUNTDOWN_SECONDS = 30

const router = useRouter()
const message = ref<string | null>(null)
const checking = ref(false)
const countdown = ref(COUNTDOWN_SECONDS)

let pollTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

async function checkAndRedirect() {
  checking.value = true
  try {
    const res = await settingsApi.getMaintenanceStatus()
    const data = res.data.data
    message.value = data.message ?? null
    if (!data.isActive) {
      router.push({ name: 'Login' })
    }
  } catch {
    // ignore network errors
  } finally {
    checking.value = false
  }
}

function resetCountdown() {
  countdown.value = COUNTDOWN_SECONDS
}

function startTimers() {
  // Countdown tick every second
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      resetCountdown()
      checkAndRedirect()
    }
  }, 1000)

  // Also poll at full interval in case tab is backgrounded (throttled timers)
  pollTimer = setInterval(checkAndRedirect, POLL_INTERVAL)
}

function goToLogin() {
  router.push({ name: 'Login' })
}

onMounted(async () => {
  await checkAndRedirect()
  startTimers()
})

onUnmounted(() => {
  if (countdownTimer !== null) clearInterval(countdownTimer)
  if (pollTimer !== null) clearInterval(pollTimer)
})
</script>

<template>
  <div class="maintenance-page">
    <div class="maintenance-card">
      <div class="maintenance-icon">
        <el-icon size="64" color="#4F6AF5"><Tools /></el-icon>
      </div>
      <h1 class="maintenance-title">系統維護中</h1>
      <p class="maintenance-desc">
        {{ message || '很抱歉，本系統目前正在進行維護，請稍後再試。' }}
      </p>

      <p class="auto-check-hint">
        將在 <span class="countdown">{{ countdown }}</span> 秒後自動確認維護狀態
      </p>

      <div class="action-row">
        <el-button type="primary" :loading="checking" @click="checkAndRedirect">
          {{ checking ? '確認中…' : '立即確認' }}
        </el-button>
        <el-button text @click="goToLogin" class="admin-login-link">
          管理員登入
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EAECF2;
}

.maintenance-card {
  background: #fff;
  border-radius: 16px;
  padding: 56px 48px;
  text-align: center;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.maintenance-icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  opacity: 0.8;
}

.maintenance-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px;
}

.maintenance-desc {
  font-size: 15px;
  color: #64748b;
  margin: 0 0 20px;
  line-height: 1.6;
}

.auto-check-hint {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 28px;
}

.countdown {
  font-weight: 700;
  color: #4F6AF5;
  font-variant-numeric: tabular-nums;
  display: inline-block;
  min-width: 20px;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.admin-login-link {
  font-size: 13px;
  color: #94a3b8;
}
</style>
