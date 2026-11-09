/** 富文本与要点列表的互转（切换模式时内容不丢失） */

/** HTML 转义（纯文本入 HTML 时防注入） */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

/** 常规实体反转义 */
export function unescapeHtml(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
}

/**
 * 要点列表 → 富文本 HTML：
 * 每条要点转为一个 <p>（保留要点序号风格交给预览 CSS 的 list 处理，
 * 这里每行是独立段落，空行跳过）。
 */
export function pointsToRich(points: string[]): string {
  return points
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('')
}

/**
 * 富文本 HTML → 要点列表：
 * 每个块级元素（p/div/li）作为一条要点，取其纯文本；
 * 行内标签（b/strong/i/em/u/a 等）保留其语义到文本内容中不丢失信息。
 * 无块级元素时按 <br> 拆行。
 */
export function richToPoints(html: string): string[] {
  if (!html.trim()) return []
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild as HTMLElement | null
  if (!root) return []

  const blocks = root.querySelectorAll('p, div, li')
  if (blocks.length === 0) {
    // 无块级元素：按 <br> 拆行
    return root.innerHTML
      .split(/<br\s*\/?>/i)
      .map((s) => unescapeHtml(s.replace(/<[^>]+>/g, '')).trim())
      .filter(Boolean)
  }
  return [...blocks]
    .map((b) => (b.textContent ?? '').trim())
    .filter(Boolean)
}

/** 富文本 HTML → 纯文本（用于 Word 导出降级） */
export function richToPlainText(html: string): string[] {
  return richToPoints(html)
}

/**
 * 富文本 HTML → Markdown 行：
 * 块级元素（p/li）为一条，b/strong→**，i/em→*，u 保留文本。
 */
export function richToMarkdownLines(html: string): string[] {
  if (!html.trim()) return []
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild as HTMLElement | null
  if (!root) return []

  const inlineMd = (node: Node): string =>
    [...node.childNodes]
      .map((n) => {
        if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? ''
        const el = n as HTMLElement
        const inner = inlineMd(el)
        switch (el.tagName) {
          case 'B':
          case 'STRONG':
            return inner.trim() ? `**${inner}**` : ''
          case 'I':
          case 'EM':
            return inner.trim() ? `*${inner}*` : ''
          default:
            return inner
        }
      })
      .join('')

  const blocks = root.querySelectorAll('p, li')
  const source = blocks.length ? [...blocks] : [root]
  return source
    .map((b) => inlineMd(b).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}
