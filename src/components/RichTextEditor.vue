<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const root = ref<HTMLDivElement>()

onMounted(() => {
  const el = root.value
  if (!el) return
  el.innerHTML = props.modelValue || ''
  // 让回车生成 <p> 而不是 <div>
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      document.execCommand('formatBlock', false, 'p')
    }
  })
})

/** 输入时同步到父组件（去掉首尾空白） */
function onInput() {
  const el = root.value
  if (!el) return
  emit('update:modelValue', el.innerHTML)
}

/** 粘贴为纯文本，避免外部样式污染简历 */
function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, text)
}

watch(
  () => props.modelValue,
  (v) => {
    const el = root.value
    // 外部变更（如撤销恢复）且与当前 DOM 不一致时同步
    if (el && el.innerHTML !== v) el.innerHTML = v || ''
  },
)

// ---------- 工具栏命令 ----------
function cmd(command: string, value?: string) {
  root.value?.focus()
  document.execCommand(command, false, value)
  onInput()
}

const TOOLS: { cmd: string; val?: string; label: string; title: string }[] = [
  { cmd: 'bold', label: 'B', title: '加粗（Ctrl+B）' },
  { cmd: 'italic', label: 'I', title: '斜体（Ctrl+I）' },
  { cmd: 'underline', label: 'U', title: '下划线（Ctrl+U）' },
  { cmd: 'insertUnorderedList', label: '• 列表', title: '无序列表' },
]
</script>

<template>
  <div class="rt">
    <div class="rt-toolbar">
      <button
        v-for="t in TOOLS"
        :key="t.cmd"
        class="rt-tool"
        :class="{ [`rt-tool-${t.cmd}`]: true }"
        type="button"
        :title="t.title"
        @mousedown.prevent
        @click="cmd(t.cmd, t.val)"
      >
        {{ t.label }}
      </button>
    </div>
    <div
      ref="root"
      class="rt-editor"
      contenteditable="true"
      spellcheck="false"
      :data-placeholder="placeholder ?? '输入内容，支持加粗、斜体、下划线和列表'"
      @input="onInput"
      @paste="onPaste"
    />
  </div>
</template>

<style scoped>
.rt {
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.rt-toolbar {
  display: flex;
  gap: 2px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--border);
  background: #fafbfc;
}
.rt-tool {
  min-width: 26px;
  height: 24px;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-sub);
}
.rt-tool:hover {
  background: #eef0f3;
  color: var(--text-main);
}
.rt-tool-bold {
  font-weight: 700;
}
.rt-tool-italic {
  font-style: italic;
}
.rt-tool-underline {
  text-decoration: underline;
}
.rt-tool-insertUnorderedList {
  font-size: 12px;
}
.rt-editor {
  min-height: 84px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 10px;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
}
.rt-editor:empty::before {
  content: attr(data-placeholder);
  color: var(--text-light);
}
.rt-editor :deep(p) {
  margin: 0 0 4px;
}
.rt-editor :deep(p:last-child) {
  margin-bottom: 0;
}
.rt-editor :deep(ul) {
  margin: 0 0 4px;
  padding-left: 20px;
  list-style: disc;
}
</style>
