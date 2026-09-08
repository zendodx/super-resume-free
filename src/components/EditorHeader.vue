<script setup lang="ts">
import { computed, ref } from 'vue'
import { useResumeStore } from '@/store/resume'
import {
  FONT_FAMILIES,
  FONT_SIZES,
  LINE_SPACINGS,
  MODULE_SPACINGS,
  PAGE_MARGINS,
} from '@/data/constants'
import SelectDropdown from './SelectDropdown.vue'
import ColorPickerPopover from './ColorPickerPopover.vue'

const emit = defineEmits<{
  (e: 'openSort'): void
  (e: 'openTemplate'): void
  (e: 'back'): void
}>()

const store = useResumeStore()
const layout = store.doc.layout

const editingName = ref(false)
const nameInput = ref('')

const fontValue = computed({
  get: () => layout.fontFamily,
  set: (v) => store.updateLayout({ fontFamily: String(v) }),
})
const sizeValue = computed({
  get: () => layout.fontSize,
  set: (v) => store.updateLayout({ fontSize: Number(v) }),
})
const lineHeightValue = computed({
  get: () => layout.lineHeight,
  set: (v) => store.updateLayout({ lineHeight: Number(v) }),
})
const moduleSpacingValue = computed({
  get: () => layout.moduleSpacing,
  set: (v) => store.updateLayout({ moduleSpacing: Number(v) }),
})
const marginValue = computed({
  get: () => layout.pageMargin,
  set: (v) => store.updateLayout({ pageMargin: Number(v) }),
})
const colorValue = computed({
  get: () => layout.themeColor,
  set: (v: string) => store.updateLayout({ themeColor: v }),
})

const savedText = computed(() =>
  store.ui.saveState === 'saving' ? '保存中…' : `已保存 ${relativeTime(store.doc.updatedAt)}`,
)

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟以前`
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function startEditName() {
  nameInput.value = store.doc.name
  editingName.value = true
}
function commitName() {
  store.setResumeName(nameInput.value)
  editingName.value = false
}
</script>

<template>
  <header class="eh">
    <div class="eh-left">
      <button class="eh-back" type="button" title="返回我的简历" @click="emit('back')">
        <Icon name="chevron-left" :size="22" />
        <span>我的简历</span>
      </button>
      <input
        v-if="editingName"
        v-model="nameInput"
        class="eh-name-input"
        @keyup.enter="commitName"
        @blur="commitName"
        v-focus
      />
      <h1 v-else class="eh-name" title="点击重命名" @click="startEditName">
        {{ store.doc.name }}
        <Icon name="edit" :size="15" class="eh-name-icon" />
      </h1>
      <span class="eh-save" :class="{ saving: store.ui.saveState === 'saving' }">
        <Icon :name="store.ui.saveState === 'saving' ? 'save' : 'check-circle'" :size="14" />
        {{ savedText }}
      </span>
    </div>

    <div class="eh-menu">
      <button class="eh-item eh-template" type="button" @click="emit('openTemplate')">
        <Icon name="palette" :size="18" />
        模板{{ store.templateName ? ` · ${store.templateName}` : '' }}
      </button>
      <button class="eh-item eh-onepage" type="button" @click="store.requestOnePage()">
        <Icon name="eye" :size="18" />
        智能一页
      </button>
      <button class="eh-item" type="button" title="模块排序" @click="emit('openSort')">
        <Icon name="sort" :size="19" />
      </button>
      <div class="eh-item" title="字体">
        <SelectDropdown v-model="fontValue" :options="FONT_FAMILIES" width="106px" />
      </div>
      <div class="eh-item" title="字号">
        <SelectDropdown v-model="sizeValue" :options="FONT_SIZES" width="60px" />
      </div>
      <div class="eh-item" title="行距">
        <SelectDropdown v-model="lineHeightValue" :options="LINE_SPACINGS" width="60px" />
      </div>
      <div class="eh-item" title="模块间距">
        <SelectDropdown v-model="moduleSpacingValue" :options="MODULE_SPACINGS" width="60px" />
      </div>
      <div class="eh-item" title="页边距">
        <SelectDropdown v-model="marginValue" :options="PAGE_MARGINS" width="68px" />
      </div>
      <div class="eh-item" title="主题色">
        <ColorPickerPopover v-model="colorValue" />
      </div>
      <button class="eh-item" type="button" title="重置为示例简历" @click="store.resetResume()">
        <Icon name="reset" :size="19" />
      </button>
      <button class="eh-download" type="button" @click="store.requestDownload()">
        <Icon name="download" :size="18" />
        下载
      </button>
    </div>
  </header>
</template>

<script lang="ts">
export default {
  directives: {
    focus: {
      mounted(el: HTMLInputElement) {
        el.focus()
        el.select()
      },
    },
  },
}
</script>

<style scoped>
.eh {
  height: 56px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: relative;
  z-index: 100;
}
.eh-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.eh-back {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  color: var(--text-sub);
  padding: 6px 4px 6px 0;
}
.eh-back:hover {
  color: var(--brand);
}
.eh-name {
  font-size: 15px;
  font-weight: 600;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
.eh-name-icon {
  color: var(--text-light);
  opacity: 0;
  transition: opacity 0.15s;
}
.eh-name:hover .eh-name-icon {
  opacity: 1;
}
.eh-name-input {
  height: 30px;
  border: 1px solid var(--brand);
  border-radius: 6px;
  padding: 0 8px;
  font-size: 14px;
  width: 220px;
}
.eh-save {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-light);
  white-space: nowrap;
}
.eh-save.saving {
  color: var(--brand);
}
.eh-menu {
  display: flex;
  align-items: center;
  gap: 4px;
}
.eh-item {
  height: 32px;
  border-radius: 6px;
  color: var(--text-sub);
  padding: 0 6px;
  display: flex;
  align-items: center;
  font-size: 13px;
  transition: background 0.15s;
}
.eh-item:hover {
  background: #f0f1f3;
  color: var(--text-main);
}
.eh-onepage {
  padding: 0 10px;
  gap: 4px;
  font-weight: 500;
}
.eh-template {
  padding: 0 10px;
  gap: 4px;
  font-weight: 500;
  color: var(--brand);
  white-space: nowrap;
}
.eh-template:hover {
  background: var(--brand-light);
  color: var(--brand-hover, var(--brand));
}
.eh-download {
  margin-left: 8px;
  height: 34px;
  padding: 0 18px;
  border-radius: 17px;
  background: var(--brand);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}
.eh-download:hover {
  background: var(--brand-hover);
}
</style>
