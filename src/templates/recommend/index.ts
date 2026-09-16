import type { ResumeTemplate } from '@/types/resume'
import { makeLayout, FONTS } from '../helper'
import './style.css'

/** 推荐分类模板 */
export const recommendTemplates: ResumeTemplate[] = [
  {
    id: 'rec-magazine',
    name: '杂志刊头',
    category: 'recommend',
    desc: '宋体刊头式大姓名 + 粗细双线，杂志排版感',
    className: 'tpl-rec-magazine',
    layout: makeLayout({ fontFamily: FONTS.SONG, fontSize: 14.5, moduleSpacing: 13 }),
    titleStyle: 'underline',
    profileStyle: 'left',
    pageStyle: 'single',
  },
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
