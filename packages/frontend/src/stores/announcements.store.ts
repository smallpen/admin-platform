import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { announcementsApi, type AnnouncementWithRead } from '@/api/modules/announcements.api'

export const useAnnouncementsStore = defineStore('announcements', () => {
  const activeAnnouncements = ref<AnnouncementWithRead[]>([])
  const hasFetched = ref(false)

  const unreadCount = computed(() => activeAnnouncements.value.filter(a => !a.isRead).length)

  async function fetchActive() {
    try {
      const { data } = await announcementsApi.getActive()
      activeAnnouncements.value = data.data
      hasFetched.value = true
    } catch {
      // 非阻斷錯誤
    }
  }

  async function markAsRead(id: string) {
    const item = activeAnnouncements.value.find(a => a.id === id)
    if (!item || item.isRead) return
    try {
      await announcementsApi.markRead(id)
      item.isRead = true
    } catch {
      // 非阻斷錯誤
    }
  }

  async function markAllAsRead() {
    try {
      await announcementsApi.markAllRead()
      activeAnnouncements.value.forEach(a => { a.isRead = true })
    } catch {
      // 非阻斷錯誤
    }
  }

  return { activeAnnouncements, hasFetched, unreadCount, fetchActive, markAsRead, markAllAsRead }
})
