<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLibraryStore, type ResumeRecord } from '@/store/library'
import { useResumeStore } from '@/store/resume'
import { formatEditTime } from '@/utils/doc'
import { downloadJson, dateStamp } from '@/utils/file'
import { loadGistConfig, saveGistConfig } from '@/utils/github'
import DocThumb from './DocThumb.vue'
import GistSyncDialog from './GistSyncDialog.vue'
import JsonTextDialog from './JsonTextDialog.vue'

const emit = defineEmits<{
  (e: 'open', id: string, opts?: { download?: boolean }): void
  (e: 'create'): void
}>()

const lib = useLibraryStore()
const editor = useResumeStore()

type Tab = 'mine' | 'trash'
const tab = ref<Tab>('mine')

const shownList = computed(() => (tab.value === 'trash' ? lib.trashRecords : lib.activeRecords))

// ---------- 操作菜单 ----------
const menuFor = ref<string | null>(null)
const renaming = ref<ResumeRecord | null>(null)
const renameInput = ref('')

function openMenu(id: string) {
  menuFor.value = menuFor.value === id ? null : id
}
function closeMenu() {
  menuFor.value = null
}

function actDuplicate(id: string) {
  lib.duplicateResume(id)
  closeMenu()
}

function actDownload(rec: ResumeRecord) {
  closeMenu()
  emit('open', rec.id, { download: true })
}

/** 导出单个简历为 JSON 文件 */
function actExport(rec: ResumeRecord) {
  closeMenu()
  downloadJson(`${rec.doc.name || '简历'}-${dateStamp()}.json`, rec.doc)
}

/** 复制单个简历 JSON 文本 */
function actCopyJson(rec: ResumeRecord) {
  closeMenu()
  openExportText(`${rec.doc.name || '简历'}`, JSON.stringify(rec.doc, null, 2))
}

function actRename(rec: ResumeRecord) {
  closeMenu()
  renaming.value = rec
  renameInput.value = rec.doc.name
}

function commitRename() {
  if (renaming.value) {
    const id = renaming.value.id
    lib.renameResume(id, renameInput.value)
    // 若改名的是编辑器当前绑定的记录，同步编辑器文档名称
    if (editor.getBoundId() === id) editor.syncBoundName(renameInput.value)
  }
  renaming.value = null
}

function actDelete(id: string) {
  closeMenu()
  lib.deleteResume(id)
}

function actRestore(id: string) {
  closeMenu()
  lib.restoreResume(id)
}

function actDestroy(id: string) {
  closeMenu()
  if (window.confirm('彻底删除后无法恢复，确定删除这份简历吗？')) {
    lib.destroyResume(id)
  }
}

// ---------- 导入 / 导出 ----------
const fileInput = ref<HTMLInputElement>()

function importFromFile() {
  closeMenus()
  fileInput.value?.click()
}

function importFromPaste() {
  closeMenus()
  jsonImportVisible.value = true
}

/** 解析导入数据（整包备份优先，其次单份简历），成功返回 true */
function importJsonData(data: unknown): boolean {
  const backupCount = lib.importBackup(data)
  if (backupCount > 0) return true
  const id = lib.importResume(data)
  return Boolean(id)
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    if (importJsonData(data)) showToast('导入成功')
    else window.alert('导入失败：文件不是有效的简历或备份 JSON')
  } catch {
    window.alert('导入失败：文件解析出错')
  }
}

function onImportPaste(text: string) {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    window.alert('导入失败：JSON 格式错误')
    return
  }
  if (importJsonData(data)) {
    jsonImportVisible.value = false
    showToast('导入成功')
  } else {
    window.alert('导入失败：不是有效的简历或备份 JSON')
  }
}

/** 导出全部简历（含回收站）为备份包 JSON 文件 */
function exportAll() {
  closeMenus()
  if (lib.activeRecords.length === 0 && lib.trashRecords.length === 0) {
    window.alert('暂无简历可导出')
    return
  }
  downloadJson(`简历备份-${dateStamp()}.json`, lib.exportBackup())
}

