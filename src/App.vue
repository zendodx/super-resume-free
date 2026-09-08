<script setup lang="ts">
import { nextTick, ref } from 'vue'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorPanel from '@/components/EditorPanel.vue'
import ResumePreview from '@/components/ResumePreview.vue'
import ModuleSortDialog from '@/components/ModuleSortDialog.vue'
import AddModuleDialog from '@/components/AddModuleDialog.vue'
import TemplateDialog from '@/components/TemplateDialog.vue'
import ResumeLibrary from '@/components/ResumeLibrary.vue'
import { useResumeStore } from '@/store/resume'

const store = useResumeStore()

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
