# Docker 部署指南

本系統採用 Docker Compose 進行容器化部署，包含三個服務：

| 容器 | 說明 |
|------|------|
| `admin-mysql`    | MySQL 8.0 資料庫伺服器 |
| `admin-backend`  | Node.js (Fastify) API 伺服器 |
| `admin-frontend` | Nginx 靜態伺服器，提供 Vue 3 前端 + 反向代理 API |

資料庫（MySQL 8.0）透過 Docker Volume `mysql-data` 持久化儲存。

```
Internet
   │
   ▼ :80
┌──────────────────┐
│  admin-frontend  │  (Nginx)
│  /api/* → proxy  │
└────────┬─────────┘
         │ :3001
┌────────▼─────────┐
│  admin-backend   │  (Fastify)
└────────┬─────────┘
         │ :3306
┌────────▼─────────┐
│  admin-mysql     │  (MySQL 8.0)
│  mysql-data vol  │──── Volume: mysql-data
└──────────────────┘
```

---

## 一、事前準備

### 1.1 主機需求

- OS：Ubuntu 22.04+ / Debian 12+ / CentOS 9+
- RAM：最低 1 GB（建議 2 GB）
- Docker：>= 24.0
- Docker Compose：>= 2.20（內建於 Docker Desktop / Docker Engine v2）

### 1.2 安裝 Docker

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # 免 sudo 執行 docker
newgrp docker                   # 立即套用群組（或重新登入）

# 確認版本
docker --version
docker compose version
```

---

## 二、首次部署

### 2.1 Clone 專案

```bash
git clone https://github.com/smallpen/admin-platform.git
cd admin-platform
```

### 2.2 建立環境變數檔

```bash
cp .env.example .env
```

編輯 `.env`，**至少修改以下五個必填項**：

```bash
nano .env
```

```dotenv
# MySQL 資料庫密碼（必須設定）
MYSQL_ROOT_PASSWORD=<強密碼>
MYSQL_PASSWORD=<強密碼>

# 生產環境 JWT 密鑰（必須修改，至少 32 字元）
JWT_ACCESS_SECRET=<使用以下指令產生>
JWT_REFRESH_SECRET=<使用以下指令產生>

# CORS：改為你的實際 domain 或 IP
CORS_ORIGIN=http://your-server-ip
```

**產生隨機密鑰指令：**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

執行兩次，分別填入 `JWT_ACCESS_SECRET` 和 `JWT_REFRESH_SECRET`。

### 2.3 確認 Migration 檔案已存在

Migration 檔案需 commit 到 git，容器才能執行 `prisma migrate deploy`。

```bash
# 確認 migration 資料夾已存在
ls packages/backend/prisma/migrations/
```

若資料夾不存在（首次 clone 後缺少），需在本機產生：

```bash
# 本機需有 Node.js 環境與可連線的 MySQL
npm install
npm run db:migrate -w packages/backend   # 輸入名稱，例如：init_mysql

# commit migration 到 git
git add packages/backend/prisma/migrations/
git commit -m "feat: add initial database migrations"
git push
```

> ⚠️ 若跳過此步驟，容器啟動時 `prisma migrate deploy` 會失敗。

### 2.4 建構並啟動容器

```bash
# 第一次建構（需要較長時間下載 base image + 安裝依賴）
docker compose up -d --build

# 查看啟動狀態（mysql 需先 healthy 才會啟動 backend）
docker compose ps
```

預期輸出：

```
NAME              STATUS
admin-mysql       running (healthy)
admin-backend     running (healthy)
admin-frontend    running
```

### 2.5 初始化資料庫 Seed（只需執行一次）

```bash
docker compose exec backend sh -c "node packages/backend/dist/seed.js"
```

執行完成後，預設帳號：
- **帳號**：`admin`
- **密碼**：`Admin@123456`

> ⚠️ 部署後請立即登入並修改密碼！

### 2.6 驗證部署

```bash
# 測試後端 API
curl http://localhost/api/v1/health

