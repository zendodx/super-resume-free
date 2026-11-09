<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RichTextEditor from './RichTextEditor.vue'
import { pointsToRich, richToPoints } from '@/utils/richText'

const props = defineProps<{
  /** 要点列表（纯文本） */
  modelValue: string[]
  placeholder?: string
  /** 是否富文本模式 */
  rich?: boolean
  /** 富文本内容（HTML 片段），由父组件持久化，切换往返不丢失 */
  richHtml?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string[]): void
  (e: 'update:rich', v: boolean): void
  (e: 'update:richHtml', v: string): void
}>()

const rich = computed(() => props.rich ?? false)

/** 内部维护行数据：避免同一 tick 内多次操作因 props 延迟更新而丢失 */
const lines = ref<string[]>([...props.modelValue])

watch(
  () => props.modelValue,
  (v) => {
    if (v.join('\u0000') !== lines.value.join('\u0000')) lines.value = [...v]
  },
)
watch(
  lines,
  (v) => emit('update:modelValue', [...v]),
  { deep: true },
)

function updateLine(i: number, v: string) {
  lines.value[i] = v
}

function removeLine(i: number) {
  lines.value.splice(i, 1)
}

function addLine() {
  lines.value.push('')
}

/** 空行回车时不换行，而是新增一个要点输入框 */
function onKeydown(e: KeyboardEvent, i: number) {
  if (e.key === 'Enter' && lines.value[i] !== '') {
    e.preventDefault()
    lines.value.splice(i + 1, 0, '')
    // 聚焦新增行
    requestAnimationFrame(() => {
      const els = document.querySelectorAll<HTMLInputElement>('.de-input')
      els[i + 1]?.focus()
    })
  }
}

// ---------- 模式切换（内容互转不丢失） ----------

/**
 * 切换到富文本：
 * - 若此前保留过富文本内容（从富文本切回来），直接复用（格式不丢）；
 * - 否则把当前要点转为段落。
 */
function toRich() {
  let html = props.richHtml ?? ''
  if (!html.trim()) html = pointsToRich(props.modelValue)
  emit('update:richHtml', html)
  emit('update:modelValue', richToPoints(html))
  emit('update:rich', true)
}

/** 切换回要点：富文本按块级元素拆为纯文本要点（富文本内容仍保留在 richHtml 中） */
function toPoints() {
  const pts = richToPoints(props.richHtml ?? '')
  lines.value = pts.length ? pts : ['']
  emit('update:modelValue', lines.value.slice())
  emit('update:rich', false)
}

/** 富文本输入：同步持久化 HTML，并保持纯文本要点始终可用（导出/降级不失效） */
function onRichInput(html: string) {
  emit('update:richHtml', html)
  emit('update:modelValue', richToPoints(html))
}
</script>

<template>
  <div class="de">
    <div class="de-head">
      <label class="form-label">
        {{ rich ? '具体内容（富文本，支持加粗 / 斜体 / 下划线 / 列表）' : '具体内容（每行一个要点，建议使用「动词 + 做了什么 + 结果」）' }}
      </label>
      <div class="de-mode">
        <button
          type="button"
          class="de-mode-btn"
          :class="{ active: !rich }"
          :disabled="!rich"
          @click="toPoints"
        >要点</button>
        <button
          type="button"
          class="de-mode-btn"
          :class="{ active: rich }"
          :disabled="rich"
          @click="toRich"
        >富文本</button>
      </div>
    </div>

    <!-- 富文本模式 -->
    <RichTextEditor
      v-if="rich"
      :model-value="props.richHtml ?? ''"
      :placeholder="placeholder ?? '输入内容，支持加粗、斜体、下划线和列表'"
      @update:model-value="onRichInput"
    />

    <!-- 要点模式 -->
    <template v-else>
      <div v-for="(line, i) in lines" :key="i" class="de-line">
        <span class="de-dot">•</span>
        <input
          class="form-input de-input"
          :value="line"
          :placeholder="placeholder ?? '请输入内容'"
          @input="updateLine(i, ($event.target as HTMLInputElement).value)"
          @keydown="onKeydown($event, i)"
        />
        <button class="de-del" type="button" title="删除此行" @click="removeLine(i)">
          <Icon name="close" :size="16" />
        </button>
      </div>
      <button class="de-add" type="button" @click="addLine">
        <Icon name="add" :size="17" />
        添加要点
      </button>
    </template>
  </div>
</template>

<style scoped>
.de-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.de-head .form-label {
  margin-bottom: 0;
}
.de-mode {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}
.de-mode-btn {
  padding: 3px 10px;
  font-size: 12px;
  color: var(--text-sub);
  background: #fff;
  cursor: pointer;
}
.de-mode-btn + .de-mode-btn {
  border-left: 1px solid var(--border);
}
.de-mode-btn.active {
  background: var(--brand);
  color: #fff;
}
.de-mode-btn:disabled {
  cursor: default;
}
.de-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.de-dot {
  color: var(--brand);
  font-weight: 700;
  width: 10px;
  text-align: center;
  flex-shrink: 0;
}
.de-input {
  flex: 1;
}
.de-del {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  visibility: hidden;
}
.de-line:hover .de-del {
  visibility: visible;
}
.de-del:hover {
  color: var(--danger);
  background: #fdf0f0;
}
.de-add {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--brand);
  padding: 4px 2px;
  margin-left: 16px;
}
.de-add:hover {
  opacity: 0.85;
}
</style>
