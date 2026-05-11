<script setup lang="ts">
import { ref, watch } from 'vue'
import { permissionsApi } from '@/api/modules/permissions.api'
import type { PermissionGroup } from '@admin/shared'

const props = defineProps<{
  selectedIds: string[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedIds', ids: string[]): void
}>()

const groups = ref<PermissionGroup[]>([])
const loading = ref(false)

async function loadPermissions() {
  loading.value = true
  try {
    const { data } = await permissionsApi.list()
    groups.value = data.data
  } finally {
    loading.value = false
  }
}

function isGroupAllChecked(group: PermissionGroup) {
  return group.permissions.every(p => props.selectedIds.includes(p.id))
}

function isGroupIndeterminate(group: PermissionGroup) {
  const checked = group.permissions.filter(p => props.selectedIds.includes(p.id))
  return checked.length > 0 && checked.length < group.permissions.length
}

function toggleGroup(group: PermissionGroup, checked: boolean) {
  const groupIds = group.permissions.map(p => p.id)
  let newIds: string[]
  if (checked) {
    newIds = [...new Set([...props.selectedIds, ...groupIds])]
  } else {
    newIds = props.selectedIds.filter(id => !groupIds.includes(id))
  }
  emit('update:selectedIds', newIds)
}

function togglePermission(id: string, checked: boolean) {
  if (checked) {
    emit('update:selectedIds', [...props.selectedIds, id])
  } else {
    emit('update:selectedIds', props.selectedIds.filter(i => i !== id))
  }
}

loadPermissions()
</script>

<template>
  <div v-loading="loading" class="permission-tree">
    <div v-for="group in groups" :key="group.group" class="permission-group">
      <div class="group-header">
        <el-checkbox
          :model-value="isGroupAllChecked(group)"
          :indeterminate="isGroupIndeterminate(group)"
          @change="(val: boolean) => toggleGroup(group, val)"
        >
          <span class="group-name">{{ group.group }}</span>
        </el-checkbox>
      </div>
      <div class="group-permissions">
        <el-checkbox
          v-for="perm in group.permissions"
          :key="perm.id"
          :model-value="selectedIds.includes(perm.id)"
          @change="(val: boolean) => togglePermission(perm.id, val)"
        >
          {{ perm.name }}
        </el-checkbox>
      </div>
    </div>
  </div>
</template>

<style scoped>
.permission-tree {
  min-height: 200px;
}

.permission-group {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.group-header {
  margin-bottom: 8px;
}

.group-name {
  font-weight: 600;
  color: #333;
}

.group-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 24px;
}
</style>