# 開啟瀏覽器
http://your-server-ip
```

---

## 三、環境變數完整說明

| 變數名稱 | 必填 | 預設值 | 說明 |
|---------|------|--------|------|
| `MYSQL_ROOT_PASSWORD` | ✅ | — | MySQL root 密碼 |
| `MYSQL_PASSWORD` | ✅ | — | MySQL admin 使用者密碼 |
| `JWT_ACCESS_SECRET` | ✅ | — | Access Token 簽署密鑰（最少 32 字元）|
| `JWT_REFRESH_SECRET` | ✅ | — | Refresh Token 簽署密鑰（最少 32 字元）|
| `CORS_ORIGIN` | ✅ | `http://localhost` | 允許的前端來源 URL |
| `JWT_ACCESS_EXPIRES_IN` | | `15m` | Access Token 效期 |
| `JWT_REFRESH_EXPIRES_IN` | | `7d` | Refresh Token 效期 |
| `HTTP_PORT` | | `80` | 前端對外 HTTP port |

---

## 四、日常維運指令

### 4.1 查看日誌

```bash
# 即時追蹤所有容器日誌
docker compose logs -f

# 只看後端
docker compose logs -f backend

# 只看 MySQL
docker compose logs -f mysql

# 只看前端
docker compose logs -f frontend
```

### 4.2 重啟服務

```bash
# 重啟所有服務
docker compose restart

# 只重啟後端
docker compose restart backend
```

### 4.3 停止 / 刪除

```bash
# 停止（保留容器與資料）
docker compose stop

# 停止並刪除容器（資料保留在 volume）
docker compose down

# 完全清除（包含資料庫！謹慎使用）
docker compose down -v
```

---

## 五、更新部署

當程式碼有更新時：

```bash
# 1. 拉取最新程式碼
git pull origin main

# 2. 重新建構並重啟
docker compose up -d --build

# 3. 若有新 migration，容器重啟時會自動執行 prisma migrate deploy
```

---

## 六、資料備份與還原

### 6.1 備份 MySQL 資料庫

```bash
# 建立備份資料夾
mkdir -p ~/backups

# 使用 mysqldump 備份（需輸入 MYSQL_PASSWORD）
docker compose exec mysql sh -c \
  "mysqldump -u admin -p'${MYSQL_PASSWORD}' admin_platform" \
  > ~/backups/backup-$(date +%Y%m%d).sql
```

### 6.2 還原資料庫

```bash
# 停止後端（避免寫入衝突）
docker compose stop backend

# 還原
docker compose exec -T mysql sh -c \
  "mysql -u admin -p'${MYSQL_PASSWORD}' admin_platform" \
  < ~/backups/backup-YYYYMMDD.sql

# 重啟後端
docker compose start backend
```

### 6.3 自動備份（crontab）

```bash
crontab -e
```

加入（每天凌晨 3 點備份，保留 30 天）：

```cron
0 3 * * * cd /path/to/admin-platform && docker compose exec -T mysql sh -c "mysqldump -u admin -p\${MYSQL_PASSWORD} admin_platform" > /path/to/backups/backup-$(date +\%Y\%m\%d).sql && find /path/to/backups/ -name "backup-*.sql" -mtime +30 -delete
```

---

## 七、SSL / HTTPS 設定（Caddy 自動憑證）

本系統使用 **Caddy** 作為 TLS 終端與反向代理，憑證由 Let's Encrypt 自動申請與續期，**不需在主機安裝任何額外軟體**。

架構說明：

```
Internet :80/:443
     │
     ▼
┌─────────────────┐
│  admin-caddy    │  根據 hostname 路由
│  (:80 → :443)   │  自動申請 TLS 憑證
└────┬────────┬───┘
     │        │
     ▼        ▼
┌─────────┐ ┌──────────────┐
│ admin-  │ │ admin-       │
│ nginx   │ │ frontend     │
│ 靜態網站│ │ 後台 + API   │
└─────────┘ └──────┬───────┘
                   │ /api/*
              ┌────▼─────┐
              │ admin-   │
              │ backend  │
              └──────────┘
```

