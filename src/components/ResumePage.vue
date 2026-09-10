<script setup lang="ts">
import type { Profile } from '@/types/resume'
import ResumeContent, { type PreviewBlock, type PreviewCtx } from './ResumeContent.vue'

defineProps<{
  /** 主栏块 */
  mainBlocks: PreviewBlock[]
  /** 侧栏块（仅双栏布局） */
  sideBlocks?: PreviewBlock[]
  /** 是否双栏布局 */
  sidebar: boolean
  /** 双栏时侧栏是否置于右侧 */
  sidebarRight?: boolean
  /** 是否渲染个人信息头部 */
  showProfile: boolean
  /** 页边距 mm */
  marginMm: number
  /** 渲染上下文（模板样式类 / 标题风格覆盖） */
  ctx?: PreviewCtx
  /** 样式变量（字体/字号/行距/主题色/间距） */
  styleVars: Record<string, string | number>
  /** 个人信息覆盖（缩略图用样例数据） */
  profileOverride?: Profile
}>()
</script>

<template>
  <div
    class="pv-page"
    :class="[{ 'pv-page-sidebar': sidebar }, ctx?.className ?? '']"
    :style="{ ...styleVars, ...(sidebar ? {} : { padding: `${marginMm}mm` }) }"
  >
    <template v-if="sidebar">
      <!-- 右侧栏：先渲染主栏 -->
      <div v-if="sidebarRight" class="pv-main-col" :style="{ padding: `${marginMm}mm` }">
        <ResumeContent :blocks="mainBlocks" :first-block-key="mainBlocks[0]?.key" :ctx="ctx" />
      </div>
      <div class="pv-side-col" :style="{ padding: `${marginMm}mm 8mm` }">
        <ResumeContent
          :blocks="sideBlocks ?? []"
          :first-block-key="showProfile ? '__profile__' : undefined"
          :ctx="ctx"
          :profile-override="profileOverride"
        />
      </div>
      <div v-if="!sidebarRight" class="pv-main-col" :style="{ padding: `${marginMm}mm` }">
        <ResumeContent :blocks="mainBlocks" :first-block-key="mainBlocks[0]?.key" :ctx="ctx" />
      </div>
    </template>
    <ResumeContent
      v-else
      :blocks="mainBlocks"
      :first-block-key="showProfile ? '__profile__' : mainBlocks[0]?.key"
      :ctx="ctx"
      :profile-override="profileOverride"
    />
  </div>
</template>

<style scoped>
.pv-page {
  width: 210mm;
  min-height: 297mm;
  background-color: #fff;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.12);
  border-radius: 2px;
  margin-bottom: 20px;
  flex-shrink: 0;
  overflow: hidden;
}
</style>
