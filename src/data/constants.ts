import type { FieldSchema, ModuleType } from '@/types/resume'

export const uid = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

/** 各模块类型的字段 schema */
export const MODULE_SCHEMAS: Record<Exclude<ModuleType, 'profile'>, FieldSchema[]> = {
  personal_summary: [],
  educations: [
    { key: 'school', label: '学校', role: 'main', placeholder: '如：北京大学（985/211）' },
    { key: 'major', label: '专业', role: 'sub', placeholder: '如：计算机科学与技术' },
    { key: 'degree', label: '学历', role: 'sub', placeholder: '如：本科 / 硕士' },
    { key: 'date', label: '时间', role: 'right', placeholder: '如：2020.09 - 2024.06' },
  ],
  works: [
    { key: 'company', label: '公司', role: 'main', placeholder: '如：超级科技有限公司' },
    { key: 'role', label: '职位', role: 'sub', placeholder: '如：产品经理' },
    { key: 'date', label: '时间', role: 'right', placeholder: '如：2022.07 - 至今' },
  ],
  internships: [
    { key: 'company', label: '公司', role: 'main', placeholder: '如：某某互联网公司' },
    { key: 'role', label: '职位', role: 'sub', placeholder: '如：产品助理（实习）' },
    { key: 'date', label: '时间', role: 'right', placeholder: '如：2023.06 - 2023.09' },
  ],
  projects: [
    { key: 'name', label: '项目名称', role: 'main', placeholder: '如：XX 小程序从 0 到 1' },
    { key: 'role', label: '担任角色', role: 'sub', placeholder: '如：项目负责人' },
    { key: 'date', label: '时间', role: 'right', placeholder: '如：2023.03 - 2023.08' },
  ],
  orgs: [
    { key: 'name', label: '组织名称', role: 'main', placeholder: '如：校学生会' },
    { key: 'role', label: '职位', role: 'sub', placeholder: '如：宣传部部长' },
    { key: 'date', label: '时间', role: 'right', placeholder: '如：2021.09 - 2022.09' },
  ],
  skills: [
    { key: 'name', label: '技能类别', role: 'main', placeholder: '如：编程语言 / 设计工具' },
  ],
  awards: [
    { key: 'name', label: '奖项名称', role: 'main', placeholder: '如：国家奖学金' },
    { key: 'date', label: '时间', role: 'right', placeholder: '如：2022.10' },
  ],
  certificates: [
    { key: 'name', label: '证书名称', role: 'main', placeholder: '如：CET-6' },
    { key: 'date', label: '时间', role: 'right', placeholder: '如：2021.12' },
  ],
  custom: [
    { key: 'title', label: '标题', role: 'main', placeholder: '标题' },
    { key: 'date', label: '时间（选填）', role: 'right', placeholder: '时间' },
  ],
}

/** 可添加的模块目录 */
export const MODULE_CATALOG: { type: Exclude<ModuleType, 'profile'>; title: string; desc: string }[] = [
  { type: 'personal_summary', title: '个人总结', desc: '用 3-4 行概括你的核心竞争力' },
  { type: 'educations', title: '教育经历', desc: '学校、专业、学历与时间' },
  { type: 'works', title: '工作经历', desc: '公司、职位与工作内容' },
  { type: 'internships', title: '实习经历', desc: '实习公司与岗位内容' },
  { type: 'projects', title: '项目经历', desc: '项目名称、角色与项目成果' },
  { type: 'orgs', title: '社团和组织经历', desc: '校园组织与担任职务' },
  { type: 'skills', title: '技能', desc: '技能类别与掌握程度' },
  { type: 'awards', title: '荣誉奖项', desc: '奖学金、竞赛获奖等' },
  { type: 'certificates', title: '资格证书', desc: '语言、职业资格证书等' },
  { type: 'custom', title: '自定义模块', desc: '自由定义标题与内容' },
]

/** 个人信息可选字段（联系方式 / 社交 / 其他） */
export const PROFILE_FIELD_OPTIONS: { group: string; label: string }[] = [
  { group: '基本信息', label: '性别' },
  { group: '基本信息', label: '年龄' },
  { group: '基本信息', label: '城市' },
  { group: '基本信息', label: '求职意向' },
  { group: '联系方式', label: '电话' },
  { group: '联系方式', label: '邮箱' },
  { group: '联系方式', label: '个人网站' },
  { group: '联系方式', label: '微信' },
  { group: '其他信息', label: '民族' },
  { group: '其他信息', label: '籍贯' },
  { group: '其他信息', label: '政治面貌' },
  { group: '其他信息', label: '婚姻状况' },
  { group: '其他信息', label: 'MBTI' },
]

export const FONT_FAMILIES = [
  { label: '微软雅黑', value: "'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif" },
  { label: '宋体', value: "'SimSun', 'Songti SC', serif" },
  { label: '黑体', value: "'SimHei', 'PingFang SC', sans-serif" },
  { label: '楷体', value: "'Kaiti SC', 'KaiTi', serif" },
  { label: '思源黑体', value: "'Source Han Sans SC', 'Noto Sans SC', 'PingFang SC', sans-serif" },
  { label: '默认字体', value: "-apple-system, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
]

export const FONT_SIZES = [11, 12, 13, 14, 15, 16].map((n) => ({ label: String(n), value: n }))

export const LINE_SPACINGS = [1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0].map((n) => ({
  label: n.toFixed(1),
  value: n,
}))

export const MODULE_SPACINGS = [6, 8, 10, 12, 14, 16, 20, 24].map((n) => ({
  label: String(n),
  value: n,
}))

export const PAGE_MARGINS = [5, 8, 10, 12, 15, 18, 20].map((n) => ({
  label: `${n}mm`,
  value: n,
}))

export const THEME_COLORS = [
  '#000000',
  '#1f7a5a',
  '#2c6ec8',
  '#7c3aed',
  '#b03a3a',
  '#c2711c',
  '#0e7490',
  '#475569',
]
