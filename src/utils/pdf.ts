import { toSvg } from 'html-to-image'
import { jsPDF } from 'jspdf'

/** A4 宽度（mm），像素尺寸从渲染元素实测 */
const PAGE_W_MM = 210
/** 导出清晰度倍率 */
const SCALE = 2

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('简历页面渲染失败'))
    img.src = src
  })
}

/**
 * 单个页面元素转 PNG。
 * 用 html-to-image 的 toSvg（内联样式 + foreignObject，可正确渲染伪元素与 color-mix），
 * 再手动转 canvas：不经过 toCanvas/toPng（其内部实现在部分环境下会挂起）。
 */
async function elementToPng(el: HTMLElement): Promise<{ dataUrl: string; heightMm: number }> {
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
  return { dataUrl: canvas.toDataURL('image/png'), heightMm: (height / width) * PAGE_W_MM }
}

/**
 * 将简历预览导出为 PDF 并触发下载。
 * 把 .pv-page 克隆到屏幕外容器中 1:1 渲染（脱离预览缩放与阴影），逐页合成 A4 PDF。
 */
export async function downloadResumePdf(filename: string, previewRoot: HTMLElement): Promise<void> {
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
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
    for (let i = 0; i < clones.length; i++) {
      const { dataUrl, heightMm } = await elementToPng(clones[i])
      if (i > 0) pdf.addPage('a4', 'portrait')
      pdf.addImage(dataUrl, 'PNG', 0, 0, PAGE_W_MM, heightMm, undefined, 'FAST')
    }
    pdf.save(`${filename || '简历'}.pdf`)
  } finally {
    sandbox.remove()
  }
}
