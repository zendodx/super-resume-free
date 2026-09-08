import { defineStore } from 'pinia'
import { computed, reactive, watch } from 'vue'
import type { ResumeDoc } from '@/types/resume'
import { uid } from '@/data/constants'
import { createDefaultResume } from '@/data/defaultResume'
import { cloneDoc, isValidDoc, normalizeDoc } from '@/utils/doc'

/** 库中的一条简历记录 */
export interface ResumeRecord {
  id: string
  doc: ResumeDoc
  /** 回收站删除时间；null 表示在「我的简历」中 */
  deletedAt: number | null
}

const LIB_KEY = 'super-resume-free:library'
const LEGACY_KEY = 'super-resume-free:doc'

function loadLibrary(): { records: ResumeRecord[]; currentId: string | null } {
  try {
    // 1. 新格式
    const raw = localStorage.getItem(LIB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { records: ResumeRecord[]; currentId: string | null }
      if (parsed && Array.isArray(parsed.records) && parsed.records.length) {
        for (const r of parsed.records) r.doc = normalizeDoc(r.doc)
        return { records: parsed.records, currentId: parsed.currentId ?? parsed.records[0].id }
      }
    }
    // 2. 迁移旧单文档数据
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const doc = JSON.parse(legacy) as ResumeDoc
      if (isValidDoc(doc)) {
        const rec: ResumeRecord = { id: uid(), doc: normalizeDoc(doc), deletedAt: null }
        localStorage.removeItem(LEGACY_KEY)
        return { records: [rec], currentId: rec.id }
      }
    }
  } catch {
    /* 数据异常则从头开始 */
  }
  // 3. 首次使用：内置一份默认简历
  const rec: ResumeRecord = { id: uid(), doc: createDefaultResume(), deletedAt: null }
  return { records: [rec], currentId: rec.id }
}

export const useLibraryStore = defineStore('library', () => {
  const loaded = loadLibrary()
  const records = reactive<ResumeRecord[]>(loaded.records)
  const state = reactive({ currentId: loaded.currentId })

  // ---------- 查询 ----------
  /** 我的简历（未删除），最近编辑在前 */
  const activeRecords = computed(() =>
    records.filter((r) => !r.deletedAt).sort((a, b) => b.doc.updatedAt - a.doc.updatedAt),
  )
  /** 回收站，最近删除在前 */
  const trashRecords = computed(() =>
    records.filter((r) => r.deletedAt).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0)),
  )
  const currentRecord = computed(
    () => records.find((r) => r.id === state.currentId && !r.deletedAt) ?? null,
  )

  function getRecord(id: string): ResumeRecord | undefined {
    return records.find((r) => r.id === id)
  }

  // ---------- 持久化 ----------
  function persist() {
    localStorage.setItem(
      LIB_KEY,
      JSON.stringify({ records, currentId: state.currentId }),
    )
  }
  watch([records, state], persist, { deep: true })

  // ---------- 操作 ----------
  /** 新建简历，返回 id；setCurrent=false 时保持当前记录不变（用于复制/导入） */
  function createResume(patch?: Partial<ResumeDoc>, setCurrent = true): string {
    const rec: ResumeRecord = {
      id: uid(),
      doc: Object.assign(createDefaultResume(), { updatedAt: Date.now() }, patch),
      deletedAt: null,
    }
    records.push(rec)
    if (setCurrent) state.currentId = rec.id
    return rec.id
  }

  /** 复制简历，返回新简历 id */
  function duplicateResume(id: string): string | null {
    const src = getRecord(id)
    if (!src) return null
    const doc = cloneDoc(src.doc)
    doc.name = `${src.doc.name} 副本`
    doc.updatedAt = Date.now()
    return createResume(doc, false)
  }

  /** 修改简历名称 */
  function renameResume(id: string, name: string) {
    const rec = getRecord(id)
    if (!rec) return
    const trimmed = name.trim()
    if (trimmed) rec.doc.name = trimmed
    rec.doc.updatedAt = Date.now()
  }

  /** 移入回收站 */
  function deleteResume(id: string) {
    const rec = getRecord(id)
    if (!rec || rec.deletedAt) return
    rec.deletedAt = Date.now()
    if (state.currentId === id) {
      state.currentId = records.find((r) => !r.deletedAt)?.id ?? null
    }
  }

  /** 从回收站恢复 */
  function restoreResume(id: string) {
    const rec = getRecord(id)
    if (!rec?.deletedAt) return
    rec.deletedAt = null
    rec.doc.updatedAt = Date.now()
  }

  /** 回收站中彻底删除 */
  function destroyResume(id: string) {
    const i = records.findIndex((r) => r.id === id)
    if (i >= 0) records.splice(i, 1)
    if (state.currentId === id) {
      state.currentId = records.find((r) => !r.deletedAt)?.id ?? null
    }
  }

  /** 导入简历（来自 JSON 内容），返回新简历 id；失败返回 null */
  function importResume(data: unknown): string | null {
    if (!isValidDoc(data)) return null
    const doc = normalizeDoc(cloneDoc(data as ResumeDoc))
    doc.updatedAt = Date.now()
    return createResume(doc, false)
  }

  /** 将内容写回指定记录（编辑器保存时调用，id 为编辑器绑定的记录） */
  function writeBack(id: string, doc: ResumeDoc) {
    const rec = getRecord(id)
    if (!rec || rec.deletedAt) return
    rec.doc = cloneDoc(doc)
  }

  /** 切换当前简历 */
  function setCurrent(id: string) {
    if (getRecord(id) && !getRecord(id)?.deletedAt) state.currentId = id
  }

  return {
    state,
    activeRecords,
    trashRecords,
    currentRecord,
    getRecord,
    createResume,
    duplicateResume,
    renameResume,
    deleteResume,
    restoreResume,
    destroyResume,
    importResume,
    writeBack,
    setCurrent,
  }
})
