<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const activeSection = ref('overview')
const copied = ref<string | null>(null)

const sections = [
  { id: 'overview',    label: '概覽' },
  { id: 'quickstart',  label: '快速開始' },
  { id: 'auth',        label: '認證方式' },
  { id: 'endpoint',    label: '端點格式' },
  { id: 'params',      label: '參數類型' },
  { id: 'response',    label: '回應格式' },
  { id: 'examples',    label: '呼叫範例' },
  { id: 'errors',      label: '錯誤代碼' },
]

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = id
  }
}

function copyCode(key: string, text: string) {
  navigator.clipboard.writeText(text).then(() => {
    copied.value = key
    setTimeout(() => { copied.value = null }, 2000)
  })
}

function onScroll() {
  for (const s of [...sections].reverse()) {
    const el = document.getElementById(s.id)
    if (el && el.getBoundingClientRect().top <= 120) {
      activeSection.value = s.id
      return
    }
  }
  activeSection.value = sections[0].id
}

onMounted(() => window.addEventListener('scroll', onScroll, true))
onUnmounted(() => window.removeEventListener('scroll', onScroll, true))

// ── Code snippets ──
const BASE_URL = 'https://your-domain.com'

const curlJwt = `curl -X POST ${BASE_URL}/api/proxy/get-orders \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -d '{
    "userId": 123,
    "status": "active"
  }'`

const curlApiKey = `curl -X POST ${BASE_URL}/api/proxy/get-orders \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -d '{
    "userId": 123,
    "status": "active"
  }'`

const curlQueryKey = `curl "${BASE_URL}/api/proxy/get-report?userId=123&api_key=pk_xxxxx"`

const fetchExample = `const response = await fetch('${BASE_URL}/api/proxy/get-orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  body: JSON.stringify({
    userId: 123,
    status: 'active',
  }),
})

const result = await response.json()
// result.success === true  →  result.data 為 SP 回傳結果
// result.success === false →  result.error.message 為錯誤訊息`

const axiosExample = `import axios from 'axios'

const client = axios.create({
  baseURL: '${BASE_URL}',
  headers: { 'X-API-Key': 'pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
})

const { data } = await client.post('/api/proxy/get-orders', {
  userId: 123,
  status: 'active',
})

if (data.success) {
  console.log(data.data)       // SP 回傳結果
  console.log(data.meta)       // { api, durationMs }
}`

const successResponse = `{
  "success": true,
  "data": [
    { "orderId": 1, "amount": 299.0, "status": "active" },
    { "orderId": 2, "amount": 150.5, "status": "active" }
  ],
  "meta": {
    "api": "get-orders",
    "durationMs": 8
  }
}`

const errorResponse = `{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "缺少必填參數: userId"
  }
}`
</script>

