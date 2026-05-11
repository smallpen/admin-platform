<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { usePermission } from '@/composables/usePermission'
import { useI18n } from 'vue-i18n'

const appStore = useAppStore()
const router = useRouter()
const route = useRoute()
const { has } = usePermission()
const { t } = useI18n()

const collapsed = computed(() => appStore.sidebarCollapsed)
const openGroups = ref<Set<string>>(new Set())

interface ChildItem {
  path: string
  label: string
  show: boolean
}
interface MenuItem {
  key?: string
  path?: string
  icon: string
  label: string
  show: boolean
  children?: ChildItem[]
}

const menuItems = computed<MenuItem[]>(() => [
  {
    path: '/dashboard',
    icon: 'Odometer',
    label: t('common.nav.dashboard'),
    show: true,
  },
  {
    key: 'system',
    icon: 'Setting',
    label: t('common.nav.system'),
    show: has('user:list') || has('role:list') || has('permission:list'),
    children: [
      { path: '/users',       label: t('common.nav.users'),       show: has('user:list') },
      { path: '/roles',       label: t('common.nav.roles'),       show: has('role:list') },
      { path: '/permissions', label: t('common.nav.permissions'), show: has('permission:list') },
    ],
  },
])

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function isGroupActive(item: MenuItem) {
  return item.children?.some(c => isActive(c.path)) ?? false
}

function isGroupOpen(key: string) {
  return openGroups.value.has(key)
}

function toggleGroup(key: string) {
  if (openGroups.value.has(key)) {
    openGroups.value.delete(key)
  } else {
    openGroups.value.add(key)
  }
}

function handleGroupClick(item: MenuItem) {
  if (collapsed.value) {
    const first = item.children?.find(c => c.show)
    if (first) router.push(first.path)
  } else {
    if (item.key) toggleGroup(item.key)
  }
}

// Auto-open group when a child route is active
watch(
  () => route.path,
  () => {
    menuItems.value.forEach(item => {
      if (item.key && isGroupActive(item)) openGroups.value.add(item.key)
    })
  },
  { immediate: true },
)
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon-wrap">
        <el-icon size="18" color="#4F6AF5"><Setting /></el-icon>
      </div>
      <transition name="logo-fade">
        <span v-if="!collapsed" class="logo-text">Admin Platform</span>
      </transition>
    </div>

    <!-- Menu -->
    <nav class="sidebar-nav">
      <template v-for="item in menuItems" :key="item.key || item.path">
        <template v-if="item.show">

          <!-- ── Flat item ── -->
          <el-tooltip
            v-if="!item.children"
            :content="item.label"
            placement="right"
            :disabled="!collapsed"
            :show-after="300"
          >
            <button
              class="nav-item"
              :class="{ active: isActive(item.path!) }"
              @click="router.push(item.path!)"
            >
              <span class="nav-accent" />
              <span class="nav-icon">
                <el-icon size="16"><component :is="item.icon" /></el-icon>
              </span>
              <transition name="label-fade">
                <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
              </transition>
            </button>
          </el-tooltip>

          <!-- ── Group item ── -->
          <template v-else>
            <el-tooltip
              :content="item.label"
              placement="right"
              :disabled="!collapsed"
              :show-after="300"
            >
              <button
                class="nav-item nav-group-header"
                :class="{ 'group-active': isGroupActive(item) && collapsed }"
                @click="handleGroupClick(item)"
              >
                <span v-if="isGroupActive(item) && collapsed" class="nav-accent" />
                <span class="nav-icon">
                  <el-icon size="16"><component :is="item.icon" /></el-icon>
                </span>
                <transition name="label-fade">
                  <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
                </transition>
                <transition name="label-fade">
                  <span
                    v-if="!collapsed"
                    class="nav-chevron"
                    :class="{ open: item.key && isGroupOpen(item.key) }"
                  >
                    <el-icon size="12"><ArrowRight /></el-icon>
                  </span>
                </transition>
              </button>
            </el-tooltip>

            <!-- Sub-items -->
            <transition name="submenu">
              <div
                v-if="!collapsed && item.key && isGroupOpen(item.key)"
                class="submenu"
              >
                <template v-for="child in item.children" :key="child.path">
                  <button
                    v-if="child.show"
                    class="nav-item nav-child"
                    :class="{ active: isActive(child.path) }"
                    @click="router.push(child.path)"
                  >
                    <span class="nav-accent" />
                    <span class="child-dot" />
                    <span class="nav-label">{{ child.label }}</span>
                  </button>
                </template>
              </div>
            </transition>
          </template>

        </template>
      </template>
    </nav>

    <!-- Footer version -->
    <div class="sidebar-footer">
      <transition name="label-fade">
        <span v-if="!collapsed" class="version-text">v1.0.0</span>
      </transition>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-right: 1px solid var(--sidebar-border);
}
.sidebar.collapsed { width: var(--sidebar-collapsed-width); }

/* ── Logo ── */
.sidebar-logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  background: var(--sidebar-header-bg);
  flex-shrink: 0;
  border-bottom: 1px solid var(--sidebar-border);
  overflow: hidden;
}
.logo-icon-wrap {
  width: 28px;
  height: 28px;
  background: rgba(79, 106, 245, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-text {
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: -0.2px;
}

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 14px;
  height: 42px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--sidebar-text);
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
  transition: color 0.15s ease, background 0.15s ease;
  outline: none;
  overflow: hidden;
  margin: 1px 0;
}
.nav-item:hover {
  background: var(--sidebar-item-hover);
  color: var(--sidebar-text-hover);
}
.nav-item.active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
}

/* Active left accent bar */
.nav-accent {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 20px;
  background: var(--sidebar-active-accent);
  border-radius: 0 3px 3px 0;
  transition: transform 0.2s ease;
}
.nav-item.active .nav-accent {
  transform: translateY(-50%) scaleY(1);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
}
.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}

/* ── Group header ── */
.nav-group-header.group-active {
  color: var(--sidebar-active-text);
}
.nav-group-header.group-active .nav-accent {
  transform: translateY(-50%) scaleY(1);
}

.nav-chevron {
  display: flex;
  align-items: center;
  margin-left: auto;
  opacity: 0.5;
  transition: transform 0.22s ease;
  flex-shrink: 0;
}
.nav-chevron.open {
  transform: rotate(90deg);
}

/* ── Sub-items ── */
.submenu {
  background: rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.nav-child {
  height: 38px;
  padding-left: 42px;
  font-size: 13px;
  font-weight: 400;
  color: rgba(255,255,255,0.55);
  margin: 0;
}
.nav-child:hover {
  color: rgba(255,255,255,0.85);
  background: var(--sidebar-item-hover);
}
.nav-child.active {
  color: var(--sidebar-active-text);
  background: var(--sidebar-active-bg);
}

.child-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
  flex-shrink: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.nav-child.active .child-dot {
  opacity: 1;
  background: var(--primary);
  transform: scale(1.2);
}

/* Submenu slide transition */
.submenu-enter-active,
.submenu-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 200px;
}
.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ── Footer ── */
.sidebar-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--sidebar-border);
  min-height: 40px;
  display: flex;
  align-items: center;
}
.version-text {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  white-space: nowrap;
}

/* ── Transitions ── */
.logo-fade-enter-active,
.logo-fade-leave-active,
.label-fade-enter-active,
.label-fade-leave-active {
  transition: opacity 0.2s ease, width 0.2s ease;
  overflow: hidden;
}
.logo-fade-enter-from,
.logo-fade-leave-to,
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
  width: 0;
}
.logo-fade-enter-to,
.label-fade-enter-to {
  opacity: 1;
}
</style>
