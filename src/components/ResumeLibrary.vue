<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLibraryStore, type ResumeRecord } from '@/store/library'
import { useResumeStore } from '@/store/resume'
import { formatEditTime } from '@/utils/doc'
import { downloadJson, dateStamp } from '@/utils/file'
import DocThumb from './DocThumb.vue'

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

/** 导出单个简历为 JSON */
function actExport(rec: ResumeRecord) {
  closeMenu()
  downloadJson(`${rec.doc.name || '简历'}-${dateStamp()}.json`, rec.doc)
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

// ---------- 导入简历 ----------
const fileInput = ref<HTMLInputElement>()

function triggerImport() {
  fileInput.value?.click()
}

/** 导出全部简历（含回收站）为备份包 */
function exportAll() {
  if (lib.activeRecords.length === 0 && lib.trashRecords.length === 0) {
    window.alert('暂无简历可导出')
    return
  }
  downloadJson(`简历备份-${dateStamp()}.json`, lib.exportBackup())
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    // 优先识别整包备份，其次单份简历
    const backupCount = lib.importBackup(data)
    if (backupCount > 0) return
    const id = lib.importResume(data)
    if (!id) window.alert('导入失败：文件不是有效的简历或备份 JSON')
  } catch {
    window.alert('导入失败：文件解析出错')
  }
}

// ---------- 点击空白关闭菜单 ----------
function onBodyClick() {
  closeMenu()
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
        <button class="btn rl-export-all" type="button" @click="exportAll">
          <Icon name="save" :size="15" />
          导出全部
        </button>
        <button class="btn rl-import" type="button" @click="triggerImport">
          <Icon name="upload" :size="15" />
          导入简历
        </button>
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
