import type { ResumeModule } from '@/types/resume'
import type { PreviewBlock } from '@/components/ResumeContent.vue'

/** 由简历模块构建预览块（标题与第一条经历绑定为同一块，避免标题孤行） */
export function buildBlocks(modules: ResumeModule[]): PreviewBlock[] {
  const blocks: PreviewBlock[] = []
  for (const m of modules) {
    if (m.hidden) continue
    const items = m.items.filter((it) => {
      const hasField = Object.values(it.fields).some((v) => v && v.trim())
      const hasDesc = it.desc.some((d) => d && d.trim())
      return hasField || hasDesc
    })
    if (items.length === 0) continue
    blocks.push({ key: m.id, module: m, items: [items[0]], showTitle: true })
    for (let i = 1; i < items.length; i++) {
      blocks.push({ key: `${m.id}-${i}`, module: m, items: [items[i]], showTitle: false })
    }
  }
  return blocks
}
