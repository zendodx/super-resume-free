import type { ResumeDoc, ResumeModule } from '@/types/resume'
import { uid } from './constants'

const module = (
  type: ResumeModule['type'],
  title: string,
  items: ResumeModule['items'],
): ResumeModule => ({ id: uid(), type, title, hidden: false, items })

export function createDefaultResume(): ResumeDoc {
  return {
    name: '未命名超级简历',
    profile: {
      name: '王小明',
      avatar: '',
      jobIntention: '产品经理',
      contacts: [
        { id: uid(), label: '电话', value: '138-0000-0000' },
        { id: uid(), label: '邮箱', value: 'wangxiaoming@email.com' },
        { id: uid(), label: '城市', value: '北京' },
      ],
    },
    modules: [
      module('personal_summary', '个人总结', [
        {
          id: uid(),
          fields: {},
          desc: [
            '985 高校计算机专业应届生，具备两段产品实习经历，熟悉从需求调研到上线的完整产品流程。',
            '熟练使用 Axure / Figma 进行原型设计，掌握 SQL 与 Python 数据分析，可独立完成竞品分析与用户调研。',
            '较强的跨团队沟通与项目推进能力，实习期间主导 3 个功能迭代，核心指标提升 15%+。',
          ],
        },
      ]),
      module('educations', '教育经历', [
        {
          id: uid(),
          fields: {
            school: '中国农业大学（985/211）',
            major: '计算机科学与技术',
            degree: '本科',
            date: '2020.09 - 2024.06',
          },
          desc: ['GPA 3.8/4.0（专业前 5%），连续三年获国家奖学金。'],
        },
      ]),
      module('internships', '实习经历', [
        {
          id: uid(),
          fields: {
            company: '超级科技有限公司',
            role: '产品助理（实习）',
            date: '2023.06 - 2023.09',
          },
          desc: [
            '协助产品经理进行市场调研和用户需求分析，参与产品文档的撰写和整理。',
            '负责跟进产品开发进度，协助进行版本测试和 Bug 跟踪，确保产品质量。',
            '参与用户反馈的收集与整理，通过用户画像分析推动 2 项体验优化落地。',
          ],
        },
        {
          id: uid(),
          fields: {
            company: '未来互联网公司',
            role: '产品运营（实习）',
            date: '2022.07 - 2022.12',
          },
          desc: [
            '负责社区内容运营，制定内容推荐策略，周活跃用户提升 20%。',
            '策划 3 场线上活动，单场最高参与人次破万，沉淀可复用活动 SOP。',
          ],
        },
      ]),
      module('projects', '项目经历', [
        {
          id: uid(),
          fields: {
            name: '校园二手交易小程序「闲集」',
            role: '项目负责人',
            date: '2022.03 - 2022.12',
          },
          desc: [
            '带领 4 人团队完成小程序从 0 到 1 搭建，负责需求分析、原型设计与开发排期。',
            '上线 3 个月注册用户突破 5000，日均交易订单 100+。',
          ],
        },
      ]),
      module('orgs', '社团和组织经历', [
        {
          id: uid(),
          fields: { name: '校学生会', role: '宣传部部长', date: '2020.09 - 2021.09' },
          desc: ['统筹校园活动宣传工作，管理 15 人团队，年度策划宣传物料 30+ 套。'],
        },
      ]),
      module('skills', '技能', [
        {
          id: uid(),
          fields: { name: '技能' },
          desc: [
            'Office（精通），Axure（熟练），Figma（熟练），SQL（熟练），Python（基础）',
          ],
        },
      ]),
      module('awards', '荣誉奖项', [
        { id: uid(), fields: { name: '全国大学生互联网+ 创新创业大赛 北京市二等奖', date: '2022.05' }, desc: [] },
        { id: uid(), fields: { name: '国家奖学金（连续三年）', date: '2021.10' }, desc: [] },
      ]),
    ],
    layout: {
      fontFamily:
        "'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
      fontSize: 14,
      lineHeight: 1.5,
      moduleSpacing: 10,
      itemSpacing: 6,
      pageMargin: 10,
      themeColor: '#000000',
      titleBold: true,
    },
    templateId: 'rec-classic',
    titleStyle: 'underline' as const,
    profileStyle: 'left' as const,
    pageStyle: 'single' as const,
    updatedAt: Date.now(),
  }
}
