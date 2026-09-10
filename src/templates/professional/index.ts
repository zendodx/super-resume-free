import type { ResumeTemplate } from '@/types/resume'
import { makeLayout, FONTS } from '../helper'
import './style.css'

/** 专业分类模板 */
export const professionalTemplates: ResumeTemplate[] = [
  {
    id: 'pro-band',
    name: '顶部蓝带',
    category: 'professional',
    desc: '顶部通栏蓝色头部，气场十足',
    className: 'tpl-pro-band',
    layout: makeLayout({ themeColor: '#2c6ec8' }),
    titleStyle: 'underline',
    profileStyle: 'band',
    pageStyle: 'single',
  },
  {
    id: 'pro-sidebar-blue',
    name: '蓝色侧栏',
    category: 'professional',
    desc: '左侧蓝色信息栏，双栏排版',
    className: 'tpl-pro-sidebar-blue',
    layout: makeLayout({ themeColor: '#2c6ec8', pageMargin: 8 }),
    titleStyle: 'underline',
    profileStyle: 'left',
    pageStyle: 'sidebar-left',
  },
  {
    id: 'pro-dark-card',
    name: '深色卡片',
    category: 'professional',
    desc: '深色头部色带 + 圆形头像，内容圆角卡片分区',
    className: 'tpl-pro-dark',
    layout: makeLayout({ themeColor: '#2f5fd0', moduleSpacing: 10 }),
    titleStyle: 'plain',
    profileStyle: 'center',
    pageStyle: 'single',
  },
  {
    id: 'pro-blue-wave',
    name: '蓝色波浪',
    category: 'professional',
    desc: '蓝色波浪头部，标题居中加下划线',
    className: 'tpl-pro-wave',
    layout: makeLayout({ themeColor: '#3e86f5' }),
    titleStyle: 'plain',
    profileStyle: 'center',
    pageStyle: 'single',
  }
]
