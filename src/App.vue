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

// ---------- 左侧编辑栏宽度（可拖拽调节） ----------
const PANEL_WIDTH_KEY = 'srf.panelWidth'
const PANEL_MIN = 380
const PANEL_MAX = 900
const PANEL_DEFAULT = 560

function clampPanelWidth(w: number) {
  return Math.min(PANEL_MAX, Math.max(PANEL_MIN, Math.round(w)))
}

const panelWidth = ref(clampPanelWidth(Number(localStorage.getItem(PANEL_WIDTH_KEY)) || PANEL_DEFAULT))
const resizing = ref(false)

function onResizeStart(e: MouseEvent) {
  e.preventDefault()
  resizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onResizing(e: MouseEvent) {
  if (!resizing.value) return
  panelWidth.value = clampPanelWidth(e.clientX)
}

function onResizeEnd() {
  if (!resizing.value) return
  resizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth.value))
}

onMounted(() => {
  window.addEventListener('mousemove', onResizing)
  window.addEventListener('mouseup', onResizeEnd)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onResizing)
  window.removeEventListener('mouseup', onResizeEnd)
})
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
        <EditorPanel :style="{ width: panelWidth + 'px' }" @open-add="addVisible = true" />
        <div
          class="app-resizer"
          :class="{ active: resizing }"
          title="拖动调节编辑栏宽度"
          @mousedown="onResizeStart"
        >
          <span class="app-resizer-grip" />
        </div>
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
.app-resizer {
  width: 6px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  position: relative;
  z-index: 5;
  transition: background 0.15s;
}
.app-resizer:hover,
.app-resizer.active {
  background: rgba(59, 130, 246, 0.25);
}
.app-resizer-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 34px;
  border-radius: 2px;
  background: #c3c8cf;
}
.app-resizer:hover .app-resizer-grip,
.app-resizer.active .app-resizer-grip {
  background: var(--brand);
}
</style>
