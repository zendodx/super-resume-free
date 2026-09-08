import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import Icon from './components/Icon.vue'
import './styles/global.css'
import './styles/print.css'

const app = createApp(App)

// 图标组件全局注册：各模块操作栏/工具栏中大量使用 <Icon>
app.component('Icon', Icon)

app.use(createPinia()).mount('#app')