<template>
  <div class="docs-page">
    <!-- 左側固定目錄 -->
    <aside class="docs-toc">
      <div class="toc-header">
        <el-icon size="15" color="var(--primary)"><Document /></el-icon>
        <span>本頁目錄</span>
      </div>
      <nav>
        <button
          v-for="s in sections"
          :key="s.id"
          class="toc-item"
          :class="{ active: activeSection === s.id }"
          @click="scrollTo(s.id)"
        >
          {{ s.label }}
        </button>
      </nav>

      <!-- 版本標籤 -->
      <div class="toc-footer">
        <el-tag type="success" size="small" effect="plain">v1.0</el-tag>
        <span class="toc-version-text">Data Proxy Layer</span>
      </div>
    </aside>

    <!-- 主要文件內容 -->
    <main class="docs-content">

      <!-- ① 概覽 ────────────────────────────── -->
      <section id="overview" class="doc-section">
        <div class="section-badge">概覽</div>
        <h2 class="section-title">數據代理層 API 服務</h2>
        <p class="section-lead">
          數據代理層（Data Proxy Layer）讓您無需撰寫任何程式碼，即可將資料庫中的
          <strong>Stored Procedure</strong> 包裝成標準 REST API 對外提供服務。
          所有 API 端點均由管理員在後台設定，具備統一的認證機制、參數驗證與呼叫記錄。
        </p>

        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon" style="background:rgba(79,106,245,0.1);color:var(--primary)">
              <el-icon size="20"><Connection /></el-icon>
            </div>
            <div>
              <div class="feature-title">零部署發佈</div>
              <div class="feature-desc">新增 API 端點無需重新部署，管理後台即時生效</div>
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon" style="background:rgba(34,197,94,0.1);color:#22c55e">
              <el-icon size="20"><Lock /></el-icon>
            </div>
            <div>
              <div class="feature-title">多元認證</div>
              <div class="feature-desc">支援 JWT Token、API Key 或兩者擇一，也可設為公開</div>
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
              <el-icon size="20"><DataAnalysis /></el-icon>
            </div>
            <div>
              <div class="feature-title">完整歷程記錄</div>
              <div class="feature-desc">每筆呼叫均自動記錄 IP、耗時、狀態碼與錯誤訊息</div>
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">
              <el-icon size="20"><Shield /></el-icon>
            </div>
            <div>
              <div class="feature-title">安全防護</div>
              <div class="feature-desc">SP 名稱格式驗證 + Parameterized Query，杜絕 SQL Injection</div>
            </div>
          </div>
        </div>
      </section>

      <div class="section-divider" />

      <!-- ② 快速開始 ─────────────────────────── -->
      <section id="quickstart" class="doc-section">
        <div class="section-badge">快速開始</div>
        <h2 class="section-title">三步驟開始使用</h2>

        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-body">
              <div class="step-title">建立 API 端點</div>
              <div class="step-desc">
                前往 <strong>API 管理 → API 列表</strong>，點擊「新增」。
                選擇要執行的 Stored Procedure，系統將自動讀取並帶入參數映射。
                設定認證方式後儲存即可。
              </div>
              <div class="step-tip">
                <el-icon size="13"><InfoFilled /></el-icon>
                API 路徑（path）建立後不可修改，請謹慎命名，建議使用 kebab-case，例如：<code>get-user-orders</code>
              </div>
            </div>
          </div>

          <div class="step-connector" />

          <div class="step">
            <div class="step-number">2</div>
            <div class="step-body">
              <div class="step-title">取得 API Key（認證方式為 API Key 時）</div>
              <div class="step-desc">
                前往 <strong>API 管理 → API KEY 管理</strong>，點擊「新增」建立 Key。
                <span class="text-danger">完整 Key 僅顯示一次</span>，請立即複製並妥善保存。
                後續僅顯示前綴（如 <code>pk_cbe7a56…</code>）供識別。
              </div>
            </div>
          </div>

          <div class="step-connector" />

          <div class="step">
            <div class="step-number">3</div>
            <div class="step-body">
              <div class="step-title">發送 API 請求</div>
              <div class="step-desc">
                以設定的認證方式與參數呼叫端點，即可取得 SP 執行結果。
              </div>
              <div class="code-block-wrap">
                <div class="code-block-header">
                  <span class="code-lang">bash</span>
                  <button class="copy-btn" @click="copyCode('qs', curlApiKey)">
                    <el-icon size="13"><component :is="copied === 'qs' ? 'Check' : 'CopyDocument'" /></el-icon>
                    {{ copied === 'qs' ? '已複製' : '複製' }}
                  </button>
                </div>
                <pre class="code-block"><code>{{ curlApiKey }}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="section-divider" />

      <!-- ③ 認證方式 ─────────────────────────── -->
      <section id="auth" class="doc-section">
        <div class="section-badge">認證方式</div>
        <h2 class="section-title">四種認證模式</h2>
        <p class="section-lead">每個 API 端點可獨立設定認證方式，在「API 列表」的新增/編輯表單中設定。</p>

        <el-tabs class="auth-tabs">
          <el-tab-pane label="🔐 JWT Token">
            <div class="auth-pane">
              <div class="auth-desc">
                使用管理後台登入取得的 JWT Access Token，適合內部系統整合。
                Token 放於 HTTP Header <code>Authorization</code>，格式為 <code>Bearer &lt;token&gt;</code>。
              </div>
              <div class="code-block-wrap">
                <div class="code-block-header">
                  <span class="code-lang">bash</span>
                  <button class="copy-btn" @click="copyCode('jwt', curlJwt)">
                    <el-icon size="13"><component :is="copied === 'jwt' ? 'Check' : 'CopyDocument'" /></el-icon>
                    {{ copied === 'jwt' ? '已複製' : '複製' }}
                  </button>
                </div>
                <pre class="code-block"><code>{{ curlJwt }}</code></pre>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="🗝️ API Key">
            <div class="auth-pane">
              <div class="auth-desc">
                使用 API KEY 管理頁面產生的金鑰，適合第三方系統或自動化腳本。
                可透過 Header 或 Query String 傳入，兩種方式均可。
              </div>
              <div class="method-label">方式一：HTTP Header（推薦）</div>
              <div class="code-block-wrap" style="margin-bottom:12px">
                <div class="code-block-header">
                  <span class="code-lang">bash</span>
                  <button class="copy-btn" @click="copyCode('key-h', curlApiKey)">
                    <el-icon size="13"><component :is="copied === 'key-h' ? 'Check' : 'CopyDocument'" /></el-icon>
                    {{ copied === 'key-h' ? '已複製' : '複製' }}
                  </button>
                </div>
                <pre class="code-block"><code>{{ curlApiKey }}</code></pre>
              </div>
              <div class="method-label">方式二：Query String</div>
              <div class="code-block-wrap">
                <div class="code-block-header">
                  <span class="code-lang">bash</span>
                  <button class="copy-btn" @click="copyCode('key-q', curlQueryKey)">
                    <el-icon size="13"><component :is="copied === 'key-q' ? 'Check' : 'CopyDocument'" /></el-icon>
                    {{ copied === 'key-q' ? '已複製' : '複製' }}
                  </button>
                </div>
                <pre class="code-block"><code>{{ curlQueryKey }}</code></pre>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="🔀 JWT 或 API Key">
            <div class="auth-pane">
              <div class="auth-desc">
                同時接受 JWT Token 與 API Key，任一有效即可通過認證。
                適合需要同時支援人工操作（JWT）與系統整合（API Key）的場景。
              </div>
              <el-alert type="info" :closable="false" show-icon>
                系統優先檢查 <code>X-API-Key</code> Header；未提供時再驗證 JWT Bearer Token。
              </el-alert>
            </div>
          </el-tab-pane>

          <el-tab-pane label="🌐 無需認證">
            <div class="auth-pane">
              <div class="auth-desc">
                無需任何認證即可呼叫，適用於完全公開的查詢型 API，例如公告、商品目錄等。
              </div>
              <el-alert type="warning" :closable="false" show-icon>
                設為「無需認證」將對外公開此端點，請確認該 SP 不含敏感資料。
              </el-alert>
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>

      <div class="section-divider" />

      <!-- ④ 端點格式 ─────────────────────────── -->
      <section id="endpoint" class="doc-section">
        <div class="section-badge">端點格式</div>
        <h2 class="section-title">API 端點說明</h2>

        <div class="endpoint-display">
          <span class="method-badge">METHOD</span>
          <span class="endpoint-url">/api/proxy/<em>{apiPath}</em></span>
        </div>

        <table class="doc-table">
          <thead>
            <tr><th>項目</th><th>說明</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>METHOD</code></td>
              <td>由 API 設定決定，支援 <code>GET</code>、<code>POST</code>、<code>PUT</code>、<code>DELETE</code></td>
            </tr>
            <tr>
              <td><code>apiPath</code></td>
              <td>API 列表中設定的「API 路徑」，小寫英文、數字與連字號，例如：<code>get-orders</code></td>
            </tr>
            <tr>
              <td>Request Body</td>
              <td>JSON 格式，key 為各參數映射中定義的「請求參數名」</td>
            </tr>
            <tr>
              <td>Query String</td>
              <td>GET 請求時可透過 Query String 傳遞參數，與 Body 合併後一起驗證</td>
            </tr>
            <tr>
              <td>Content-Type</td>
              <td><code>application/json</code>（POST/PUT/DELETE 時需設定）</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="section-divider" />

      <!-- ⑤ 參數類型 ─────────────────────────── -->
      <section id="params" class="doc-section">
        <div class="section-badge">參數類型</div>
        <h2 class="section-title">支援的參數型別</h2>
        <p class="section-lead">
          系統會根據 Stored Procedure 定義自動偵測 MySQL 型別並對應，也可在 API 列表手動調整。
          傳入值會在執行前依型別轉換後再帶入 SP。
        </p>

        <table class="doc-table">
          <thead>
            <tr><th>型別</th><th>對應 MySQL 型別</th><th>接受格式範例</th><th>說明</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="type-badge type-string">string</span></td>
              <td><code>VARCHAR</code>、<code>TEXT</code>、<code>CHAR</code>…</td>
              <td><code>"hello"</code></td>
              <td>轉為字串後傳入，為預設型別</td>
            </tr>
            <tr>
              <td><span class="type-badge type-int">int</span></td>
              <td><code>INT</code>、<code>BIGINT</code>、<code>SMALLINT</code>…</td>
              <td><code>123</code> 或 <code>"123"</code></td>
              <td>以 <code>parseInt</code> 轉換</td>
            </tr>
            <tr>
              <td><span class="type-badge type-decimal">decimal</span></td>
              <td><code>DECIMAL</code>、<code>FLOAT</code>、<code>DOUBLE</code>…</td>
              <td><code>99.5</code> 或 <code>"99.5"</code></td>
              <td>以 <code>parseFloat</code> 轉換</td>
            </tr>
            <tr>
              <td><span class="type-badge type-boolean">boolean</span></td>
              <td><code>TINYINT(1)</code>、<code>BOOLEAN</code></td>
              <td><code>true</code> / <code>false</code> 或 <code>"true"</code></td>
              <td>接受布林值或字串 "true"/"1"</td>
            </tr>
            <tr>
              <td><span class="type-badge type-datetime">datetime</span></td>
              <td><code>DATETIME</code>、<code>TIMESTAMP</code>、<code>DATE</code></td>
              <td><code>"2024-01-15T08:30:00Z"</code></td>
              <td>ISO 8601 格式，以 <code>new Date()</code> 轉換</td>
            </tr>
          </tbody>
        </table>

        <el-alert type="info" :closable="false" style="margin-top:16px">
          <template #title>
            自動型別偵測：從「API 列表」選擇 SP 後點擊「讀取參數」，系統將從
            <code>INFORMATION_SCHEMA.PARAMETERS</code> 自動帶入參數名稱與型別。
          </template>
        </el-alert>
      </section>

      <div class="section-divider" />

      <!-- ⑥ 回應格式 ─────────────────────────── -->
      <section id="response" class="doc-section">
        <div class="section-badge">回應格式</div>
        <h2 class="section-title">統一回應結構</h2>

        <div class="response-grid">
          <div>
            <div class="response-label success-label">
              <el-icon size="13"><CircleCheckFilled /></el-icon> 成功回應
              <span class="status-code">HTTP 200</span>
            </div>
            <div class="code-block-wrap">
              <div class="code-block-header">
                <span class="code-lang">json</span>
                <button class="copy-btn" @click="copyCode('ok', successResponse)">
                  <el-icon size="13"><component :is="copied === 'ok' ? 'Check' : 'CopyDocument'" /></el-icon>
                  {{ copied === 'ok' ? '已複製' : '複製' }}
                </button>
              </div>
              <pre class="code-block"><code>{{ successResponse }}</code></pre>
            </div>
          </div>

          <div>
            <div class="response-label error-label">
              <el-icon size="13"><CircleCloseFilled /></el-icon> 失敗回應
              <span class="status-code">HTTP 4xx / 5xx</span>
            </div>
            <div class="code-block-wrap">
              <div class="code-block-header">
                <span class="code-lang">json</span>
                <button class="copy-btn" @click="copyCode('err', errorResponse)">
                  <el-icon size="13"><component :is="copied === 'err' ? 'Check' : 'CopyDocument'" /></el-icon>
                  {{ copied === 'err' ? '已複製' : '複製' }}
                </button>
              </div>
              <pre class="code-block"><code>{{ errorResponse }}</code></pre>
            </div>
          </div>
        </div>

        <table class="doc-table" style="margin-top:20px">
          <thead>
            <tr><th>欄位</th><th>型別</th><th>說明</th></tr>
          </thead>
          <tbody>
            <tr><td><code>success</code></td><td>boolean</td><td>請求是否成功</td></tr>
            <tr><td><code>data</code></td><td>any[]</td><td>SP 回傳的結果集（成功時）</td></tr>
            <tr><td><code>meta.api</code></td><td>string</td><td>執行的 API 路徑</td></tr>
            <tr><td><code>meta.durationMs</code></td><td>number</td><td>SP 執行耗時（毫秒）</td></tr>
            <tr><td><code>error.code</code></td><td>string</td><td>錯誤代碼（失敗時）</td></tr>
            <tr><td><code>error.message</code></td><td>string</td><td>人類可讀的錯誤說明（失敗時）</td></tr>
          </tbody>
        </table>
      </section>

      <div class="section-divider" />

      <!-- ⑦ 呼叫範例 ─────────────────────────── -->
      <section id="examples" class="doc-section">
        <div class="section-badge">呼叫範例</div>
        <h2 class="section-title">完整程式碼範例</h2>
        <p class="section-lead">以下範例均以 API Key 認證方式示範。</p>

        <el-tabs class="example-tabs">
          <el-tab-pane label="cURL">
            <div class="code-block-wrap">
              <div class="code-block-header">
                <span class="code-lang">bash</span>
                <button class="copy-btn" @click="copyCode('curl', curlApiKey)">
                  <el-icon size="13"><component :is="copied === 'curl' ? 'Check' : 'CopyDocument'" /></el-icon>
                  {{ copied === 'curl' ? '已複製' : '複製' }}
                </button>
              </div>
              <pre class="code-block"><code>{{ curlApiKey }}</code></pre>
            </div>
          </el-tab-pane>

          <el-tab-pane label="JavaScript (fetch)">
            <div class="code-block-wrap">
              <div class="code-block-header">
                <span class="code-lang">javascript</span>
                <button class="copy-btn" @click="copyCode('fetch', fetchExample)">
                  <el-icon size="13"><component :is="copied === 'fetch' ? 'Check' : 'CopyDocument'" /></el-icon>
                  {{ copied === 'fetch' ? '已複製' : '複製' }}
                </button>
              </div>
              <pre class="code-block"><code>{{ fetchExample }}</code></pre>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Axios">
            <div class="code-block-wrap">
              <div class="code-block-header">
                <span class="code-lang">javascript</span>
                <button class="copy-btn" @click="copyCode('axios', axiosExample)">
                  <el-icon size="13"><component :is="copied === 'axios' ? 'Check' : 'CopyDocument'" /></el-icon>
                  {{ copied === 'axios' ? '已複製' : '複製' }}
                </button>
              </div>
              <pre class="code-block"><code>{{ axiosExample }}</code></pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>

      <div class="section-divider" />

      <!-- ⑧ 錯誤代碼 ─────────────────────────── -->
      <section id="errors" class="doc-section">
        <div class="section-badge">錯誤代碼</div>
        <h2 class="section-title">常見錯誤代碼</h2>

        <table class="doc-table">
          <thead>
            <tr><th>HTTP 狀態</th><th>error.code</th><th>說明</th><th>處理建議</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="status-badge s400">400</span></td>
              <td><code>VALIDATION_ERROR</code></td>
              <td>缺少必填參數或參數格式錯誤</td>
              <td>檢查 Request Body 是否包含所有必填欄位及正確型別</td>
            </tr>
            <tr>
              <td><span class="status-badge s401">401</span></td>
              <td><code>UNAUTHORIZED</code></td>
              <td>未提供認證憑證或憑證無效</td>
              <td>確認 JWT Token 未過期，或 API Key 有效且啟用中</td>
            </tr>
            <tr>
              <td><span class="status-badge s401">401</span></td>
              <td><code>UNAUTHORIZED</code></td>
              <td>API Key 已停用或過期</td>
              <td>前往 API KEY 管理頁確認 Key 狀態及到期時間</td>
            </tr>
            <tr>
              <td><span class="status-badge s403">403</span></td>
              <td><code>FORBIDDEN</code></td>
              <td>API Key 無權存取此端點</td>
              <td>確認 Key 的「允許存取 API」設定是否包含此路徑</td>
            </tr>
            <tr>
              <td><span class="status-badge s404">404</span></td>
              <td><code>NOT_FOUND</code></td>
              <td>API 路徑不存在或已停用</td>
              <td>確認路徑是否正確，且 API 列表中該端點狀態為啟用</td>
            </tr>
            <tr>
              <td><span class="status-badge s500">500</span></td>
              <td><code>SP_ERROR</code></td>
              <td>Stored Procedure 執行失敗</td>
              <td>查看 API 歷程記錄中的 errorMsg，確認 SP 是否存在且語法正確</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 底部空白 -->
      <div style="height: 80px" />
    </main>
  </div>
