<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { adsApi } from '@/api/modules/ads.api'
import type { Advertisement } from '@admin/shared'
import BaseModal from '@/components/base/BaseModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  ad?: Advertisement | null
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const visible = defineModel<boolean>({ required: true })
const loading = ref(false)

const isEdit = computed(() => !!props.ad)
const title = computed(() => isEdit.value ? t('ads.edit') : t('ads.create'))

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function oneMonthLaterStr() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

const form = ref({
  title: '',
  linkUrl: '',
  duration: 5,
  isActive: true,
  startDate: todayStr(),
  endDate: oneMonthLaterStr(),
  sortOrder: 0,
})

const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref('')
const imageBase64 = ref('')
const imageMimeType = ref('')
const imageName = ref('')

const formErrors = ref<Record<string, string>>({})

function resetForm() {
  form.value = {
    title: '',
    linkUrl: '',
    duration: 5,
    isActive: true,
    startDate: todayStr(),
    endDate: oneMonthLaterStr(),
    sortOrder: 0,
  }
  imageFile.value = null
  imagePreviewUrl.value = ''
  imageBase64.value = ''
  imageMimeType.value = ''
  imageName.value = ''
  formErrors.value = {}
}

watch(visible, async (val) => {
  if (val) {
    resetForm()
    if (props.ad) {
      form.value = {
        title: props.ad.title,
        linkUrl: props.ad.linkUrl ?? '',
        duration: props.ad.duration,
        isActive: props.ad.isActive,
        startDate: props.ad.startDate.slice(0, 10),
        endDate: props.ad.endDate.slice(0, 10),
        sortOrder: props.ad.sortOrder,
      }
      try {
        const { data } = await adsApi.get(props.ad.id)
        const detail = data.data
        imageBase64.value = detail.imageBase64
        imageMimeType.value = detail.mimeType
        imageName.value = detail.imageName
        imagePreviewUrl.value = `data:${detail.mimeType};base64,${detail.imageBase64}`
      } catch {}
    }
  }
})

function isEndDateDisabled(date: Date) {
  if (!form.value.startDate) return false
  const start = new Date(form.value.startDate)
  start.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date < start
}

function handleFileChange(file: File) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    ElMessage.warning('僅支援 JPG、PNG、GIF、WebP 格式')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('圖片大小不能超過 5MB')
    return false
  }

  imageFile.value = file
  imageMimeType.value = file.type
  imageName.value = file.name

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    imagePreviewUrl.value = result
    imageBase64.value = result.split(',')[1]
  }
  reader.readAsDataURL(file)
  return false
}

function onUploadChange(uploadFile: any) {
  handleFileChange(uploadFile.raw)
}

function validate() {
  formErrors.value = {}
  if (!form.value.title.trim()) {
    formErrors.value.title = '請輸入廣告名稱'
  }
  if (!isEdit.value && !imageBase64.value) {
    formErrors.value.image = t('ads.messages.imageRequired')
  }
  if (form.value.linkUrl && !/^https?:\/\/.+/.test(form.value.linkUrl)) {
    formErrors.value.linkUrl = '請輸入有效的網址（須以 http:// 或 https:// 開頭）'
  }
  if (!form.value.startDate) {
    formErrors.value.startDate = t('ads.messages.startDateRequired')
  }
  if (!form.value.endDate) {
    formErrors.value.endDate = t('ads.messages.endDateRequired')
  }
  if (form.value.startDate && form.value.endDate && form.value.endDate < form.value.startDate) {
    formErrors.value.endDate = t('ads.messages.endDateBeforeStart')
  }
  return Object.keys(formErrors.value).length === 0
}