/** 复制全部简历备份 JSON 文本 */
function copyAll() {
  closeMenus()
  if (lib.activeRecords.length === 0 && lib.trashRecords.length === 0) {
    window.alert('暂无简历可导出')
    return
  }
  openExportText('全部简历备份', JSON.stringify(lib.exportBackup(), null, 2))
}

// ---------- JSON 文本弹窗与轻提示 ----------
const jsonImportVisible = ref(false)
const exportTextTitle = ref('')
const exportText = ref('')
const exportTextVisible = ref(false)

function openExportText(title: string, json: string) {
  exportTextTitle.value = title
  exportText.value = json
  exportTextVisible.value = true
}

const toastMsg = ref('')
let toastTimer: number | undefined
function showToast(msg: string) {
  toastMsg.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastMsg.value = ''
  }, 2000)
}

// ---------- 顶部下拉 ----------
const importMenuOpen = ref(false)
const exportMenuOpen = ref(false)

function toggleImportMenu() {
  importMenuOpen.value = !importMenuOpen.value
  exportMenuOpen.value = false
}
function toggleExportMenu() {
  exportMenuOpen.value = !exportMenuOpen.value
  importMenuOpen.value = false
}
function closeMenus() {
  importMenuOpen.value = false
  exportMenuOpen.value = false
  closeMenu()
}


const lastSyncText = ref('')
{
  const c = loadGistConfig()
  if (c.lastSyncAt) {
    const d = new Date(c.lastSyncAt)
    lastSyncText.value = `${c.lastSyncDir === 'down' ? '下载' : '同步'} ${d.getMonth() + 1}月${d.getDate()}日`
  }
}
const gistDialogVisible = ref(false)

function openGistDialog() {
  const c = loadGistConfig()
  saveGistConfig(c) // 保持不变，仅统一读写入口
  gistDialogVisible.value = true
}

// ---------- 点击空白关闭菜单 ----------
function onBodyClick() {
  closeMenus()
}
</script>

