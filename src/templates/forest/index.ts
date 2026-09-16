import type { ResumeTemplate } from '@/types/resume'
import { makeLayout } from '../helper'
import './style.css'

/** 森系分类模板：自然绿色系，清新治愈 */
export const forestTemplates: ResumeTemplate[] = [
  {
    id: 'for-leaf',
    name: '绿叶徽章',
    category: 'forest',
    desc: '叶形圆角徽章标题，清新自然',
    className: 'tpl-for-leaf',
    layout: makeLayout({ themeColor: '#3a7d44', moduleSpacing: 13 }),
    titleStyle: 'plain',
    profileStyle: 'left',
    pageStyle: 'single',
  },
  {
    id: 'for-moss',
    name: '苔藓卡片',
    category: 'forest',
    desc: '浅苔绿圆角卡片分区，柔和护眼',
    className: 'tpl-for-moss',
    layout: makeLayout({ themeColor: '#5f8468', moduleSpacing: 12, itemSpacing: 7 }),
    titleStyle: 'plain',
    profileStyle: 'left',
    pageStyle: 'single',
  },
  {
    id: 'for-shade',
    name: '林荫通栏',
    category: 'forest',
    desc: '深林绿通栏头部，粗竖条标题',
    className: 'tpl-for-shade',
    layout: makeLayout({ themeColor: '#2e6b4f', moduleSpacing: 13 }),
    titleStyle: 'sidebar',
    profileStyle: 'band',
    pageStyle: 'single',
  },
  {
    id: 'for-bamboo',
    name: '竹青双丝',
    category: 'forest',
    desc: '竹青色双丝线标题，头部居中对齐',
    className: 'tpl-for-bamboo',
    layout: makeLayout({ themeColor: '#4c8a5f', moduleSpacing: 14, lineHeight: 1.6 }),
    titleStyle: 'underline',
    profileStyle: 'center',
    pageStyle: 'single',
  },
  {
    id: 'for-olive',
    name: '橄榄菱形',
    category: 'forest',
    desc: '橄榄绿菱形引导标题，沉稳大地色',
    className: 'tpl-for-olive',
    layout: makeLayout({ themeColor: '#75803c', moduleSpacing: 13, pageMargin: 12 }),
    titleStyle: 'plain',
    profileStyle: 'nameBar',
    pageStyle: 'single',
  },
]