async function onConfirm() {
  if (!validate()) return

  loading.value = true
  try {
    if (isEdit.value && props.ad) {
      const updateData: any = {
        title: form.value.title,
        linkUrl: form.value.linkUrl || null,
        duration: form.value.duration,
        isActive: form.value.isActive,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        sortOrder: form.value.sortOrder,
      }
      if (imageBase64.value && imageFile.value) {
        updateData.imageBase64 = imageBase64.value
        updateData.mimeType = imageMimeType.value
        updateData.imageName = imageName.value
      }
      await adsApi.update(props.ad.id, updateData)
      ElMessage.success(t('ads.messages.updateSuccess'))
    } else {
      await adsApi.create({
        title: form.value.title,
        imageBase64: imageBase64.value,
        mimeType: imageMimeType.value,
        imageName: imageName.value,
        linkUrl: form.value.linkUrl || null,
        duration: form.value.duration,
        isActive: form.value.isActive,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        sortOrder: form.value.sortOrder,
      })
      ElMessage.success(t('ads.messages.createSuccess'))
    }
    visible.value = false
    emit('success')
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '操作失敗')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseModal
    v-model="visible"
    :title="title"
    :loading="loading"
    width="580px"
    @confirm="onConfirm"
    @cancel="visible = false"
  >
    <el-form label-width="110px" label-position="right">
      <el-form-item :label="t('ads.form.title')" :error="formErrors.title">
        <el-input
          v-model="form.title"
          :placeholder="t('ads.form.titlePlaceholder')"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item :label="t('ads.form.startDate')" :error="formErrors.startDate">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          value-format="YYYY-MM-DD"
          :placeholder="t('ads.form.startDatePlaceholder')"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="t('ads.form.endDate')" :error="formErrors.endDate">
        <el-date-picker
          v-model="form.endDate"
          type="date"
          value-format="YYYY-MM-DD"
          :placeholder="t('ads.form.endDatePlaceholder')"
          :disabled-date="isEndDateDisabled"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="t('ads.form.image')" :error="formErrors.image">
        <div class="image-upload-wrap">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/jpeg,image/png,image/gif,image/webp"
            :on-change="onUploadChange"
          >
            <div v-if="imagePreviewUrl" class="image-preview-box">
              <img :src="imagePreviewUrl" alt="廣告預覽" class="image-preview" />
              <div class="image-overlay">
                <span>{{ t('ads.form.imageChange') }}</span>
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon size="32" color="#c0c4cc"><Plus /></el-icon>
              <p>點擊上傳圖片</p>
            </div>
          </el-upload>
          <p class="image-hint">{{ t('ads.form.imageHint') }}</p>
        </div>
      </el-form-item>

      <el-form-item :label="t('ads.form.duration')">
        <el-input-number
          v-model="form.duration"
          :min="1"
          :max="60"
          controls-position="right"
          style="width: 160px"
        />
        <span class="form-unit">{{ t('ads.form.durationUnit') }}</span>
      </el-form-item>

      <el-form-item :label="t('ads.form.linkUrl')" :error="formErrors.linkUrl">
        <el-input
          v-model="form.linkUrl"
          :placeholder="t('ads.form.linkUrlPlaceholder')"
          clearable
        />
      </el-form-item>

      <el-form-item :label="t('ads.form.sortOrder')">
        <el-input-number
          v-model="form.sortOrder"
          :min="0"
          :max="9999"
          controls-position="right"
          style="width: 120px"
        />
      </el-form-item>

      <el-form-item :label="t('ads.form.isActive')">
        <el-switch
          v-model="form.isActive"
          active-text="生效"
          inactive-text="停用"
        />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>

<style scoped>
.image-upload-wrap {
  width: 100%;
}

.upload-placeholder {
  width: 200px;
  height: 120px;
  border: 2px dashed var(--gray-300);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
  color: var(--gray-400);
}
.upload-placeholder:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.upload-placeholder p {
  margin: 8px 0 0;
  font-size: 13px;
}

.image-preview-box {
  position: relative;
  width: 200px;
  height: 120px;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--gray-200);
}
.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #fff;
  font-size: 13px;
}
.image-preview-box:hover .image-overlay {
  opacity: 1;
}

.image-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--gray-400);
}

.form-unit {
  margin-left: 8px;
  color: var(--gray-500);
  font-size: 13px;
}
</style>