網域對應關係：

| 網域 | 服務 |
|------|------|
| `www.yourdomain.com` | 靜態網站（`admin-nginx`） |
| `admin.yourdomain.com` | 後台管理系統（`admin-frontend`） |

### 7.1 DNS 設定

在你的 DNS 服務商新增兩筆 A record，都指向同一台伺服器 IP：

```
www.yourdomain.com   →  your-server-ip
admin.yourdomain.com →  your-server-ip
```

> ⚠️ DNS 生效需要數分鐘至數小時，部署前請先確認 `ping www.yourdomain.com` 能解析到正確 IP。

### 7.2 確認防火牆開放

伺服器的 80 與 443 port 必須對外開放（Caddy 申請憑證時需要 HTTP-01 challenge）：

```bash
# Ubuntu / Debian（ufw）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# 確認狀態
sudo ufw status
```

### 7.3 設定 .env

編輯 `.env`，填入實際網域，並更新 CORS：

```dotenv
# 靜態網站網域
DOMAIN_STATIC=www.yourdomain.com

# 後台管理系統網域
DOMAIN_ADMIN=admin.yourdomain.com

# CORS 必須與 DOMAIN_ADMIN 一致（https）
CORS_ORIGIN=https://admin.yourdomain.com
```

### 7.4 部署

```bash
docker compose up -d --build
```

Caddy 啟動後約 10~30 秒內自動完成憑證申請。之後所有 HTTP 訪問都會自動 301 redirect 到 HTTPS。

### 7.5 驗證

```bash
# 確認憑證已申請成功
curl -I https://admin.yourdomain.com/api/v1/health

# 查看 Caddy 日誌（憑證申請過程）
docker compose logs -f caddy
```

預期看到類似以下訊息代表憑證申請成功：

```
obtained certificate   www.yourdomain.com
obtained certificate   admin.yourdomain.com
```

### 7.6 憑證持久化

憑證存放於 Docker volume `caddy_data`，容器重啟或重新部署後不需重新申請：

```bash
# 確認 volume 存在
docker volume ls | grep caddy_data
```

> ⚠️ 執行 `docker compose down -v` 會刪除 `caddy_data`，下次啟動將重新申請憑證（Let's Encrypt 有每週申請上限，請避免頻繁刪除）。

---

## 八、常見問題排查

### 容器無法啟動

```bash
# 查看詳細錯誤
docker compose logs backend
docker compose logs mysql
```

常見原因：
- `.env` 未設定或 `JWT_ACCESS_SECRET` 不足 32 字元
- `.env` 缺少 `MYSQL_ROOT_PASSWORD` 或 `MYSQL_PASSWORD`
- Migration 檔案不存在（見 2.3）
- Port 80 已被主機其他程序佔用

### MySQL 未就緒導致 backend 連線失敗

backend 依賴 mysql 的 healthcheck，若 mysql 啟動慢，backend 會等待。若持續失敗：

```bash
# 確認 mysql container 狀態
docker compose ps mysql

# 手動測試 MySQL 連線
docker compose exec mysql mysqladmin ping -h 127.0.0.1 -u admin --password=$MYSQL_PASSWORD
```

### Port 衝突

80 / 443 port 由 `admin-caddy` container 佔用。若主機上已有其他服務（如 Nginx、Apache）使用這兩個 port，需先停用：

```bash
# 檢查佔用狀況
sudo lsof -i :80
sudo lsof -i :443

# 停用主機 Nginx（若有）
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### 資料庫完整性檢查

```bash
# 連入 MySQL 執行檢查
docker compose exec mysql sh -c \
  "mysqlcheck -u admin -p'${MYSQL_PASSWORD}' --all-databases"
```

### 重新 Seed（清空重來）

```bash
# 警告：這會清除所有資料！
docker compose exec backend sh -c \
  "node_modules/.bin/prisma migrate reset --schema=packages/backend/prisma/schema.prisma --force"
docker compose exec backend sh -c "node packages/backend/dist/seed.js"
```
