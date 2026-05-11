# Admin Platform — 開發規範

## 專案概述

Vue 3 + Fastify monorepo 後台管理系統，採用 RBAC 角色權限架構。

- **前端**：`packages/frontend` — Vue 3 + Vite + TypeScript + Element Plus + vxe-table
- **後端**：`packages/backend` — Fastify + Prisma + SQLite
- **共用型別**：`packages/shared`

啟動指令：根目錄執行 `npm run dev`（同時啟動前後端）
預設帳號：`admin` / `admin@123456`，後端 `http://localhost:3000`，前端 `http://localhost:5173`

---

## 設計系統

### Design Tokens（`packages/frontend/src/assets/styles/variables.css`）

所有顏色、間距、陰影一律使用 CSS 變數，禁止硬編碼數值。

| Token | 值 | 用途 |
|-------|-----|------|
| `--primary` | `#4F6AF5` | 品牌主色（科技藍） |
| `--primary-hover` | `#3652D9` | hover 加深 |
| `--primary-gradient` | `135deg, #4F6AF5→#7C91F8` | 漸層 icon / avatar |
| `--success` | `#22C55E` | 成功、啟用狀態 |
| `--warning` | `#F59E0B` | 警告 |
| `--danger` | `#EF4444` | 錯誤、刪除 |
| `--sidebar-bg` | `#0F172A` | 深色 sidebar |
| `--shadow-card` | 輕微雙層陰影 | 卡片通用陰影 |
| `--radius-lg` | `12px` | 卡片圓角 |
| `--radius` | `8px` | 按鈕圓角 |

### 全域字型

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
  'PingFang TC', 'Microsoft JhengHei', sans-serif;
```

---

## 版面結構

### Layout 規則

- **Sidebar**：深色（`#0F172A`），寬度 220px，可收合為 64px
- **Content 區**：淺灰背景 `#EAECF2`，padding `24px 28px`
- **Header**：白底，高度 56px，含麵包屑導覽 + 使用者下拉選單

### 兩層 Sidebar 選單結構

選單支援一層平面項目與兩層群組項目，定義於 `AppSidebar.vue`：

```typescript
// 平面項目
{ path: '/dashboard', icon: 'Odometer', label: '儀表板', show: true }

// 群組項目（含子選單）
{
  key: 'system',
  icon: 'Setting',
  label: '系統管理',
  show: has('user:list') || ...,
  children: [
    { path: '/users',       label: '使用者列表', show: has('user:list') },
    { path: '/roles',       label: '角色列表',   show: has('role:list') },
    { path: '/permissions', label: '權限列表',   show: has('permission:list') },
  ],
}
```

**行為規則：**
- 子路由 active 時，父群組自動展開（`watch(route.path)` + `openGroups`）
- Sidebar 收合時，點擊群組 icon 導向第一個可見子項目
- 新增功能模組時，加入對應群組的 `children` 陣列，不要新增頂層平面項目

### Active 狀態樣式

- 左側 3px accent bar（`nav-accent`），scaleY(0→1) 動畫
- 子項目用縮排 + 小圓點，active 時圓點變 `--primary` 藍色

---

## 頁面標準結構

每個功能頁面使用以下固定結構：

```vue
<template>
  <div>
    <!-- 頁面標題 -->
    <div class="page-header">
      <h2 class="page-title">頁面名稱</h2>
    </div>

    <!-- 主要內容（通常是 BaseTable） -->
    <BaseTable ... />
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
</style>
```

**`.page-title`** 已在 `main.css` 定義全域樣式：左側 3px primary 藍色 accent bar、font-weight 700。

---

## 卡片（Card）規則

- 白底 `#fff`
- 圓角 `var(--radius-lg)` = 12px
- 邊框 `1px solid var(--gray-200)`
- 陰影 `0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)`
- 直接使用 `.base-table` 或 `.admin-card` class，不要自行定義卡片樣式

