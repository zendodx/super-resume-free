import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { ResumeDoc, ResumeItem, ResumeModule } from '@/types/resume'
import { MODULE_SCHEMAS } from '@/data/constants'
import { saveBlob } from './export'

/** docx 字号单位为半磅；正文 10.5pt 约等于网页 14px */
const SIZE_TEXT = 21
const SIZE_SUB = 21
const COLOR_SUB = '4E5359'

const LINE_TYPES = ['awards', 'certificates']
const FLAT_TYPES = ['skills']

function partsOf(module: ResumeModule, item: ResumeItem) {
  const schema = MODULE_SCHEMAS[module.type as keyof typeof MODULE_SCHEMAS] ?? []
  const pick = (role: string) =>
    schema
      .filter((f) => f.role === role)
      .map((f) => item.fields[f.key])
      .filter(Boolean)
  return { main: pick('main').join(' - '), subs: pick('sub'), right: pick('right').join(' - ') }
}

const itemVisible = (item: ResumeItem) =>
  Object.values(item.fields).some((v) => v && v.trim()) || item.desc.some((d) => d && d.trim())

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } as const
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
}

/** 头部行：无边框两列表格，左侧内容 + 右侧时间右对齐（比制表位兼容性更好） */
function headRow(leftRuns: TextRun[], right: string): Table {
  const cellOpts = {
    borders: NO_BORDERS,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    columnWidths: [7200, 3572],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            ...cellOpts,
            children: [
              new Paragraph({ children: leftRuns, spacing: { before: 80, after: 40 } }),
            ],
          }),
          new TableCell({
            ...cellOpts,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: right, size: SIZE_SUB, color: COLOR_SUB })],
                spacing: { before: 80, after: 40 },
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

/**
 * 生成原生 .docx 并下载。
 * 与网页预览按内容结构映射：主题色模块标题 + 下边框、加粗主字段、
 * 右对齐时间、项目符号要点列表；装饰性元素（色带/图标）不属于内容样式，不导出。
 */
export async function downloadResumeDocx(filename: string, doc: ResumeDoc): Promise<void> {
  const theme = (doc.layout.themeColor || '#000000').replace('#', '')
  const font = doc.layout.fontFamily.split(',')[0].replace(/['"]/g, '').trim()
  const children: (Paragraph | Table)[] = []
  const p = doc.profile

  // ---------- 个人信息 ----------
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: p.name || '未命名', bold: true, size: 44 })],
      spacing: { after: 60 },
    }),
  )
  if (p.jobIntention.trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `求职意向：${p.jobIntention}`, size: SIZE_TEXT, color: COLOR_SUB })],
      }),
    )
  }
  const contacts = p.contacts
    .filter((c) => c.value.trim())
    .map((c) => `${c.label}：${c.value}`)
    .join('　')
  if (contacts) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: contacts, size: SIZE_SUB, color: COLOR_SUB })],
        spacing: { after: 120 },
      }),
    )
  }

  // ---------- 模块 ----------
  for (const m of doc.modules) {
    if (m.hidden) continue
    const items = m.items.filter(itemVisible)
    if (items.length === 0) continue

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: m.title, bold: true, size: 28, color: theme })],
        border: {
          bottom: { color: theme, size: 6, style: BorderStyle.SINGLE, space: 2 },
        },
        spacing: { before: 240, after: 120 },
      }),
    )

    for (const item of items) {
      const { main, subs, right } = partsOf(m, item)
      const desc = item.desc.map((d) => d.trim()).filter(Boolean)

      if (m.type === 'personal_summary') {
        for (const d of desc) {
          children.push(
            new Paragraph({ children: [new TextRun({ text: d, size: SIZE_TEXT })], spacing: { after: 60 } }),
          )
        }
      } else if (LINE_TYPES.includes(m.type)) {
        children.push(headRow([new TextRun({ text: main, bold: true, size: SIZE_TEXT })], right))
      } else if (FLAT_TYPES.includes(m.type)) {
        children.push(
          new Paragraph({
            children: [
              ...(main ? [new TextRun({ text: `${main}：`, bold: true, size: SIZE_TEXT })] : []),
              new TextRun({ text: desc.join('；'), size: SIZE_TEXT }),
            ],
            spacing: { after: 60 },
          }),
        )
      } else {
        const leftRuns: TextRun[] = []
        if (main) leftRuns.push(new TextRun({ text: main, bold: true, size: 22 }))
        for (const s of subs) {
          leftRuns.push(new TextRun({ text: `　${s}`, size: SIZE_SUB, color: COLOR_SUB }))
        }
        children.push(headRow(leftRuns, right))
        for (const d of desc) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: d, size: SIZE_TEXT })],
              bullet: { level: 0 },
              spacing: { after: 40 },
            }),
          )
        }
      }
    }
  }

  const document = new Document({
    styles: { default: { document: { run: { font, size: SIZE_TEXT } } } },
    sections: [
      {
        properties: { page: { margin: { top: 567, bottom: 567, left: 567, right: 567 } } },
        children,
      },
    ],
  })
  const blob = await Packer.toBlob(document)
  saveBlob(blob, `${filename || '简历'}.docx`)
}
