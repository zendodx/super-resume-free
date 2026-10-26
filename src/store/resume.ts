import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
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
import { useLibraryStore } from '@/store/library'
import { cloneDoc } from '@/utils/doc'
import type { DownloadFormat } from '@/utils/export'

export const useResumeStore = defineStore('resume', () => {
  const lib = useLibraryStore()
  const doc = reactive<ResumeDoc>(
    cloneDoc(lib.currentRecord?.doc ?? createDefaultResume()),
  )

  /** UI 状态（不持久化） */
  const ui = reactive({
    collapsedModules: new Set<string>(), // 左侧面板中折叠的模块 id
    saveState: 'saved' as 'saved' | 'saving',
    onePageSignal: 0, // 智能一页请求信号
    downloadSignal: 0,
    downloading: false, // 正在生成导出文件
    downloadFormat: 'pdf' as DownloadFormat, // 本次导出格式
  })

  // ---------- 持久化（写回简历库中绑定的记录） ----------
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let silentMutation = false // flushSave 自身写入 updatedAt 时抑制 watcher，避免无限保存循环
  /** 编辑器当前绑定（正在编辑）的简历记录 id */
  let boundId: string | null = lib.state.currentId

  /** 立即将当前文档写回简历库绑定记录 */
  function flushSave() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (!boundId) return
    silentMutation = true
    // updatedAt 是保存行为产生的时间戳变动，不应进入撤销历史（否则会清空重做栈）
    suppressHistory = true
    doc.updatedAt = Date.now()
    setTimeout(() => (suppressHistory = false), 0)
    lib.writeBack(boundId, doc)
    ui.saveState = 'saved'
  }

  watch(
    doc,
    () => {
      if (silentMutation) {
        silentMutation = false
        return
      }
      ui.saveState = 'saving'
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(flushSave, 600)
    },
    { deep: true, flush: 'sync' },
  )

  /**
   * 就地替换文档内容。
   * 注意：不能用 Object.assign(doc, snap) 整体替换——profile/layout/modules 的
   * 引用会被换掉，而组件（如 ProfileForm/EditorHeader）在 setup 中捕获了旧引用，
   * 之后界面会操作已脱离文档的旧对象，表现为“数据变了但界面不变”。
   */
  function replaceDocContent(snap: ResumeDoc) {
    doc.name = snap.name
    doc.templateId = snap.templateId
    doc.titleStyle = snap.titleStyle
    doc.profileStyle = snap.profileStyle
    doc.pageStyle = snap.pageStyle
    doc.updatedAt = snap.updatedAt
    Object.assign(doc.profile, snap.profile)
    Object.assign(doc.layout, snap.layout)
    doc.modules.splice(0, doc.modules.length, ...snap.modules)
  }

  /** 打开另一份简历进行编辑 */
  function openResume(id: string) {
    flushSave()
    lib.setCurrent(id)
    boundId = id
    const rec = lib.currentRecord
    if (rec) {
      restoring = true
      replaceDocContent(cloneDoc(rec.doc))
      setTimeout(() => (restoring = false), 0)
    }
    clearHistory()
    ui.collapsedModules.clear()
  }

  /** 新建空白简历并打开 */
  function createAndOpen(patch?: Partial<ResumeDoc>) {
    flushSave()
    boundId = lib.createResume(patch)
    const rec = lib.currentRecord
    if (rec) {
      restoring = true
      replaceDocContent(cloneDoc(rec.doc))
      setTimeout(() => (restoring = false), 0)
    }
    clearHistory()
    ui.collapsedModules.clear()
  }

  /** 库中修改名称时同步到编辑器绑定文档 */
  function syncBoundName(name: string) {
    if (name.trim()) doc.name = name.trim()
  }

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

  // ---------- 撤销 / 重做（快照式历史，按编辑爆发合并为一步） ----------
  const HISTORY_LIMIT = 50
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])
  /** 上一次编辑爆发结束后的文档快照 */
  let lastJson = JSON.stringify(doc)
  /** 是否正处于连续编辑爆发中（爆发期间只入栈一次爆发前状态） */
  let batching = false
  let batchTimer: ReturnType<typeof setTimeout> | null = null
  /** 恢复快照期间屏蔽历史记录 */
  let restoring = false
  /** 保存时间戳等程序化变动屏蔽历史记录 */
  let suppressHistory = false

  watch(
    doc,
    () => {
      if (restoring || suppressHistory) return
      if (!batching) {
        // 新爆发：把爆发前的状态入撤销栈，并清空重做栈
        undoStack.value.push(lastJson)
        if (undoStack.value.length > HISTORY_LIMIT) undoStack.value.shift()
        redoStack.value = []
        batching = true
      }
      if (batchTimer) clearTimeout(batchTimer)
      batchTimer = setTimeout(() => {
        lastJson = JSON.stringify(doc)
        batching = false
      }, 600)
    },
    { deep: true },
  )

  /** 应用快照并同步历史基准 */
  function applySnapshot(json: string) {
    restoring = true
    if (batchTimer) {
      clearTimeout(batchTimer)
      batchTimer = null
    }
    batching = false
    replaceDocContent(JSON.parse(json))
    lastJson = json
    setTimeout(() => (restoring = false), 0)
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function undo() {
    if (!undoStack.value.length || restoring) return
    redoStack.value.push(JSON.stringify(doc))
    applySnapshot(undoStack.value.pop()!)
  }

  function redo() {
    if (!redoStack.value.length || restoring) return
    undoStack.value.push(JSON.stringify(doc))
    applySnapshot(redoStack.value.pop()!)
  }

  /** 切换/新建简历时清空历史 */
  function clearHistory() {
    undoStack.value = []
    redoStack.value = []
    batching = false
    if (batchTimer) {
      clearTimeout(batchTimer)
      batchTimer = null
    }
    lastJson = JSON.stringify(doc)
  }

  /** 当前模板的专属样式类名 */
  const templateClass = computed(() => getTemplate(doc.templateId)?.className ?? '')
  const templateName = computed(() => getTemplate(doc.templateId)?.name ?? '')

  function resetResume() {
    const fresh = createDefaultResume()
    replaceDocContent(fresh)
    flushSave()
  }

  function requestOnePage() {
    ui.onePageSignal++
  }

  function requestDownload(format: DownloadFormat = 'pdf') {
    ui.downloadFormat = format
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
    flushSave,
    openResume,
    createAndOpen,
    syncBoundName,
    getBoundId: () => boundId,
    requestOnePage,
    requestDownload,
    canUndo,
    canRedo,
    undo,
    redo,
    undoStack,
    redoStack,
  }
})
