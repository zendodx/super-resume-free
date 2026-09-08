<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ResumeDoc } from '@/types/resume'
import ResumePage from './ResumePage.vue'
import type { PreviewBlock } from './ResumeContent.vue'
import { buildBlocks } from '@/utils/blocks'
import { SIDEBAR_TYPES } from '@/templates/sample'
import { getTemplate } from '@/templates'

const props = defineProps<{ doc: ResumeDoc }>()

const blocks = computed<PreviewBlock[]>(() => buildBlocks(props.doc.modules))

const isSidebar = computed(() => props.doc.pageStyle === 'sidebar-left')

const sideBlocks = computed<PreviewBlock[]>(() =>
  isSidebar.value ? blocks.value.filter((b) => SIDEBAR_TYPES.includes(b.module.type)) : [],
)
const mainBlocks = computed<PreviewBlock[]>(() =>
  isSidebar.value ? blocks.value.filter((b) => !SIDEBAR_TYPES.includes(b.module.type)) : blocks.value,
)

const ctx = computed(() => ({
  titleStyle: props.doc.titleStyle,
  profileStyle: props.doc.profileStyle,
  className: getTemplate(props.doc.templateId)?.className ?? '',
}))

const styleVars = computed(() => {
  const l = props.doc.layout
  return {
    fontFamily: l.fontFamily,
    fontSize: `${l.fontSize}px`,
    lineHeight: l.lineHeight,
    '--pv-theme': l.themeColor,
    '--pv-module-spacing': `${l.moduleSpacing}px`,
    '--pv-item-spacing': `${l.itemSpacing}px`,
    '--pv-margin-mm': `${l.pageMargin}mm`,
  }
})

// ---------- 缩放适配卡片宽度 ----------
const clipEl = ref<HTMLElement>()
const zoom = ref(0.2)
let observer: ResizeObserver | null = null

onMounted(() => {
  const el = clipEl.value
  if (!el) return
  const PAGE_W = 793.7 // 210mm @96dpi
  const update = () => (zoom.value = el.clientWidth / PAGE_W)
  update()
  observer = new ResizeObserver(update)
  observer.observe(el)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="clipEl" class="dt-clip">
    <div class="dt-scale" :style="{ zoom }">
      <ResumePage
        class="dt-page"
        :main-blocks="mainBlocks"
        :side-blocks="sideBlocks"
        :sidebar="isSidebar"
        :show-profile="true"
        :margin-mm="doc.layout.pageMargin"
        :ctx="ctx"
        :style-vars="styleVars"
        :profile-override="doc.profile"
      />
    </div>
  </div>
</template>

<style scoped>
.dt-clip {
  width: 100%;
  aspect-ratio: 210 / 297;
  overflow: hidden;
  background: #fff;
}
.dt-scale {
  width: 210mm;
  transform-origin: top left;
}
.dt-page {
  margin-bottom: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  min-height: 297mm;
}
</style>
