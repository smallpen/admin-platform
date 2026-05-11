<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
}>()

const config = computed(() => {
  switch (props.status) {
    case 'ACTIVE':   return { type: 'success', label: '啟用' }
    case 'INACTIVE': return { type: 'info',    label: '停用' }
    case 'LOCKED':   return { type: 'danger',  label: '鎖定' }
    default:         return { type: 'info',    label: props.status }
  }
})
</script>

<template>
  <el-tag :type="config.type as any" size="small">{{ config.label }}</el-tag>
</template>
