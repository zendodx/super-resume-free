<script setup lang="ts">
import { computed, ref } from 'vue'
import { useResumeStore } from '@/store/resume'
import {
  FONT_FAMILIES,
  FONT_SIZES,
  LINE_SPACINGS,
  MODULE_SPACINGS,
  PAGE_BG_COLORS,
  PAGE_MARGINS,
  PAGE_PATTERNS,
} from '@/data/constants'
import SelectDropdown from './SelectDropdown.vue'
import ColorPickerPopover from './ColorPickerPopover.vue'
import type { DownloadFormat } from '@/utils/export'

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
const bgValue = computed({
  get: () => layout.pageBg ?? '#ffffff',
  set: (v: string) => store.updateLayout({ pageBg: v }),
})
const patternValue = computed({
  get: () => layout.pagePattern ?? 'none',
  set: (v) => store.updateLayout({ pagePattern: String(v) }),
})

const savedText = computed(() =>
  store.ui.saveState === 'saving' ? '保存中…' : `已保存 ${relativeTime(store.doc.updatedAt)}`,
)

// ---------- 导出菜单 ----------
const downloadMenuOpen = ref(false)
const EXPORT_OPTIONS: { fmt: DownloadFormat; label: string }[] = [
  { fmt: 'pdf', label: '导出 PDF' },
  { fmt: 'print', label: '浏览器打印 PDF' },
  { fmt: 'png', label: '导出图片 PNG' },
  { fmt: 'word', label: '导出 Word' },
  { fmt: 'md', label: '导出 Markdown' },
]
function pickFormat(fmt: DownloadFormat) {
  downloadMenuOpen.value = false
  store.requestDownload(fmt)
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟以前`
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ---------- 重置二次确认 ----------
const confirmReset = ref(false)
let confirmResetTimer: ReturnType<typeof setTimeout> | null = null
function onResetClick() {
  if (!confirmReset.value) {
    confirmReset.value = true
    // 3 秒内未确认自动恢复，避免误触后状态滞留
    if (confirmResetTimer) clearTimeout(confirmResetTimer)
    confirmResetTimer = setTimeout(() => (confirmReset.value = false), 3000)
    return
  }
  if (confirmResetTimer) clearTimeout(confirmResetTimer)
  confirmReset.value = false
  store.resetResume()
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
      <button
        class="eh-item"
        type="button"
        title="撤销 (Ctrl+Z)"
        :disabled="!store.canUndo"
        @click="store.undo()"
      >
        <Icon name="undo" :size="18" />
        <span class="eh-item-label">撤销</span>
      </button>
      <button
        class="eh-item"
        type="button"
        title="重做 (Ctrl+Shift+Z)"
        :disabled="!store.canRedo"
        @click="store.redo()"
      >
        <Icon name="redo" :size="18" />
        <span class="eh-item-label">重做</span>
      </button>
      <button class="eh-item" type="button" title="模块排序" @click="emit('openSort')">
        <Icon name="sort" :size="19" />
        <span class="eh-item-label">排序</span>
      </button>
      <div class="eh-item" title="字体">
        <span class="eh-item-label">字体</span>
        <SelectDropdown v-model="fontValue" :options="FONT_FAMILIES" width="96px" />
      </div>
      <div class="eh-item" title="字号">
        <span class="eh-item-label">字号</span>
        <SelectDropdown v-model="sizeValue" :options="FONT_SIZES" width="52px" />
      </div>
      <div class="eh-item" title="行距">
        <span class="eh-item-label">行距</span>
        <SelectDropdown v-model="lineHeightValue" :options="LINE_SPACINGS" width="52px" />
      </div>
      <div class="eh-item" title="模块间距">
        <span class="eh-item-label">间距</span>
        <SelectDropdown v-model="moduleSpacingValue" :options="MODULE_SPACINGS" width="52px" />
      </div>
      <div class="eh-item" title="页边距">
        <span class="eh-item-label">边距</span>
        <SelectDropdown v-model="marginValue" :options="PAGE_MARGINS" width="60px" />
      </div>
      <div class="eh-item" title="主题色">
        <span class="eh-item-label">主题色</span>
        <ColorPickerPopover v-model="colorValue" />
      </div>
      <div class="eh-item" title="页面背景色">
        <span class="eh-item-label">背景色</span>
        <ColorPickerPopover v-model="bgValue" :colors="PAGE_BG_COLORS" title="页面背景色" />
      </div>
      <div class="eh-item" title="背景花纹">
        <span class="eh-item-label">花纹</span>
        <SelectDropdown v-model="patternValue" :options="PAGE_PATTERNS" width="62px" />
      </div>
      <button
        v-if="!confirmReset"
        class="eh-item"
        type="button"
        title="重置为示例简历"
        @click="onResetClick"
      >
        <Icon name="reset" :size="19" />
        <span class="eh-item-label">重置</span>
      </button>
      <div v-else class="eh-item eh-reset-confirm">
        <span class="eh-reset-text">重置为示例简历？</span>
        <button class="eh-reset-yes" type="button" @click="onResetClick">确定</button>
        <button class="eh-reset-no" type="button" @click="confirmReset = false">取消</button>
      </div>
<div class="eh-dd">
<div v-if="downloadMenuOpen" class="eh-dd-mask" @click="downloadMenuOpen = false" />
<button class="eh-download" type="button" :disabled="store.ui.downloading" @click.stop="downloadMenuOpen = !downloadMenuOpen">
<Icon name="download" :size="18" />
{{ store.ui.downloading ? '生成中…' : '下载' }}
<Icon name="chevron-down" :size="13" />
</button>
<div v-if="downloadMenuOpen" class="eh-dd-menu">
<button
v-for="opt in EXPORT_OPTIONS"
:key="opt.fmt"
class="eh-dd-item"
type="button"
@click="pickFormat(opt.fmt)"
>
<Icon name="save" :size="15" />
{{ opt.label }}
</button>
</div>
</div>
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
.eh-item:disabled {
  opacity: 0.35;
  cursor: default;
}
.eh-item:disabled:hover {
  background: transparent;
  color: var(--text-sub);
}
/* 操作名称标签：默认展示，弱化颜色不抢控件主体 */
.eh-item-label {
  font-size: 12px;
  color: var(--text-light);
  margin-left: 2px;
  white-space: nowrap;
}
.eh-item:hover .eh-item-label {
  color: var(--text-sub);
}
/* 窄屏时隐藏名称标签，回退为纯图标/控件（tooltip 仍可用） */
@media (max-width: 1360px) {
  .eh-item-label {
    display: none;
  }
}
/* ---------- 重置二次确认 ---------- */
.eh-reset-confirm {
  gap: 6px;
  background: #fdeeee;
}
.eh-reset-confirm:hover {
  background: #fdeeee;
}
.eh-reset-text {
  font-size: 12px;
  color: var(--danger);
  white-space: nowrap;
}
.eh-reset-yes,
.eh-reset-no {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
.eh-reset-yes {
  background: var(--danger);
  color: #fff;
}
.eh-reset-yes:hover {
  opacity: 0.85;
}
.eh-reset-no {
  border: 1px solid var(--border);
  color: var(--text-sub);
}
.eh-reset-no:hover {
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
.eh-download:disabled {
  opacity: 0.7;
  cursor: default;
}
/* ---------- 导出格式下拉 ---------- */
.eh-dd {
  position: relative;
}
.eh-dd-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
}
.eh-dd-menu {
  position: absolute;
  top: 40px;
  right: 0;
  z-index: 201;
  min-width: 150px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
}
.eh-dd-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 5px;
  font-size: 13px;
  color: var(--text-main);
  text-align: left;
  white-space: nowrap;
  transition: background 0.12s;
}
.eh-dd-item:hover {
  background: #f0f1f3;
}
.eh-dd-item .icon {
  color: var(--text-light);
}
</style>
