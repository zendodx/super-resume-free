/** 简历数据模型 */

export type ModuleType =
  | 'profile' // 个人信息（固定首模块）
  | 'personal_summary' // 个人总结
  | 'educations' // 教育经历
  | 'works' // 工作经历
  | 'internships' // 实习经历
  | 'projects' // 项目经历
  | 'orgs' // 社团和组织经历
  | 'skills' // 技能
  | 'awards' // 荣誉奖项
  | 'certificates' // 资格证书
  | 'custom' // 自定义模块

/** 模块内一条经历的动态字段 */
export interface ResumeItem {
  id: string
  /** 字段 key -> 值（字段 schema 由模块类型决定） */
  fields: Record<string, string>
  /** 描述（每行一条要点） */
  desc: string[]
}

/** 联系方式 / 附加信息字段 */
export interface ProfileField {
  id: string
  label: string
  value: string
}

/** 个人信息模块 */
export interface Profile {
  name: string
  avatar: string // base64 或 url，空则不展示
  jobIntention: string
  contacts: ProfileField[]
}

export interface ResumeModule {
  id: string
  type: ModuleType
  title: string
  hidden: boolean
  items: ResumeItem[]
}

/** 模块标题风格 */
export type TitleStyle =
  | 'underline' // 标题下划线（默认）
  | 'block' // 色块反白
  | 'sidebar' // 左侧竖色条
  | 'plain' // 仅加粗无装饰
  | 'center' // 居中 + 两侧短线

/** 个人信息头部风格 */
export type ProfileStyle = 'left' | 'center' | 'nameBar' | 'band' | 'banner'

/** 页面布局风格：单栏 / 左右双色栏 */
export type PageStyle = 'single' | 'sidebar-left' | 'sidebar-right'

/** 简历模板预设 */
export interface ResumeTemplate {
  id: string
  name: string
  category: 'recommend' | 'professional' | 'classic' | 'minimal' | 'forest'
  desc: string
  /** 专属样式类名（对应 templates/<category>/style.css 中的 .tpl-* 规则） */
  className: string
  layout: LayoutSettings
  titleStyle: TitleStyle
  profileStyle: ProfileStyle
  pageStyle: PageStyle
  /** 双栏布局时放入侧栏的模块类型（缺省为技能/荣誉/证书，可传空数组让侧栏只放个人信息） */
  sideModules?: ModuleType[]
}

/** 排版设置 */
export interface LayoutSettings {
  fontFamily: string
  fontSize: number // px
  lineHeight: number
  moduleSpacing: number // 模块间距(px)
  itemSpacing: number // 条目间距(px)
  pageMargin: number // mm
  themeColor: string
  titleBold: boolean
}

export interface ResumeDoc {
  name: string
  profile: Profile
  modules: ResumeModule[]
  layout: LayoutSettings
  /** 当前应用的模板 id */
  templateId: string
  titleStyle: TitleStyle
  profileStyle: ProfileStyle
  pageStyle: PageStyle
  updatedAt: number
}

/** 模块字段 schema：用于动态渲染编辑表单与预览 */
export interface FieldSchema {
  key: string
  label: string
  /** 预览时权重：main 加粗显示在标题行，sub 显示在标题行右侧 */
  role: 'main' | 'sub' | 'right'
  placeholder?: string
}
