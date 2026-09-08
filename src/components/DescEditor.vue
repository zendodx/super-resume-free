<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: string[]; placeholder?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>()

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
</script>

<template>
  <div class="de">
    <label class="form-label">具体内容（每行一个要点，建议使用「动词 + 做了什么 + 结果」）</label>
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
  </div>
</template>

<style scoped>
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
