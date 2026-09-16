import type { ResumeTemplate } from '@/types/resume'
import './base.css'
import { recommendTemplates } from './recommend'
import { professionalTemplates } from './professional'
import { classicTemplates } from './classic'
import { minimalTemplates } from './minimal'
import { forestTemplates } from './forest'

/** 全部模板（按分类分目录管理，新增模板在各分类目录中添加即可） */
export const TEMPLATES: ResumeTemplate[] = [
  ...recommendTemplates,
  ...professionalTemplates,
  ...classicTemplates,
  ...minimalTemplates,
  ...forestTemplates,
]

/** 模板分类（自定义为占位，展示自制模板的入口） */
export const TEMPLATE_CATEGORIES: { key: 'all' | ResumeTemplate['category'] | 'custom'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'recommend', label: '推荐' },
  { key: 'professional', label: '专业' },
  { key: 'classic', label: '经典' },
  { key: 'minimal', label: '简约' },
  { key: 'forest', label: '森系' },
  { key: 'custom', label: '自定义' },
]

/** 已下线模板的别名映射：旧简历引用的 templateId 回落到同构的保留模板 */
const TEMPLATE_ALIASES: Record<string, string> = {
  'rec-blue': 'rec-classic', // 商务蓝 → 经典黑（同构，主题色已可修改）
  'pro-sidebar-teal': 'pro-sidebar-blue', // 青色侧栏 → 蓝色侧栏
  'pro-navy': 'rec-green', // 沉稳藏青 → 活力绿（同构竖条标题左置）
  'cls-ink': 'rec-block', // 墨色古风 → 色块标题（同构色块标题 + 姓名色条）
  'cls-serif': 'cls-center', // 衬线蓝调 → 居中典雅（同构居中标题头部）
}

export function getTemplate(id: string): ResumeTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES.find((t) => t.id === TEMPLATE_ALIASES[id])
}
