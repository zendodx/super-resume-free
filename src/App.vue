<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorPanel from '@/components/EditorPanel.vue'
import ResumePreview from '@/components/ResumePreview.vue'
import ModuleSortDialog from '@/components/ModuleSortDialog.vue'
import AddModuleDialog from '@/components/AddModuleDialog.vue'
import TemplateDialog from '@/components/TemplateDialog.vue'
import ResumeLibrary from '@/components/ResumeLibrary.vue'
import { useResumeStore } from '@/store/resume'

const store = useResumeStore()

// 开发环境暴露 store 便于调试
if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__resumeStore = store

const view = ref<'library' | 'editor'>('library')

const sortVisible = ref(false)
const addVisible = ref(false)
const templateVisible = ref(false)

/** 从列表打开简历；可选直接触发下载 */
function openEditor(id: string, opts?: { download?: boolean }) {
  store.openResume(id)
  view.value = 'editor'
  if (opts?.download) {
    // 等待预览组件完成分页渲染后触发打印
    nextTick(() => setTimeout(() => store.requestDownload(), 400))
  }
}

/** 新建简历并进入编辑器 */
function createResume() {
  store.createAndOpen()
  view.value = 'editor'
}

/** 返回简历列表（先落盘当前编辑内容） */
function backToLibrary() {
  store.flushSave()
  view.value = 'library'
}

// ---------- 撤销/重做快捷键 ----------
function onKeydown(e: KeyboardEvent) {
  if (view.value !== 'editor') return
  // 输入框内也走文档级撤销：本应用输入框是受控组件，浏览器原生文本撤销与
  // Vue 状态渲染不同步，原生撤销表现异常，统一由文档快照接管
  const mod = e.metaKey || e.ctrlKey
  if (!mod) return
  const key = e.key.toLowerCase()
  if (key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  } else if ((key === 'z' && e.shiftKey) || key === 'y') {
    e.preventDefault()
    store.redo()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="app-shell">
    <ResumeLibrary
      v-if="view === 'library'"
      @open="openEditor"
      @create="createResume"
    />
    <template v-else>
      <EditorHeader
        @open-sort="sortVisible = true"
        @open-template="templateVisible = true"
        @back="backToLibrary"
      />
      <div class="app-main">
        <EditorPanel @open-add="addVisible = true" />
        <ResumePreview />
      </div>
      <ModuleSortDialog v-if="sortVisible" @close="sortVisible = false" />
      <AddModuleDialog v-if="addVisible" @close="addVisible = false" />
      <TemplateDialog v-if="templateVisible" @close="templateVisible = false" />
    </template>
  </div>
</template>

<style scoped>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
  min-height: 0;
  display: flex;
}
</style>