<template>
  <div class="rl" @click="onBodyClick">
    <!-- 顶部：tab + 操作按钮 -->
    <header class="rl-head">
      <nav class="rl-tabs">
        <button
          class="rl-tab"
          :class="{ active: tab === 'mine' }"
          type="button"
          @click="tab = 'mine'"
        >
          我的简历 <span class="rl-tab-count">({{ lib.activeRecords.length }})</span>
        </button>
        <button
          class="rl-tab"
          :class="{ active: tab === 'trash' }"
          type="button"
          @click="tab = 'trash'"
        >
          回收站 <span v-if="lib.trashRecords.length" class="rl-tab-count">({{ lib.trashRecords.length }})</span>
        </button>
      </nav>
      <div class="rl-actions">
        <button class="btn rl-sync" type="button" @click="openGistDialog">
          <Icon name="check-circle" :size="15" />
          云同步<span v-if="lastSyncText" class="rl-sync-time">{{ lastSyncText }}</span>
        </button>
        <div class="rl-dd">
          <button class="btn rl-export-all" type="button" @click.stop="toggleExportMenu">
            <Icon name="save" :size="15" />
            导出全部
            <Icon name="chevron-down" :size="13" />
          </button>
          <div v-if="exportMenuOpen" class="rl-dd-menu">
            <button class="rl-menu-item" type="button" @click="exportAll">
              <Icon name="save" :size="16" />
              导出为 JSON 文件
            </button>
            <button class="rl-menu-item" type="button" @click="copyAll">
              <Icon name="copy" :size="16" />
              复制全部 JSON
            </button>
          </div>
        </div>
        <div class="rl-dd">
          <button class="btn rl-import" type="button" @click.stop="toggleImportMenu">
            <Icon name="upload" :size="15" />
            导入简历
            <Icon name="chevron-down" :size="13" />
          </button>
          <div v-if="importMenuOpen" class="rl-dd-menu">
            <button class="rl-menu-item" type="button" @click="importFromFile">
              <Icon name="upload" :size="16" />
              从 JSON 文件导入
            </button>
            <button class="rl-menu-item" type="button" @click="importFromPaste">
              <Icon name="edit" :size="16" />
              粘贴 JSON 导入
            </button>
          </div>
        </div>
        <button class="btn btn-primary rl-create" type="button" @click="emit('create')">
          <Icon name="add" :size="15" />
          新建简历
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          style="display: none"
          @change="onImportFile"
        />
      </div>
    </header>

    <!-- 列表为空 -->
    <div v-if="shownList.length === 0" class="rl-empty">
      <Icon :name="tab === 'trash' ? 'delete' : 'edit'" :size="44" />
      <p>{{ tab === 'trash' ? '回收站为空' : '暂无简历' }}</p>
      <button v-if="tab === 'mine'" class="btn btn-primary" type="button" @click="emit('create')">
        <Icon name="add" :size="15" />
        新建第一份简历
      </button>
    </div>

    <!-- 简历卡片网格 -->
    <div v-else class="rl-grid">
      <div v-for="rec in shownList" :key="rec.id" class="rl-card">
        <div class="rl-card-thumb" @click="tab !== 'trash' && emit('open', rec.id)">
          <DocThumb :doc="rec.doc" />

          <!-- 左上角操作按钮 -->
          <button class="rl-more" type="button" title="操作" @click.stop="openMenu(rec.id)">
            <Icon name="more" :size="18" />
          </button>

          <!-- 操作菜单 -->
          <div v-if="menuFor === rec.id" class="rl-menu" @click.stop>
            <template v-if="tab !== 'trash'">
              <button class="rl-menu-item" type="button" @click="actDuplicate(rec.id)">
                <Icon name="copy" :size="16" />
                复制简历
              </button>
              <button class="rl-menu-item" type="button" @click="actDownload(rec)">
                <Icon name="download" :size="16" />
                下载简历
              </button>
              <button class="rl-menu-item" type="button" @click="actExport(rec)">
                <Icon name="save" :size="16" />
                导出简历
              </button>
              <button class="rl-menu-item" type="button" @click="actCopyJson(rec)">
                <Icon name="copy" :size="16" />
                复制 JSON
              </button>
              <button class="rl-menu-item" type="button" @click="actRename(rec)">
                <Icon name="edit" :size="16" />
                修改名称
              </button>
              <button class="rl-menu-item danger" type="button" @click="actDelete(rec.id)">
                <Icon name="delete" :size="16" />
                删除简历
              </button>
            </template>
            <template v-else>
              <button class="rl-menu-item" type="button" @click="actRestore(rec.id)">
                <Icon name="restore" :size="16" />
                恢复简历
              </button>
              <button class="rl-menu-item danger" type="button" @click="actDestroy(rec.id)">
                <Icon name="delete" :size="16" />
                彻底删除
              </button>
            </template>
          </div>
        </div>

        <div class="rl-card-meta">
          <span class="rl-card-time">最后编辑于：{{ formatEditTime(rec.doc.updatedAt) }}</span>
        </div>
        <div class="rl-card-name" :title="rec.doc.name">{{ rec.doc.name }}</div>
      </div>
    </div>

    <GistSyncDialog v-if="gistDialogVisible" @close="gistDialogVisible = false" />

    <JsonTextDialog
      v-if="jsonImportVisible"
      mode="import"
      title="粘贴 JSON 导入"
      @close="jsonImportVisible = false"
      @import="onImportPaste"
    />
    <JsonTextDialog
      v-if="exportTextVisible"
      mode="export"
      :title="`导出 JSON 文本 - ${exportTextTitle}`"
      :text="exportText"
      @close="exportTextVisible = false"
      @copied="showToast('JSON 已复制到剪贴板')"
    />

    <!-- 轻提示 -->
    <Transition name="toast-fade">
      <div v-if="toastMsg" class="rl-toast">
        <Icon name="check-circle" :size="16" />
        {{ toastMsg }}
      </div>
    </Transition>

    <!-- 重命名弹窗 -->
    <div v-if="renaming" class="modal-mask" @click.self="renaming = null">
      <div class="modal" style="min-width: 360px">
        <div class="modal-header">
          修改名称
          <button class="rl-modal-close" type="button" @click="renaming = null">
            <Icon name="close" :size="18" />
          </button>
        </div>
        <div class="modal-body">
          <input
            v-model="renameInput"
            class="form-input"
            placeholder="请输入简历名称"
            @keyup.enter="commitRename"
          />
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" type="button" @click="renaming = null">取消</button>
          <button class="btn btn-primary" type="button" @click="commitRename">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rl {
  height: 100%;
  overflow-y: auto;
  background: var(--bg-page);
  padding: 0 40px 40px;
  box-sizing: border-box;
}