</template>

<style scoped>
/* ── 整體版面 ── */
.docs-page {
  display: flex;
  gap: 0;
  align-items: flex-start;
  min-height: calc(100vh - 56px);
}

/* ── 左側目錄 ── */
.docs-toc {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 24px;
  background: #fff;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: var(--radius-lg, 12px);
  padding: 16px 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}
.toc-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6b7280;
  border-bottom: 1px solid var(--gray-100, #f3f4f6);
}
.toc-item {
  display: block;
  width: 100%;
  padding: 7px 16px;
  text-align: left;
  font-size: 13px;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  border-left: 3px solid transparent;
  line-height: 1.4;
}
.toc-item:hover { color: var(--primary); background: rgba(79,106,245,0.04); }
.toc-item.active {
  color: var(--primary);
  font-weight: 600;
  border-left-color: var(--primary);
  background: rgba(79,106,245,0.07);
}
.toc-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px 0;
  margin-top: 8px;
  border-top: 1px solid var(--gray-100, #f3f4f6);
}
.toc-version-text { font-size: 11px; color: #9ca3af; }

/* ── 右側主要內容 ── */
.docs-content {
  flex: 1;
  min-width: 0;
  padding-left: 28px;
}

.doc-section { scroll-margin-top: 20px; }

.section-divider {
  height: 1px;
  background: linear-gradient(to right, var(--gray-200, #e5e7eb), transparent);
  margin: 36px 0;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--primary);
  background: rgba(79,106,245,0.09);
  border-radius: 20px;
  padding: 3px 10px;
  margin-bottom: 10px;
}
.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px;
  line-height: 1.3;
}
.section-lead {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.75;
  margin: 0 0 20px;
}

/* ── 特色卡片 ── */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 4px;
}
.feature-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: var(--radius-lg, 12px);
  align-items: flex-start;
}
.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.feature-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 3px; }
.feature-desc  { font-size: 12.5px; color: #6b7280; line-height: 1.55; }

/* ── 步驟 ── */
.steps { display: flex; flex-direction: column; }
.step {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}
.step-connector {
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, var(--primary), transparent);
  margin: 4px 0 4px 16px;
  border-radius: 1px;
}
.step-number {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(79,106,245,0.35);
}
.step-body { flex: 1; padding-bottom: 4px; }
.step-title { font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 6px; margin-top: 6px; }
.step-desc  { font-size: 13.5px; color: #4b5563; line-height: 1.65; margin-bottom: 10px; }
.step-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12.5px;
  color: #6b7280;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
  line-height: 1.55;
}

