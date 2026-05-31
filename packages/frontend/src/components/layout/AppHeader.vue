<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAnnouncementsStore } from '@/stores/announcements.store'
import { useAuth } from '@/composables/useAuth'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{ (e: 'openMobileMenu'): void }>()

const appStore = useAppStore()
const authStore = useAuthStore()
const announcementsStore = useAnnouncementsStore()
const { logout } = useAuth()
const { isMobile } = useBreakpoint()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

type ElTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

const ANN_TYPE_MAP: Partial<Record<string, ElTagType>> = {
  WARNING: 'warning',
  DANGER:  'danger',
  SUCCESS: 'success',
}

const ANN_TYPE_LABEL: Record<string, string> = {
  INFO:    '資訊',
  WARNING: '警告',
  DANGER:  '緊急',
  SUCCESS: '成功',
}

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

function handleCommand(cmd: string) {
  if (cmd === 'logout') handleLogout()
  if (cmd === 'profile') router.push('/profile')
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

      <!-- Announcement bell -->
      <el-dropdown trigger="click" placement="bottom-end" :teleported="true">
        <button class="icon-btn bell-btn">
          <el-icon size="17"><Bell /></el-icon>
          <span v-if="announcementsStore.unreadCount > 0" class="bell-badge">
            {{ announcementsStore.unreadCount > 9 ? '9+' : announcementsStore.unreadCount }}
          </span>
        </button>
        <template #dropdown>
          <div class="ann-dropdown">
            <div class="ann-header">
              <span class="ann-header-title">系統公告</span>
              <el-button
                v-if="announcementsStore.unreadCount > 0"
                link
                size="small"
                style="font-size:12px"
                @click.stop="announcementsStore.markAllAsRead()"
              >
                全部已讀
              </el-button>
            </div>
            <el-divider style="margin:0" />
            <div class="ann-list">
              <div
                v-if="!announcementsStore.activeAnnouncements.length"
                class="ann-empty"
              >
                暫無公告
              </div>
              <div
                v-for="item in announcementsStore.activeAnnouncements"
                :key="item.id"
                class="ann-item"
                :class="{ 'ann-item--unread': !item.isRead }"
                @click="announcementsStore.markAsRead(item.id)"
              >
                <div class="ann-item-meta">
                  <el-tag :type="ANN_TYPE_MAP[item.type]" size="small" effect="light" style="flex-shrink:0">
                    {{ ANN_TYPE_LABEL[item.type] ?? item.type }}
                  </el-tag>
                  <span v-if="!item.isRead" class="ann-unread-dot" />
                </div>
                <div class="ann-item-title">{{ item.title }}</div>
                <div class="ann-item-content">{{ item.content }}</div>
              </div>
            </div>
          </div>
        </template>
      </el-dropdown>

      <div class="header-sep" />

      <!-- User dropdown -->
      <el-dropdown trigger="click" @command="handleCommand">
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
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              {{ t('common.nav.profile') }}
            </el-dropdown-item>
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

/* Bell button */
.bell-btn {
  position: relative;
}
.bell-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--danger);
  color: #fff;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  pointer-events: none;
}

/* Announcement dropdown */
.ann-dropdown {
  width: 300px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ann-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
}
.ann-header-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-800);
}
.ann-list {
  overflow-y: auto;
  flex: 1;
  max-height: 360px;
}
.ann-empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--gray-400);
}
.ann-item {
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--gray-100);
}
.ann-item:last-child { border-bottom: none; }
.ann-item:hover { background: var(--gray-50); }
.ann-item--unread { background: #f0f4ff; }
.ann-item--unread:hover { background: #e6edff; }
.ann-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.ann-unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}
.ann-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ann-item-content {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 2px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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
