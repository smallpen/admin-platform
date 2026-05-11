<script setup lang="ts">
defineProps<{
  title: string
  width?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = defineModel<boolean>({ required: true })
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width || '520px'"
    destroy-on-close
    :close-on-click-modal="false"
    @closed="emit('cancel')"
  >
    <slot />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('cancel')">取消</el-button>
        <el-button type="primary" :loading="loading" @click="emit('confirm')">確定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
