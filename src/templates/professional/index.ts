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
    id: 'pro-rail-right',
    name: '右侧栏',
    category: 'professional',
    desc: '右侧个人信息栏，丝带式模块标题',
    className: 'tpl-pro-rail',
    layout: makeLayout({ themeColor: '#0e7490', moduleSpacing: 14, lineHeight: 1.7 }),
    titleStyle: 'plain',
    profileStyle: 'left',
    pageStyle: 'sidebar-right',
    sideModules: [], // 侧栏只放个人信息，模块全部留在主栏
  },
  {
    id: 'pro-icon-title',
    name: '图标标题',
    category: 'professional',
    desc: '模块标题配圆形图标，层次清晰',
    className: 'tpl-pro-icon',
    layout: makeLayout({ themeColor: '#3a78e0', moduleSpacing: 12 }),
    titleStyle: 'plain',
    profileStyle: 'left',
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
