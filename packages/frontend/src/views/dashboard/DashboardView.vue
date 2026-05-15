<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import { statsApi, type StatsData, type TrendsData, type ActionDistributionItem } from '@/api/modules/stats.api'
import LoginTrendChart from './components/LoginTrendChart.vue'
import ActionDistributionChart from './components/ActionDistributionChart.vue'

const authStore = useAuthStore()
const router = useRouter()

const stats = ref<StatsData | null>(null)
const trendsData = ref<TrendsData>({ labels: [], data: [] })
const distribution = ref<ActionDistributionItem[]>([])
const loading = ref(true)
const chartsLoading = ref(true)

onMounted(async () => {
  try {
    const [statsRes, trendsRes, distRes] = await Promise.all([
      statsApi.getStats(),
      statsApi.getTrends(),
      statsApi.getActionDistribution(),
    ])
    stats.value = statsRes.data.data
    trendsData.value = trendsRes.data.data
    distribution.value = distRes.data.data
  } finally {
    loading.value = false
    chartsLoading.value = false
  }
})

const cards = [
  {
    key: 'userCount' as keyof Stats,
    label: '使用者總數',
    icon: 'User',
    gradient: 'linear-gradient(135deg, #4F6AF5 0%, #7C91F8 100%)',
    bg: '#EEF1FE',
    action: { label: '管理使用者', path: '/users' },
  },
  {
    key: 'roleCount' as keyof Stats,
    label: '角色數量',
    icon: 'Lock',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    bg: '#F3F0FD',
    action: { label: '管理角色', path: '/roles' },
  },
  {
    key: 'permissionCount' as keyof Stats,
    label: '權限項目',
    icon: 'Key',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
    bg: '#FFFBEB',
    action: { label: '管理權限', path: '/permissions' },
  },
  {
    key: 'activeUserCount' as keyof Stats,
    label: '啟用中使用者',
    icon: 'CircleCheck',
    gradient: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
    bg: '#F0FDF4',
    action: null,
  },
]
</script>

<template>
  <div class="dashboard">
    <!-- Welcome bar -->
    <div class="welcome-bar">
      <div>
        <h2 class="welcome-title">歡迎回來，{{ authStore.user?.displayName }} 👋</h2>
        <p class="welcome-sub">以下是系統的最新概覽</p>
      </div>
      <el-tag type="success" size="large" effect="light" round>
        <el-icon style="margin-right:4px"><CircleCheck /></el-icon>
        系統運行正常
      </el-tag>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <template v-for="card in cards" :key="card.key">
        <!-- Skeleton -->
        <div v-if="loading" class="stat-card">
          <div class="skeleton" style="width:48px;height:48px;border-radius:12px;margin-bottom:16px" />
          <div class="skeleton" style="width:60%;height:28px;border-radius:6px;margin-bottom:8px" />
          <div class="skeleton" style="width:40%;height:16px;border-radius:4px" />
        </div>
        <!-- Real card -->
        <div v-else class="stat-card" :class="{ clickable: !!card.action }" @click="card.action && router.push(card.action.path)">
          <div class="stat-icon" :style="{ background: card.gradient }">
            <el-icon size="22" color="#fff"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-value">{{ stats?.[card.key] ?? '—' }}</div>
          <div class="stat-label">{{ card.label }}</div>
          <div v-if="card.action" class="stat-action">
            {{ card.action.label }}
            <el-icon size="12"><ArrowRight /></el-icon>
          </div>
        </div>
      </template>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <el-card>
        <template #header>
          <span class="chart-title">近 7 日登入趨勢</span>
        </template>
        <LoginTrendChart
          :labels="trendsData.labels"
          :data="trendsData.data"
          :loading="chartsLoading"
        />
      </el-card>
      <el-card>
        <template #header>
          <span class="chart-title">近 30 天操作分佈</span>
        </template>
        <ActionDistributionChart
          :data="distribution"
          :loading="chartsLoading"
        />
      </el-card>
    </div>

    <!-- Bottom section -->
    <div class="bottom-grid">
      <!-- Profile card -->
      <el-card class="profile-card">
        <template #header>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span>帳號資訊</span>
            <el-tag size="small" type="success" effect="light">啟用中</el-tag>
          </div>
        </template>
        <div class="profile-body">
          <div class="profile-avatar">{{ authStore.user?.displayName?.[0] }}</div>
          <div class="profile-info">
            <div class="profile-name">{{ authStore.user?.displayName }}</div>
            <div class="profile-email">{{ authStore.user?.email }}</div>
            <div class="profile-roles">
              <el-tag
                v-for="role in authStore.user?.roles"
                :key="role"
                size="small"
                effect="light"
                style="margin-right:6px;margin-top:6px"
              >{{ role }}</el-tag>
            </div>
          </div>
        </div>
        <el-descriptions :column="2" border size="small" class="mt-4">
          <el-descriptions-item label="帳號">{{ authStore.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="電子郵件">{{ authStore.user?.email }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Quick actions -->
      <el-card>
        <template #header>快速操作</template>
        <div class="quick-actions">
          <button class="quick-btn" @click="router.push('/users')">
            <div class="quick-icon" style="background:#EEF1FE">
              <el-icon size="18" color="#4F6AF5"><UserFilled /></el-icon>
            </div>
            <span>新增使用者</span>
          </button>
          <button class="quick-btn" @click="router.push('/roles')">
            <div class="quick-icon" style="background:#F3F0FD">
              <el-icon size="18" color="#8B5CF6"><Lock /></el-icon>
            </div>
            <span>管理角色</span>
          </button>
          <button class="quick-btn" @click="router.push('/permissions')">
            <div class="quick-icon" style="background:#FFFBEB">
              <el-icon size="18" color="#F59E0B"><Key /></el-icon>
            </div>
            <span>查看權限</span>
          </button>
          <button class="quick-btn" @click="router.push('/users')">
            <div class="quick-icon" style="background:#F0FDF4">
              <el-icon size="18" color="#22C55E"><Setting /></el-icon>
            </div>
            <span>系統設定</span>
          </button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1400px;
}

/* Welcome */
.welcome-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.welcome-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--gray-900);
  letter-spacing: -0.4px;
}
.welcome-sub {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--gray-500);
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px)  { .stats-grid { grid-template-columns: 1fr; } }

.stat-card {
  background: #fff;
  border-radius: var(--radius-xl);
  padding: 24px;
  border: 1px solid var(--gray-100);
  box-shadow: var(--shadow-card);
  transition: var(--transition);
}
.stat-card.clickable {
  cursor: pointer;
}
.stat-card.clickable:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--gray-200);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--gray-900);
  line-height: 1;
  letter-spacing: -1px;
  margin-bottom: 6px;
}
.stat-label {
  font-size: 13px;
  color: var(--gray-500);
  font-weight: 500;
}
.stat-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--gray-100);
  transition: var(--transition-fast);
}
.stat-card.clickable:hover .stat-action {
  gap: 6px;
}

/* Charts grid */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
}

/* Bottom grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 768px) { .bottom-grid { grid-template-columns: 1fr; } }

/* Profile */
.profile-body {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 0;
}
.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.profile-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--gray-900);
}
.profile-email {
  font-size: 13px;
  color: var(--gray-500);
  margin-top: 2px;
}
.profile-roles { display: flex; flex-wrap: wrap; }

/* Quick actions */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.quick-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-lg);
  background: var(--gray-50);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--gray-700);
  text-align: left;
  transition: var(--transition-fast);
  outline: none;
}
.quick-btn:hover {
  background: #fff;
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.quick-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