---

## BaseTable 元件規範

**檔案**：`packages/frontend/src/components/base/BaseTable.vue`

所有列表頁面一律使用 `BaseTable`，不要直接裸用 `vxe-table`。

### Actions 欄位按鈕設計

操作按鈕使用**圓形 icon 按鈕 + tooltip**，禁止使用純文字 `link` 按鈕：

```typescript
import { EditPen, Delete, Key } from '@element-plus/icons-vue'
import type { Component } from 'vue'

// TableAction.icon 型別為 Component（不是 string）
const actions: TableAction[] = [
  { label: '編輯', type: 'primary', icon: EditPen, permission: 'xxx:update', handler: ... },
  { label: '刪除', type: 'danger',  icon: Delete,  permission: 'xxx:delete', confirm: '...', handler: ... },
]
```

**按鈕配色規則（ghost button 樣式）：**

| type | 預設狀態 | hover 狀態 |
|------|---------|-----------|
| primary | 白底 + 藍色邊框 + 藍色 icon | 藍底 + 白色 icon |
| warning | 白底 + 橘色邊框 + 橘色 icon | 橘底 + 白色 icon |
| danger  | 白底 + 紅色邊框 + 紅色 icon | 紅底 + 白色 icon |

### Skeleton Loading

資料載入中顯示 5 行 shimmer skeleton，禁止使用 spinner：

```css
/* 使用全域 .skeleton class，已定義 shimmer 動畫 */
<div class="skeleton" style="height:16px; border-radius:4px;" />
```

---

## Element Plus 按鈕 Micro-interaction

全域定義於 `main.css`，所有 primary 按鈕 hover 自動套用：

```css
.el-button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 106, 245, 0.35);
}
```

禁止在 link/text 類型按鈕加此效果（已排除 `.el-button--link`）。

---

## 狀態 Badge / Tag 規範

使用 Element Plus `<el-tag>` 並搭配 CSS class：

| 狀態 | class / type | 顏色 |
|------|-------------|------|
| 啟用（ACTIVE）   | `.status-active`   | 綠色 |
| 停用（INACTIVE） | `.status-inactive` | 灰色 |
| 鎖定（LOCKED）   | `.status-locked`   | 紅色 |
| 系統角色         | `type="danger"` size="small" | 紅色 |
| 自訂角色         | `type="info"` size="small"   | 藍色 |
| 權限碼           | `type="warning"` effect="plain" | 橘色 |
| 模組分類         | `type="info"` size="small"   | 藍色 |

---

## vxe-table 樣式規範

全域定義於 `main.css`，勿覆寫：

- Header 背景：`#F8F9FC`，字色 gray-600，大寫，letter-spacing 0.4px
- 列高：`52px`
- Hover 列背景：`#F5F7FD`
- 邊框色：`var(--gray-100)`

---

## Header 麵包屑

自動從 `AppHeader.vue` 根據 route 產生，最後一層加粗顯示。新增路由時需在 `router/` 設定 `meta.breadcrumb` 或 `meta.title`。

---

## 新增功能模組 Checklist

1. **後端**：在 `packages/backend/src/modules/` 新增 route / controller / service / schema
2. **權限碼**：在 `seed.ts` 新增 `{module}:list/create/update/delete` 格式的權限碼
3. **API**：在 `packages/frontend/src/api/modules/` 新增對應 API module
4. **路由**：在 `router/` 設定路由，加 `meta.permission` 控制訪問
5. **選單**：在 `AppSidebar.vue` 的對應群組 `children` 陣列新增項目，並加 `show: has('xxx:list')`
6. **頁面**：使用 `BaseTable` + `page-title` 標準結構
7. **Action 按鈕**：從 `@element-plus/icons-vue` 引入 icon，傳入 `TableAction.icon`
8. **i18n**：在 `packages/frontend/src/i18n/locales/zh-TW/` 新增對應語系檔
