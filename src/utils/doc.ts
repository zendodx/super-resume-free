import type { ResumeDoc } from '@/types/resume'
import { getTemplate } from '@/templates'

/** 深拷贝简历文档 */
export function cloneDoc(doc: ResumeDoc): ResumeDoc {
  return JSON.parse(JSON.stringify(doc)) as ResumeDoc
}

/** 归一化简历文档：补齐缺失字段，兼容旧数据 */
export function normalizeDoc(doc: ResumeDoc): ResumeDoc {
  if (!doc.name) doc.name = '未命名超级简历'
  if (!doc.templateId || !getTemplate(doc.templateId)) doc.templateId = 'rec-classic'
  if (!doc.titleStyle) doc.titleStyle = 'underline'
  if (!doc.profileStyle) doc.profileStyle = 'left'
  if (!doc.pageStyle) doc.pageStyle = 'single'
  if (!doc.updatedAt) doc.updatedAt = Date.now()
  return doc
}

/** 校验导入的 JSON 是否为合法简历文档 */
export function isValidDoc(data: unknown): data is ResumeDoc {
  if (!data || typeof data !== 'object') return false
  const d = data as Partial<ResumeDoc>
  return Boolean(d.profile && Array.isArray(d.modules) && d.layout)
}

/** 格式化最后编辑时间 */
export function formatEditTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) return hm
  const sameYear = d.getFullYear() === now.getFullYear()
  const md = `${d.getMonth() + 1}月${d.getDate()}日`
  return sameYear ? `${md} ${hm}` : `${d.getFullYear()}年${md} ${hm}`
}
