<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResumeStore } from '@/store/resume'
import ResumeContent, { type PreviewBlock } from './ResumeContent.vue'
import ResumePage from './ResumePage.vue'
import { SIDEBAR_TYPES } from '@/templates/sample'
import { buildBlocks } from '@/utils/blocks'

const store = useResumeStore()
const doc = store.doc
const layout = doc.layout

const isSidebar = computed(() => doc.pageStyle === 'sidebar-left')

// ---------- 缩放 ----------
const zoom = ref<number | 'auto'>('auto')
const scrollEl = ref<HTMLElement>()
const autoScale = ref(1)

function fitAuto() {
  const el = scrollEl.value
  if (!el) return
  const availH = el.clientHeight - 48
  const availW = el.clientWidth - 48
  const pageH = 1122.5 // 297mm @96dpi
  const pageW = 793.7 // 210mm @96dpi
  autoScale.value = Math.min(1, availH / pageH, availW / pageW)
}
const scale = computed(() => (zoom.value === 'auto' ? autoScale.value : zoom.value))

function setZoom(v: number | 'auto') {
  zoom.value = v
  if (v === 'auto') nextTick(fitAuto)
}

// ---------- 构建分页块 ----------
const allBlocks = computed<PreviewBlock[]>(() => buildBlocks(doc.modules))

/** 双栏布局：主栏 / 侧栏分块 */
const sideBlocks = computed<PreviewBlock[]>(() =>
  isSidebar.value ? allBlocks.value.filter((b) => SIDEBAR_TYPES.includes(b.module.type)) : [],
)
const mainBlocks = computed<PreviewBlock[]>(() =>
  isSidebar.value ? allBlocks.value.filter((b) => !SIDEBAR_TYPES.includes(b.module.type)) : allBlocks.value,
)

// ---------- 分页测量 ----------
const pages = ref<PreviewBlock[][]>([])
const measureEl = ref<HTMLElement>()
const rulerEl = ref<HTMLElement>()

let repaginateTimer: ReturnType<typeof setTimeout> | null = null

async function repaginate(): Promise<number> {
  await nextTick()
  const ruler = rulerEl.value
  const container = measureEl.value
  if (!ruler || !container) return 1
  const mmPx = ruler.getBoundingClientRect().height
  const availH = (297 - layout.pageMargin * 2) * mmPx

  // 测量主栏容器：双栏时找 .pv-main-col，单栏时即容器内的 pv-content
  const mainEl = isSidebar.value
    ? (container.querySelector('.pv-main-col > .pv-content') as HTMLElement)
    : (container.querySelector('.pv-content') as HTMLElement)
  if (!mainEl) return 1

  const children = Array.from(mainEl.children) as HTMLElement[]
  const heights = children.map((c) => c.getBoundingClientRect().height)

  const queue = mainBlocks.value
  const result: PreviewBlock[][] = []
  let current: PreviewBlock[] = []
  // 第一块固定为个人信息头部（仅单栏模式下在主栏）
  let used = isSidebar.value ? 0 : heights[0] ?? 0

  for (let i = 0; i < queue.length; i++) {
    const h = heights[i + (isSidebar.value ? 0 : 1)] ?? 0
    if (used + h <= availH || current.length === 0) {
      current.push(queue[i])
      used += h
    } else {
      result.push(current)
      current = [queue[i]]
      used = h
    }
  }
  if (current.length) result.push(current)
  pages.value = result.length ? result : [[]]
  return Math.max(1, result.length)
}

function scheduleRepaginate() {
  if (repaginateTimer) clearTimeout(repaginateTimer)
  repaginateTimer = setTimeout(() => void repaginate(), 120)
}

watch(
  () => doc,
  () => scheduleRepaginate(),
  { deep: true },
)

// ---------- 智能一页 ----------
watch(
  () => store.ui.onePageSignal,
  async () => {
    for (let step = 0; step < 24; step++) {
      const count = await repaginate()
      if (count <= 1) break
      const patch: Partial<typeof layout> = {}
      if (layout.fontSize > 11.5) patch.fontSize = Math.max(11, layout.fontSize - 0.5)
      if (layout.lineHeight > 1.25) patch.lineHeight = Math.max(1.2, layout.lineHeight - 0.05)
      if (layout.moduleSpacing > 5) patch.moduleSpacing = Math.max(4, layout.moduleSpacing - 1)
      if (layout.itemSpacing > 3) patch.itemSpacing = Math.max(2, layout.itemSpacing - 1)
      if (Object.keys(patch).length === 0) break
      store.updateLayout(patch)
    }
  },
)

// ---------- 下载 / 打印 ----------
watch(
  () => store.ui.downloadSignal,
  () => {
    document.body.classList.add('printing')
    nextTick(() => {
      window.print()
      setTimeout(() => document.body.classList.remove('printing'), 400)
    })
  },
)

