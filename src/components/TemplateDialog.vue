<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ResumeTemplate } from '@/types/resume'
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/templates'
import { useResumeStore } from '@/store/resume'
import TemplateThumb from './TemplateThumb.vue'

type TabKey = (typeof TEMPLATE_CATEGORIES)[number]['key']

const store = useResumeStore()
const emit = defineEmits<{ (e: 'close'): void }>()

const activeTab = ref<TabKey>('all')

const list = computed(() =>
  activeTab.value === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeTab.value),
)

const currentId = computed(() => store.doc.templateId)

function apply(t: ResumeTemplate) {
  // 应用模板但不关闭抽屉，方便连续切换对比效果
  store.applyTemplate(t.id)
}

function tabCount(key: TabKey) {
  if (key === 'custom') return 0
  return key === 'all' ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === key).length
}

/* ---------- 滚动隔离：鼠标在抽屉中滚动不影响底层简历页 ---------- */
const bodyEl = ref<HTMLElement>()

function onWheel(e: WheelEvent) {
  const body = bodyEl.value
  if (!body) return
  const inside = body.contains(e.target as Node)
  const canScroll = body.scrollHeight > body.clientHeight + 1
  // 不在滚动区内 / 内容不足一屏：完全拦截
  if (!inside || !canScroll) {
    e.preventDefault()
    return
  }
  // 已滚到边界仍继续滚动：拦截，避免穿透滚动简历页
  const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1
  const atTop = body.scrollTop <= 0
  if ((e.deltaY > 0 && atBottom) || (e.deltaY < 0 && atTop)) {
    e.preventDefault()
  }
}
</script>

<template>
  <!-- 左侧抽屉：模板选择 -->
  <div class="tpl-backdrop" @click.self="emit('close')" @wheel="onWheel">
    <aside class="tpl-drawer">
      <header class="tpl-head">
        <h1 class="tpl-title">
          <Icon name="palette" :size="18" />
          简历模板
        </h1>
        <button class="tpl-close" type="button" title="关闭" @click="emit('close')">
          <Icon name="close" :size="18" />
        </button>
      </header>

      <nav class="tpl-tabs">
        <button
          v-for="c in TEMPLATE_CATEGORIES"
          :key="c.key"
          class="tpl-tab"
          :class="{ active: activeTab === c.key }"
          type="button"
          @click="activeTab = c.key"
        >
          {{ c.label }}
          <span v-if="tabCount(c.key)" class="tpl-tab-count">{{ tabCount(c.key) }}</span>
        </button>
      </nav>

      <div ref="bodyEl" class="tpl-body">
        <div v-if="activeTab === 'custom'" class="tpl-empty">
          <Icon name="edit" :size="36" />
          <p>自定义模板即将上线</p>
          <p class="tpl-empty-sub">当前可通过顶部工具栏的字体 / 主题色 / 间距等自由搭配</p>
        </div>
        <div v-else class="tpl-grid">
          <button
            v-for="t in list"
            :key="t.id"
            class="tpl-card"
            :class="{ active: t.id === currentId }"
            type="button"
            @click="apply(t)"
          >
            <div class="tpl-card-thumb">
              <TemplateThumb :template="t" />
              <span v-if="t.id === currentId" class="tpl-badge">
                <Icon name="check-circle" :size="14" />
                使用中
              </span>
            </div>
            <div class="tpl-card-name">{{ t.name }}</div>
            <div class="tpl-card-desc">{{ t.desc }}</div>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* ---------- 遮罩 ---------- */
.tpl-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(24, 32, 38, 0.32);
  animation: fadeIn 0.18s ease;
}

/* ---------- 左侧抽屉 ---------- */
.tpl-drawer {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 480px;
  max-width: 92vw;
  background: #f7f8fa;
  border-right: 1px solid var(--border);
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.22s ease;
}

.tpl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
  flex-shrink: 0;
}
.tpl-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
}
.tpl-title .icon {
  color: var(--brand);
}
.tpl-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.tpl-close:hover {
  background: #eceef1;
  color: var(--text-main);
}

/* ---------- 分类 tab ---------- */
.tpl-tabs {
  display: flex;
  gap: 20px;
  padding: 14px 20px 0;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}
.tpl-tabs::-webkit-scrollbar {
  display: none;
}
.tpl-tab {
  position: relative;
  font-size: 14px;
  color: var(--text-light);
  padding: 0 2px 12px;
  white-space: nowrap;
  transition: color 0.15s;
}
.tpl-tab:hover {
  color: var(--text-sub);
}
.tpl-tab.active {
  color: var(--brand);
  font-weight: 600;
}
.tpl-tab.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -1px;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  border-radius: 2px;
  background: var(--brand);
}
.tpl-tab-count {
  font-size: 11px;
  color: var(--text-light);
  margin-left: 2px;
}
.tpl-tab.active .tpl-tab-count {
  color: var(--brand);
  opacity: 0.7;
}

/* ---------- 模板网格 ---------- */
.tpl-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px 24px;
  /* 滚动链截断：鼠标在抽屉中滚动时不穿透影响底层简历页 */
  overscroll-behavior: contain;
}
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.tpl-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  transition: all 0.15s;
}
.tpl-card:hover {
  border-color: #c9cdd3;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.tpl-card:hover .tpl-card-thumb {
  transform: translateY(-2px);
}
.tpl-card.active {
  border-color: var(--brand);
  box-shadow: 0 0 0 1px var(--brand), 0 4px 14px rgba(20, 181, 138, 0.12);
}
.tpl-card-thumb {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.18s;
}
.tpl-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--brand);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  border-radius: 10px;
  padding: 3px 8px;
  box-shadow: 0 2px 6px rgba(20, 181, 138, 0.35);
}
.tpl-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}
.tpl-card.active .tpl-card-name {
  color: var(--brand);
}
.tpl-card-desc {
  font-size: 12px;
  color: var(--text-light);
  line-height: 1.4;
}

/* ---------- 空态 ---------- */
.tpl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 100px 0;
  color: var(--text-light);
}
.tpl-empty p {
  font-size: 15px;
  color: var(--text-sub);
}
.tpl-empty-sub {
  font-size: 12px !important;
  color: var(--text-light) !important;
}

/* ---------- 动画 ---------- */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
