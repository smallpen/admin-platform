<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="error-page">
    <el-result icon="error" title="403" sub-title="您沒有權限存取此頁面">
      <template #extra>
        <el-button type="primary" @click="router.push('/dashboard')">返回首頁</el-button>
        <el-button @click="router.go(-1)">返回上頁</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
