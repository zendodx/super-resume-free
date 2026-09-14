import { jsPDF } from 'jspdf'
import { withSandboxClones, pageToCanvas } from './export'

/** A4 宽度（mm），像素尺寸从渲染元素实测 */
const PAGE_W_MM = 210

/**
 * 将简历预览导出为 PDF 并触发下载。
 * 逐页渲染后按 A4 页面合成 PDF。
 */
export async function downloadResumePdf(filename: string, previewRoot: HTMLElement): Promise<void> {
  await withSandboxClones(previewRoot, async (clones) => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
    for (let i = 0; i < clones.length; i++) {
      const canvas = await pageToCanvas(clones[i])
      const heightMm = (clones[i].offsetHeight / clones[i].offsetWidth) * PAGE_W_MM
      if (i > 0) pdf.addPage('a4', 'portrait')
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_W_MM, heightMm, undefined, 'FAST')
    }
    pdf.save(`${filename || '简历'}.pdf`)
  })
}
