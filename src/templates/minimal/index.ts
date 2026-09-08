import type { ResumeTemplate } from '@/types/resume'
import { makeLayout, FONTS } from '../helper'
import './style.css'

/** 简约分类模板 */
export const minimalTemplates: ResumeTemplate[] = [
  {
    id: 'min-plain',
    name: '极简黑白',
    category: 'minimal',
    desc: '无装饰加粗标题，内容至上',
    className: 'tpl-min-plain',
    layout: makeLayout({}),
    titleStyle: 'plain',
    profileStyle: 'left',
    pageStyle: 'single',
  },
  {
    id: 'min-compact',
    name: '紧凑排版',
    category: 'minimal',
    desc: '小字号窄间距，一页装下更多内容',
    className: 'tpl-min-compact',
    layout: makeLayout({
      fontSize: 12.5,
      lineHeight: 1.4,
      moduleSpacing: 7,
      itemSpacing: 4,
      pageMargin: 8,
    }),
    titleStyle: 'plain',
    profileStyle: 'left',
    pageStyle: 'single',
  },
  {
    id: 'min-banner',
    name: '浅色横带',
    category: 'minimal',
    desc: '浅灰蓝头部横带，视觉轻量',
    className: 'tpl-min-banner',
    layout: makeLayout({ themeColor: '#475569' }),
    titleStyle: 'plain',
    profileStyle: 'banner',
    pageStyle: 'single',
  },
  {
    id: 'min-air',
    name: '留白呼吸',
    category: 'minimal',
    desc: '大间距大留白，阅读体验优先',
    className: 'tpl-min-air',
    layout: makeLayout({ moduleSpacing: 18, itemSpacing: 10, pageMargin: 14, lineHeight: 1.7 }),
    titleStyle: 'plain',
    profileStyle: 'center',
    pageStyle: 'single',
  },
]
