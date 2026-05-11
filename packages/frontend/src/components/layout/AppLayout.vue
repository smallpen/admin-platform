<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { useMaintenanceStore } from '@/stores/maintenance.store'

const { isMobile } = useBreakpoint()
const mobileMenuOpen = ref(false)

const maintenanceStore = useMaintenanceStore()
onMounted(() => maintenanceStore.startPolling())
onUnmounted(() => maintenanceStore.stopPolling())
</script>

<template>
  <div class="app-layout">
    <!-- Desktop sidebar -->
    <AppSidebar v-if="!isMobile" />

    <!-- Mobile drawer -->
    <el-drawer
      v-model="mobileMenuOpen"
      direction="ltr"
      :with-header="false"
      :size="220"
      :lock-scroll="false"
    >
      <AppSidebar />
    </el-drawer>

    <div class="main-wrapper">
      <AppHeader @open-mobile-menu="mobileMenuOpen = true" />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  background: #EAECF2;
}

@media (max-width: 992px) {
  .main-content {
    padding: 14px;
  }
}
</style>
