import type { ResumeTemplate } from '@/types/resume'
import './base.css'
import { recommendTemplates } from './recommend'
import { professionalTemplates } from './professional'
import { classicTemplates } from './classic'
import { minimalTemplates } from './minimal'

/** 全部模板（按分类分目录管理，新增模板在各分类目录中添加即可） */
export const TEMPLATES: ResumeTemplate[] = [
  ...recommendTemplates,
  ...professionalTemplates,
  ...classicTemplates,
  ...minimalTemplates,
]

/** 模板分类（自定义为占位，展示自制模板的入口） */
export const TEMPLATE_CATEGORIES: { key: 'all' | ResumeTemplate['category'] | 'custom'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'recommend', label: '推荐' },
  { key: 'professional', label: '专业' },
  { key: 'classic', label: '经典' },
  { key: 'minimal', label: '简约' },
  { key: 'custom', label: '自定义' },
]

export function getTemplate(id: string): ResumeTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