// ---------- 生命周期 ----------
function onResize() {
  if (zoom.value === 'auto') fitAuto()
}

onMounted(async () => {
  fitAuto()
  await repaginate()
  window.addEventListener('resize', onResize)
  if (document.fonts?.ready) document.fonts.ready.then(() => void repaginate())
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

const styleVars = computed(() => ({
  fontFamily: layout.fontFamily,
  fontSize: `${layout.fontSize}px`,
  lineHeight: layout.lineHeight,
  '--pv-theme': layout.themeColor,
  '--pv-module-spacing': `${layout.moduleSpacing}px`,
  '--pv-item-spacing': `${layout.itemSpacing}px`,
  '--pv-margin-mm': `${layout.pageMargin}mm`,
}))

const pageCountText = computed(() => `共 ${Math.max(1, pages.value.length)} 页`)

/** 双栏模式下侧栏内容仅在第一页展示，后续页侧栏为空保持色带连续 */
const sideBlocksForPage = (i: number) => (i === 0 ? sideBlocks.value : [])
</script>

<template>
  <section class="preview">
    <div class="preview-toolbar">
      <span class="pt-info">
        <Icon name="print" :size="16" />
        A4 · {{ pageCountText }}
        <span v-if="store.templateName" class="pt-template">· {{ store.templateName }}</span>
      </span>
      <div class="pt-zoom">
        <button type="button" title="缩小" @click="setZoom(Math.max(0.5, Math.round((scale - 0.1) * 10) / 10))">
          <Icon name="close" :size="15" style="transform: rotate(45deg)" />
        </button>
        <select class="pt-select" :value="zoom" @change="setZoom(($event.target as HTMLSelectElement).value === 'auto' ? 'auto' : Number(($event.target as HTMLSelectElement).value))">
          <option value="auto">适合</option>
          <option v-for="z in [0.5, 0.6, 0.7, 0.8, 0.9, 1]" :key="z" :value="z">
            {{ Math.round(z * 100) }}%
          </option>
        </select>
        <button type="button" title="放大" @click="setZoom(Math.min(1, Math.round((scale + 0.1) * 10) / 10))">
          <Icon name="add" :size="17" />
        </button>
      </div>
    </div>

    <div ref="scrollEl" class="preview-scroll">
      <div class="pv-zoom" :style="{ zoom: scale }">
        <ResumePage
          v-for="(page, pi) in pages"
          :key="`${pi}-${isSidebar}`"
          :main-blocks="page"
          :side-blocks="sideBlocksForPage(pi)"
          :sidebar="isSidebar"
          :show-profile="pi === 0"
          :margin-mm="layout.pageMargin"
          :ctx="{ className: store.templateClass }"
          :style-vars="styleVars"
        />
        <div v-if="pages.length === 0" class="pv-page" :style="{ padding: `${layout.pageMargin}mm` }">
          <div class="pv-empty" :style="styleVars">简历内容为空，请在左侧添加模块开始编辑</div>
        </div>
      </div>
    </div>

    <!-- 隐藏测量容器：真实尺寸渲染，用于自动分页 -->
    <div class="pv-measure" aria-hidden="true">
      <div ref="rulerEl" style="height: 1mm; width: 1mm" />
      <div ref="measureEl">
        <!-- 单栏 -->
        <div
          v-if="!isSidebar"
          :style="{
            width: `calc(210mm - ${layout.pageMargin * 2}mm)`,
            ...styleVars,
          }"
        >
          <ResumeContent
            :blocks="mainBlocks"
            first-block-key="__profile__"
            :ctx="{ className: store.templateClass }"
          />
        </div>
        <!-- 双栏 -->
        <div v-else style="display: flex; width: 210mm" :class="store.templateClass">
          <div style="width: 60mm; padding: 8mm; flex-shrink: 0" :style="styleVars">
            <ResumeContent :blocks="sideBlocks" first-block-key="__profile__" :ctx="{}" />
          </div>
          <div class="pv-main-col" style="flex: 1; min-width: 0" :style="styleVars">
            <ResumeContent :blocks="mainBlocks" :ctx="{}" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.preview {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}
.preview-toolbar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}
.pt-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-light);
}
.pt-template {
  color: var(--brand);
  font-weight: 500;
}
.pt-zoom {
  display: flex;
  align-items: center;
  gap: 2px;
}
.pt-zoom button {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pt-zoom button:hover {
  background: #e9ebee;
}
.pt-select {
  height: 26px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: var(--text-sub);
  padding: 0 4px;
  cursor: pointer;
}
.preview-scroll {
  flex: 1;
  overflow: auto;
  padding: 0 24px 40px;
}
.pv-zoom {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pv-empty {
  color: var(--text-light);
  text-align: center;
  padding-top: 300px;
}
.pv-measure {
  position: absolute;
  left: -10000px;
  top: 0;
  visibility: hidden;
  pointer-events: none;
}
</style>
