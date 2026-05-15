export default {
  title: '排程任務',
  taskTypes: {
    CLEANUP_EXPIRED_TOKENS: '清除過期 Token',
    CLEANUP_ACTIVITY_LOGS:  '清除舊操作紀錄',
  },
  statuses: {
    SUCCESS: '成功',
    FAILED:  '失敗',
    RUNNING: '執行中',
  },
  columns: {
    name:           '任務名稱',
    taskType:       '任務類型',
    cronExpression: 'Cron 表達式',
    isEnabled:      '啟用',
    lastRunAt:      '上次執行',
    lastStatus:     '執行結果',
    lastMessage:    '執行訊息',
  },
  actions: {
    trigger:  '立即執行',
    setCron:  '設定 Cron',
    enabling: '啟用中...',
  },
  cronDialog: {
    title:       '設定 Cron 表達式',
    label:       'Cron 表達式',
    placeholder: '例如：0 3 * * *',
    hint:        '格式：分 時 日 月 週，例如「0 3 * * *」代表每天凌晨 3 點',
    examples:    '常用範例：每天 0:00→「0 0 * * *」、每週日 2:00→「0 2 * * 0」、每小時→「0 * * * *」',
  },
  messages: {
    updateSuccess:  '排程已更新',
    triggerSuccess: '任務執行完成',
    triggerFailed:  '任務執行失敗',
    invalidCron:    'Cron 表達式格式錯誤',
  },
  info: '以下為預定義的系統維護任務，您可以調整執行時間與啟用狀態，或手動觸發執行。',
}
