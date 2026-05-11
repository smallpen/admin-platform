import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { i18n } from './i18n'
import router from './router'
import { vPermission } from './directives/v-permission'
import '@/assets/styles/main.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(VXETable)
app.use(i18n)
app.directive('permission', vPermission)

app.mount('#app')
