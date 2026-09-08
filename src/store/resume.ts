import { defineStore } from 'pinia'
import { computed, reactive, watch } from 'vue'
import type {
  LayoutSettings,
  ModuleType,
  ProfileField,
  ResumeDoc,
  ResumeItem,
  ResumeModule,
} from '@/types/resume'
import { createDefaultResume } from '@/data/defaultResume'
import { MODULE_SCHEMAS, uid } from '@/data/constants'
import { getTemplate } from '@/templates'

const STORAGE_KEY = 'super-resume-free:doc'

function loadDoc(): ResumeDoc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ResumeDoc
      if (parsed && Array.isArray(parsed.modules) && parsed.layout) {
        // 兼容旧数据：补默认模板字段
        if (!parsed.templateId || !getTemplate(parsed.templateId)) parsed.templateId = 'rec-classic'
        if (!parsed.titleStyle) parsed.titleStyle = 'underline'
        if (!parsed.profileStyle) parsed.profileStyle = 'left'
        if (!parsed.pageStyle) parsed.pageStyle = 'single'
        return parsed
      }
    }
  } catch {
    /* ignore corrupted data */
  }
  return createDefaultResume()
}

export const useResumeStore = defineStore('resume', () => {
  const doc = reactive<ResumeDoc>(loadDoc())

  /** UI 状态（不持久化） */
  const ui = reactive({
    collapsedModules: new Set<string>(), // 左侧面板中折叠的模块 id
    saveState: 'saved' as 'saved' | 'saving',
    onePageSignal: 0, // 智能一页请求信号
    downloadSignal: 0,
  })

  // ---------- 持久化 ----------
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    doc,
    () => {
      ui.saveState = 'saving'
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        doc.updatedAt = Date.now()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
        ui.saveState = 'saved'
      }, 600)
    },
    { deep: true },
  )

  // ---------- getters ----------
  const visibleModules = computed(() => doc.modules.filter((m) => !m.hidden))
  const pageCount = computed(() => Math.max(1, doc.modules.length))

  // ---------- 简历元信息 ----------
  function setResumeName(name: string) {
    doc.name = name
  }

  // ---------- 模块操作 ----------
  function addModule(type: Exclude<ModuleType, 'profile'>, title?: string) {
    const catalog: Record<string, string> = {
      personal_summary: '个人总结',
      educations: '教育经历',
      works: '工作经历',
      internships: '实习经历',
      projects: '项目经历',
      orgs: '社团和组织经历',
      skills: '技能',
      awards: '荣誉奖项',
      certificates: '资格证书',
      custom: '自定义模块',
    }
    const m: ResumeModule = {
      id: uid(),
      type,
      title: title?.trim() || catalog[type] || '自定义模块',
      hidden: false,
      items: [createItem(type)],
    }
    // 教育经历默认插在工作经历之前；其余追加到末尾
    const insertBefore =
      type === 'educations'
        ? doc.modules.findIndex((x) => ['works', 'internships'].includes(x.type))
        : -1
    if (insertBefore >= 0) doc.modules.splice(insertBefore, 0, m)
    else doc.modules.push(m)
    return m.id
  }

  function removeModule(id: string) {
    const i = doc.modules.findIndex((m) => m.id === id)
    if (i >= 0) doc.modules.splice(i, 1)
  }

  function toggleModuleHidden(id: string) {
    const m = doc.modules.find((x) => x.id === id)
    if (m) m.hidden = !m.hidden
  }

  function renameModule(id: string, title: string) {
    const m = doc.modules.find((x) => x.id === id)
    if (m) m.title = title.trim() || m.title
  }

  function moveModule(id: string, dir: -1 | 1) {
    const i = doc.modules.findIndex((m) => m.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= doc.modules.length) return
    const [m] = doc.modules.splice(i, 1)
    doc.modules.splice(j, 0, m)
  }

  function setModuleOrder(orderedIds: string[]) {
    doc.modules.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
  }

  function toggleCollapsed(id: string) {
    if (ui.collapsedModules.has(id)) ui.collapsedModules.delete(id)
    else ui.collapsedModules.add(id)
  }

  // ---------- 条目操作 ----------
  function createItem(type: ModuleType): ResumeItem {
    const fields: Record<string, string> = {}
    if (type !== 'profile' && type !== 'personal_summary') {
      for (const f of MODULE_SCHEMAS[type]) fields[f.key] = ''
    }
    return { id: uid(), fields, desc: type === 'personal_summary' ? [''] : [] }
  }

  function getModule(id: string): ResumeModule | undefined {
    return doc.modules.find((m) => m.id === id)
  }

  function addItem(moduleId: string) {
    const m = getModule(moduleId)
    if (!m) return
    m.items.push(createItem(m.type))
    ui.collapsedModules.delete(moduleId)
  }

  function removeItem(moduleId: string, itemId: string) {
    const m = getModule(moduleId)
    if (!m) return
    const i = m.items.findIndex((x) => x.id === itemId)
    if (i >= 0) m.items.splice(i, 1)
  }

  function moveItem(moduleId: string, itemId: string, dir: -1 | 1) {
    const m = getModule(moduleId)
    if (!m) return
    const i = m.items.findIndex((x) => x.id === itemId)
    const j = i + dir
    if (i < 0 || j < 0 || j >= m.items.length) return
    const [item] = m.items.splice(i, 1)
    m.items.splice(j, 0, item)
  }

  function updateItemField(moduleId: string, itemId: string, key: string, value: string) {
    const m = getModule(moduleId)
    const item = m?.items.find((x) => x.id === itemId)
    if (item) item.fields[key] = value
  }

  function updateItemDesc(moduleId: string, itemId: string, desc: string[]) {
    const m = getModule(moduleId)
    const item = m?.items.find((x) => x.id === itemId)
    if (item) item.desc = desc
  }

  // ---------- 个人信息 ----------
  function updateProfile(patch: Partial<ResumeDoc['profile']>) {
    Object.assign(doc.profile, patch)
  }

  function addProfileField(label: string) {
    doc.profile.contacts.push({ id: uid(), label, value: '' })
  }

  function updateProfileField(id: string, patch: Partial<ProfileField>) {
    const f = doc.profile.contacts.find((x) => x.id === id)
    if (f) Object.assign(f, patch)
  }

  function removeProfileField(id: string) {
    const i = doc.profile.contacts.findIndex((x) => x.id === id)
    if (i >= 0) doc.profile.contacts.splice(i, 1)
  }

  // ---------- 排版 ----------
  function updateLayout(patch: Partial<LayoutSettings>) {
    Object.assign(doc.layout, patch)
  }

  /** 切换模板：仅替换样式，不影响内容 */
  function applyTemplate(templateId: string) {
    const t = getTemplate(templateId)
    if (!t) return
    doc.templateId = t.id
    doc.titleStyle = t.titleStyle
    doc.profileStyle = t.profileStyle
    doc.pageStyle = t.pageStyle
    Object.assign(doc.layout, t.layout)
  }

  /** 当前模板的专属样式类名 */
  const templateClass = computed(() => getTemplate(doc.templateId)?.className ?? '')
  const templateName = computed(() => getTemplate(doc.templateId)?.name ?? '')

  function resetResume() {
    localStorage.removeItem(STORAGE_KEY)
    const fresh = createDefaultResume()
    Object.assign(doc, fresh)
  }

  function requestOnePage() {
    ui.onePageSignal++
  }

  function requestDownload() {
    ui.downloadSignal++
  }

  return {
    doc,
    ui,
    visibleModules,
    pageCount,
    templateClass,
    templateName,
    setResumeName,
    addModule,
    removeModule,
    toggleModuleHidden,
    renameModule,
    moveModule,
    setModuleOrder,
    toggleCollapsed,
    getModule,
    addItem,
    removeItem,
    moveItem,
    updateItemField,
    updateItemDesc,
    updateProfile,
    addProfileField,
    updateProfileField,
    removeProfileField,
    updateLayout,
    applyTemplate,
    resetResume,
    requestOnePage,
    requestDownload,
  }
})