/* ---------- 顶部 ---------- */
.rl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 0 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.rl-tabs {
  display: flex;
  gap: 32px;
}
.rl-tab {
  font-size: 17px;
  color: var(--text-sub);
  padding: 4px 2px 10px;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.rl-tab:hover {
  color: var(--text-main);
}
.rl-tab.active {
  color: var(--brand);
  font-weight: 600;
  border-bottom-color: var(--brand);
}
.rl-tab-count {
  font-size: 14px;
  font-weight: 500;
}
.rl-actions {
  display: flex;
  gap: 12px;
}
.rl-import {
  border: 1px solid var(--brand);
  color: var(--brand);
  background: #fff;
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
}
.rl-import:hover {
  background: var(--brand-light);
}
.rl-sync {
  border: 1px solid var(--border);
  color: var(--text-sub);
  background: #fff;
  height: 36px;
  padding: 0 14px;
  font-size: 14px;
}
.rl-sync:hover {
  color: var(--brand);
  border-color: var(--brand);
}
.rl-sync-time {
  font-size: 12px;
  color: var(--text-light);
  margin-left: 6px;
}
.rl-export-all {
  border: 1px solid var(--border);
  color: var(--text-sub);
  background: #fff;
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
}
.rl-export-all:hover {
  color: var(--brand);
  border-color: var(--brand);
}
.rl-create {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
}

/* ---------- 顶部下拉 ---------- */
.rl-dd {
  position: relative;
}
.rl-dd .btn {
  display: flex;
  align-items: center;
  gap: 6px;
}
.rl-dd .btn .icon:last-child {
  color: var(--text-light);
}
.rl-dd-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 170px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
  padding: 6px;
  z-index: 30;
  animation: rlMenuIn 0.12s ease;
}

/* ---------- 轻提示 ---------- */
.rl-toast {
  position: fixed;
  left: 50%;
  bottom: 48px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(17, 24, 39, 0.88);
  color: #fff;
  font-size: 13px;
  padding: 10px 18px;
  border-radius: 999px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  z-index: 100;
  pointer-events: none;
}
.rl-toast .icon {
  color: #34d399;
}
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* ---------- 网格 ---------- */
.rl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}
.rl-card {
  display: flex;
  flex-direction: column;
}
.rl-card-thumb {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.15s;
}
.rl-card-thumb:hover {
  border-color: var(--brand);
  box-shadow: 0 6px 20px rgba(20, 181, 138, 0.15);
}
.rl-more {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border);
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  opacity: 0;
  transition: all 0.15s;
  z-index: 2;
}
.rl-card-thumb:hover .rl-more,
.rl-more:has(+ .rl-menu) {
  opacity: 1;
}
.rl-more:hover {
  color: var(--brand);
  border-color: var(--brand);
}

/* ---------- 操作菜单 ---------- */
.rl-menu {
  position: absolute;
  right: 8px;
  top: 44px;
  min-width: 150px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
  padding: 6px;
  z-index: 10;
  animation: rlMenuIn 0.12s ease;
}
.rl-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--text-main);
  text-align: left;
  transition: background 0.12s;
}
.rl-menu-item:hover {
  background: #f2f3f5;
}
.rl-menu-item.danger {
  color: var(--danger);
}
.rl-menu-item.danger:hover {
  background: #fdf0f0;
}

/* ---------- 卡片信息 ---------- */
.rl-card-meta {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-light);
}
.rl-card-name {
  margin-top: 3px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 空态 ---------- */
.rl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 140px 0;
  color: var(--text-light);
}
.rl-empty p {
  font-size: 15px;
  color: var(--text-sub);
}
.rl-empty-sub {
  font-size: 13px !important;
  color: var(--text-light) !important;
}

.rl-modal-close {
  color: var(--text-light);
  display: flex;
}
.rl-modal-close:hover {
  color: var(--text-main);
}

@keyframes rlMenuIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
