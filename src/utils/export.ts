import { toSvg } from 'html-to-image'
import type { ResumeDoc, ResumeItem, ResumeModule } from '@/types/resume'
import { MODULE_SCHEMAS } from '@/data/constants'

/** 导出格式 */
export type DownloadFormat = 'pdf' | 'png' | 'word' | 'md'

/** 导出清晰度倍率 */
const SCALE = 2

// ---------- 通用：文件下载 ----------
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- 通用：把预览页克隆到屏外容器，1:1 渲染 ----------
export async function withSandboxClones<T>(
  previewRoot: HTMLElement,
  fn: (clones: HTMLElement[]) => Promise<T>,
): Promise<T> {
  const pages = Array.from(previewRoot.querySelectorAll<HTMLElement>('.pv-page'))
  if (pages.length === 0) throw new Error('没有可导出的简历页面')

  const sandbox = document.createElement('div')
  sandbox.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;'
  const clones = pages.map((p) => {
    const c = p.cloneNode(true) as HTMLElement
    c.style.margin = '0'
    c.style.boxShadow = 'none'
    c.style.borderRadius = '0'
    sandbox.appendChild(c)
    return c
  })
  document.body.appendChild(sandbox)
  try {
    return await fn(clones)
  } finally {
    sandbox.remove()
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('简历页面渲染失败'))
    img.src = src
  })
}

/**
 * 单个页面元素转 canvas。
 * 用 html-to-image 的 toSvg（内联样式 + foreignObject，可正确渲染伪元素与 color-mix），
 * 再手动转 canvas：不经过 toCanvas/toPng（其内部实现在部分环境下会挂起）。
 */
export async function pageToCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const width = el.offsetWidth
  const height = el.offsetHeight
  const svgUrl = await toSvg(el, { skipFonts: true })
  const img = await loadImage(svgUrl)
  const canvas = document.createElement('canvas')
  canvas.width = width * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

// ---------- PNG：所有页面拼接为整页长图 ----------
export async function downloadResumePng(filename: string, previewRoot: HTMLElement): Promise<void> {
  await withSandboxClones(previewRoot, async (clones) => {
    const canvases: HTMLCanvasElement[] = []
    for (const el of clones) canvases.push(await pageToCanvas(el))
    const width = Math.max(...canvases.map((c) => c.width))
    const height = canvases.reduce((s, c) => s + c.height, 0)
    const out = document.createElement('canvas')
    out.width = width
    out.height = height
    const ctx = out.getContext('2d')
    if (!ctx) throw new Error('无法创建画布')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    let y = 0
    for (const c of canvases) {
      ctx.drawImage(c, 0, y)
      y += c.height
    }
    out.toBlob((b) => b && saveBlob(b, `${filename || '简历'}.png`), 'image/png')
  })
}

// ---------- Word：Word 兼容 HTML（.doc） ----------
export async function downloadResumeWord(filename: string, previewRoot: HTMLElement): Promise<void> {
  await withSandboxClones(previewRoot, async (clones) => {
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n')
    const body = clones.map((c) => c.outerHTML).join('\n')
    const html = [
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">',
      '<head><meta charset="utf-8"/>',
      `<style>@page{size:A4;margin:10mm;}.pv-page{width:190mm;min-height:0;height:auto;margin:0 0 12px;box-shadow:none;border-radius:0;overflow:visible;} ${styles}</style>`,
      '</head><body>',
      body,
      '</body></html>',
    ].join('')
    // BOM 保证 Word 按 UTF-8 打开
    const blob = new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' })
    saveBlob(blob, `${filename || '简历'}.doc`)
  })
}

// ---------- Markdown：由简历数据模型生成 ----------
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

const LINE_TYPES = ['awards', 'certificates']
const FLAT_TYPES = ['skills', 'personal_summary']

export function resumeToMarkdown(doc: ResumeDoc): string {
  const p = doc.profile
  const lines: string[] = [`# ${p.name || '未命名'}`]
  if (p.jobIntention.trim()) lines.push('', `求职意向：${p.jobIntention}`)
  const contacts = p.contacts.filter((c) => c.value.trim()).map((c) => `${c.label}：${c.value}`)
  if (contacts.length) lines.push('', contacts.join(' ｜ '))

  for (const m of doc.modules) {
    if (m.hidden) continue
    const items = m.items.filter(itemVisible)
    if (items.length === 0) continue
    lines.push('', `## ${m.title}`)
    for (const item of items) {
      const { main, subs, right } = partsOf(m, item)
      const desc = item.desc.map((d) => d.trim()).filter(Boolean)
      if (m.type === 'personal_summary') {
        desc.forEach((d) => lines.push('', d))
      } else if (LINE_TYPES.includes(m.type)) {
        lines.push(`- ${main}${right ? `（${right}）` : ''}`)
      } else if (FLAT_TYPES.includes(m.type)) {
        lines.push(`- ${main ? `**${main}：**` : ''}${desc.join('；')}`)
      } else {
        lines.push('', `### ${main}${subs.length ? ` · ${subs.join(' ')}` : ''}`)
        if (right) lines.push(`*${right}*`)
        desc.forEach((d) => lines.push(`- ${d}`))
      }
    }
  }
  return lines.join('\n')
}

export function downloadMarkdown(filename: string, doc: ResumeDoc): void {
  const blob = new Blob([resumeToMarkdown(doc)], { type: 'text/markdown;charset=utf-8' })
  saveBlob(blob, `${filename || '简历'}.md`)
}
