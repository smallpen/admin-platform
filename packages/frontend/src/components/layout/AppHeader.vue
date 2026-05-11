<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/composables/useAuth'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{ (e: 'openMobileMenu'): void }>()

const appStore = useAppStore()
const authStore = useAuthStore()
const { logout } = useAuth()
const { isMobile } = useBreakpoint()
const { t } = useI18n()
const route = useRoute()

const breadcrumbs = computed(() =>
  route.matched
    .filter(r => r.meta.title)
    .map(r => ({ title: r.meta.title as string, path: r.path }))
)

const avatarInitial = computed(() =>
  authStore.user?.displayName?.[0]?.toUpperCase() || 'A'
)

async function handleLogout() {
  await ElMessageBox.confirm('確定要登出嗎？', '登出確認', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await logout()
  ElMessage.success('已成功登出')
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <!-- Mobile hamburger -->
      <button v-if="isMobile" class="icon-btn hamburger" @click="emit('openMobileMenu')">
        <el-icon size="18"><Expand /></el-icon>
      </button>
      <!-- Desktop collapse -->
      <button v-else class="icon-btn hamburger" @click="appStore.toggleSidebar()">
        <el-icon size="17">
          <Fold v-if="!appStore.sidebarCollapsed" />
          <Expand v-else />
        </el-icon>
      </button>

      <!-- Divider -->
      <div class="header-divider" />

      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="breadcrumb">
        <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path">
          <span class="crumb-sep" v-if="i > 0">
            <el-icon size="11"><ArrowRight /></el-icon>
          </span>
          <span class="crumb-item" :class="{ last: i === breadcrumbs.length - 1 }">
            {{ crumb.title }}
          </span>
        </template>
      </nav>
    </div>

    <div class="header-right">
      <!-- Refresh hint -->
      <el-tooltip content="重新整理" placement="bottom">
        <button class="icon-btn" @click="$router.go(0)">
          <el-icon size="16"><Refresh /></el-icon>
        </button>
      </el-tooltip>

      <div class="header-sep" />

      <!-- User dropdown -->
      <el-dropdown trigger="click" @command="handleLogout">
        <div class="user-info">
          <div class="avatar">{{ avatarInitial }}</div>
          <span v-if="!isMobile" class="username">{{ authStore.user?.displayName }}</span>
          <el-icon class="arrow" size="12"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <div class="dropdown-user-header">
              <div class="dropdown-avatar">{{ avatarInitial }}</div>
              <div>
                <div class="dropdown-name">{{ authStore.user?.displayName }}</div>
                <div class="dropdown-email">{{ authStore.user?.email }}</div>
              </div>
            </div>
            <el-divider style="margin: 6px 0" />
            <el-dropdown-item command="logout">
              <el-icon><SwitchButton /></el-icon>
              {{ t('common.nav.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-height);
  background: #fff;
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 0 var(--gray-100);
}

/* Left */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-divider {
  width: 1px;
  height: 16px;
  background: var(--gray-200);
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13.5px;
}
.crumb-sep {
  color: var(--gray-400);
  display: flex;
  align-items: center;
}
.crumb-item {
  color: var(--gray-500);
  font-weight: 400;
}
.crumb-item.last {
  color: var(--gray-800);
  font-weight: 600;
}

/* Buttons */
.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--gray-600);
  transition: var(--transition-fast);
  flex-shrink: 0;
}
.icon-btn:hover {
  background: var(--gray-100);
  color: var(--gray-900);
}

/* Right */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-sep {
  width: 1px;
  height: 16px;
  background: var(--gray-200);
}

/* User */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px 4px 4px;
  border-radius: var(--radius);
  transition: var(--transition-fast);
  border: 1px solid transparent;
}
.user-info:hover {
  background: var(--gray-50);
  border-color: var(--gray-200);
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.username {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--gray-800);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arrow {
  color: var(--gray-400);
}

/* Dropdown header */
.dropdown-user-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 8px;
}
.dropdown-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dropdown-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--gray-900);
}
.dropdown-email {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 1px;
}
</style>
