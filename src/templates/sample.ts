import type { Profile, ResumeModule, ResumeItem } from '@/types/resume'
import { uid } from '@/data/constants'

/** 缩略图使用的样例头像（SVG 剪影） */
export const SAMPLE_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><rect width="120" height="160" fill="#eef1f4"/><circle cx="60" cy="52" r="24" fill="#9aa5b1"/><path d="M18 130c6-26 24-38 42-38s36 12 42 38v30H18z" fill="#9aa5b1"/></svg>`,
  )

export const SAMPLE_PROFILE: Profile = {
  name: '陈媛媛',
  avatar: SAMPLE_AVATAR,
  jobIntention: '产品经理',
  contacts: [
    { id: uid(), label: '电话', value: '13800008888' },
    { id: uid(), label: '邮箱', value: 'abbey@wondercv.com' },
    { id: uid(), label: '城市', value: '北京' },
  ],
}

const item = (fields: Record<string, string>, desc: string[]): ResumeItem => ({
  id: uid(),
  fields,
  desc,
})

const mod = (
  type: ResumeModule['type'],
  title: string,
  items: ResumeItem[],
): ResumeModule => ({ id: uid(), type, title, hidden: false, items })

/** 缩略图样例模块（内容精简、覆盖各类渲染形态） */
export const SAMPLE_MODULES: ResumeModule[] = [
  mod('personal_summary', '个人总结', [
    item({}, ['北京大学计算机硕士，2 年互联网产品经验，熟悉需求分析、原型设计与数据分析。']),
  ]),
  mod('educations', '教育经历', [
    item(
      { school: '北京大学', major: '计算机科学与技术', degree: '硕士', date: '2021.09 - 2024.06' },
      ['GPA 3.8/4.0，连续两年获国家奖学金'],
    ),
  ]),
  mod('works', '工作经历', [
    item(
      { company: '超级科技有限公司', role: '产品经理', date: '2024.07 - 至今' },
      ['负责核心产品线迭代，主导 3 个版本上线，核心指标提升 25%', '搭建数据看板体系，推动需求响应周期缩短 40%'],
    ),
    item(
      { company: '未来互联网公司', role: '产品专员', date: '2022.07 - 2024.06' },
      ['独立负责用户增长功能，月活提升 18%'],
    ),
  ]),
  mod('projects', '项目经历', [
    item(
      { name: '智能客服系统从 0 到 1', role: '项目负责人', date: '2023.03 - 2023.12' },
      ['主导需求调研与产品设计，上线后客服人力成本降低 30%'],
    ),
  ]),
  mod('skills', '技能', [
    item({ name: '技能' }, ['Axure（精通），SQL（熟练），Python（基础），Figma（熟练）']),
  ]),
  mod('awards', '荣誉奖项', [
    item({ name: '国家奖学金', date: '2023.10' }, []),
    item({ name: '互联网+ 大赛北京市金奖', date: '2022.11' }, []),
  ]),
]

/** 侧栏模块类型（双栏模板放入左栏） */
export const SIDEBAR_TYPES = ['skills', 'awards', 'certificates']
