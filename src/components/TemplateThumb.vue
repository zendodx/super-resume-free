<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ResumeTemplate } from '@/types/resume'
import ResumePage from './ResumePage.vue'
import type { PreviewBlock } from './ResumeContent.vue'
import { SAMPLE_MODULES, SAMPLE_PROFILE, SIDEBAR_TYPES } from '@/templates/sample'

const props = defineProps<{ template: ResumeTemplate }>()

/** 由样例模块构建分页块（与正式预览同一渲染逻辑） */
const sampleBlocks = computed<PreviewBlock[]>(() =>
  SAMPLE_MODULES.map((m) => ({ key: m.id, module: m, items: m.items, showTitle: true })),
)

const isSidebar = computed(() => props.template.pageStyle.startsWith('sidebar'))
const sidebarRight = computed(() => props.template.pageStyle === 'sidebar-right')
/** 双栏时放入侧栏的模块类型：模板可自定义，缺省为技能/荣誉/证书 */
const sideTypes = computed(() => props.template.sideModules ?? SIDEBAR_TYPES)

const sideBlocks = computed<PreviewBlock[]>(() =>
  isSidebar.value ? sampleBlocks.value.filter((b) => sideTypes.value.includes(b.module.type)) : [],
)
const mainBlocks = computed<PreviewBlock[]>(() =>
  isSidebar.value
    ? sampleBlocks.value.filter((b) => !sideTypes.value.includes(b.module.type))
    : sampleBlocks.value,
)

const ctx = computed(() => ({
  titleStyle: props.template.titleStyle,
  profileStyle: props.template.profileStyle,
  className: props.template.className,
}))

const styleVars = computed(() => {
  const l = props.template.layout
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
  <div ref="clipEl" class="tt-clip">
    <div class="tt-scale" :style="{ zoom }">
      <ResumePage
        class="tt-page"
        :main-blocks="mainBlocks"
        :side-blocks="sideBlocks"
        :sidebar="isSidebar"
        :sidebar-right="sidebarRight"
        :show-profile="true"
        :margin-mm="template.layout.pageMargin"
        :ctx="ctx"
        :style-vars="styleVars"
        :profile-override="SAMPLE_PROFILE"
      />
    </div>
  </div>
</template>

<style scoped>
.tt-clip {
  width: 100%;
  aspect-ratio: 210 / 297;
  overflow: hidden;
  background: #fff;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.tt-scale {
  width: 210mm;
  transform-origin: top left;
}
/* 覆盖页面投影与圆角，缩略图不需要 */
.tt-page {
  margin-bottom: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  min-height: 297mm;
}
</style>
