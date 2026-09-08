import type { ResumeTemplate } from '@/types/resume'
import { makeLayout } from '../helper'
import './style.css'

/** 推荐分类模板 */
export const recommendTemplates: ResumeTemplate[] = [
  {
    id: 'rec-classic',
    name: '经典黑',
    category: 'recommend',
    desc: '黑白下划线标题，最通用的选择',
    className: 'tpl-rec-classic',
    layout: makeLayout({}),
    titleStyle: 'underline',
    profileStyle: 'left',
    pageStyle: 'single',
  },
  {
    id: 'rec-blue',
    name: '商务蓝',
    category: 'recommend',
    desc: '深蓝标题色，商务感与可读性兼顾',
    className: 'tpl-rec-blue',
    layout: makeLayout({ themeColor: '#2c6ec8' }),
    titleStyle: 'underline',
    profileStyle: 'left',
    pageStyle: 'single',
  },
  {
    id: 'rec-green',
    name: '活力绿',
    category: 'recommend',
    desc: '青绿竖条标题，适合互联网岗位',
    className: 'tpl-rec-green',
    layout: makeLayout({ themeColor: '#1f7a5a' }),
    titleStyle: 'sidebar',
    profileStyle: 'left',
    pageStyle: 'single',
  },
  {
    id: 'rec-block',
    name: '色块标题',
    category: 'recommend',
    desc: '模块标题反白色块，层次分明',
    className: 'tpl-rec-block',
    layout: makeLayout({ themeColor: '#2c6ec8', moduleSpacing: 12 }),
    titleStyle: 'block',
    profileStyle: 'nameBar',
    pageStyle: 'single',
  },
]