/* ── 認證 Tabs ── */
.auth-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }
.auth-pane { padding-top: 4px; }
.auth-desc {
  font-size: 13.5px;
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 14px;
}
.method-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── 端點顯示 ── */
.endpoint-display {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1e293b;
  border-radius: 10px;
  padding: 14px 20px;
  margin-bottom: 20px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.method-badge {
  background: rgba(79,106,245,0.25);
  color: #818cf8;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  flex-shrink: 0;
}
.endpoint-url {
  color: #e2e8f0;
  font-size: 15px;
}
.endpoint-url em { color: #7dd3fc; font-style: normal; }

/* ── Code Block ── */
.code-block-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #1e293b;
}
.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #162032;
  padding: 7px 14px;
  border-bottom: 1px solid #1e293b;
}
.code-lang {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s;
}
.copy-btn:hover { color: #94a3b8; }
.code-block {
  margin: 0;
  padding: 16px 18px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.7;
  overflow-x: auto;
  white-space: pre;
}

/* ── 回應範例並排 ── */
.response-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.response-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.success-label { color: #16a34a; }
.error-label   { color: #dc2626; }
.status-code {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(0,0,0,0.06);
  color: #374151;
}

/* ── 表格 ── */
.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  overflow: hidden;
}
.doc-table th {
  background: #f8f9fc;
  padding: 10px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}
.doc-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--gray-100, #f3f4f6);
  color: #374151;
  line-height: 1.55;
}
.doc-table tr:last-child td { border-bottom: none; }
.doc-table tr:hover td { background: #f8fafc; }

/* ── 型別 Badge ── */
.type-badge {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}
.type-string   { background: #dbeafe; color: #1d4ed8; }
.type-int      { background: #d1fae5; color: #065f46; }
.type-decimal  { background: #fef3c7; color: #92400e; }
.type-boolean  { background: #fce7f3; color: #9d174d; }
.type-datetime { background: #ede9fe; color: #5b21b6; }

/* ── 狀態碼 Badge ── */
.status-badge {
  display: inline-block;
  font-family: monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}
.s400 { background: #fef3c7; color: #92400e; }
.s401 { background: #fee2e2; color: #991b1b; }
.s403 { background: #ffe4e6; color: #9f1239; }
.s404 { background: #f1f5f9; color: #475569; }
.s500 { background: #fee2e2; color: #991b1b; }

.text-danger { color: var(--danger, #ef4444); font-weight: 600; }

code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12.5px;
  background: #f1f5f9;
  color: #334155;
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
