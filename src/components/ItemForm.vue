<script setup lang="ts">
import { computed } from 'vue'
import type { ResumeItem, ResumeModule } from '@/types/resume'
import { MODULE_SCHEMAS } from '@/data/constants'
import { useResumeStore } from '@/store/resume'
import DescEditor from './DescEditor.vue'
import TipLabel from './TipLabel.vue'

const props = defineProps<{ module: ResumeModule; item: ResumeItem }>()
const store = useResumeStore()

const schema = computed(() =>
  props.module.type === 'profile' ? [] : MODULE_SCHEMAS[props.module.type] ?? [],
)

const desc = computed({
  get: () => props.item.desc,
  set: (v: string[]) => store.updateItemDesc(props.module.id, props.item.id, v),
})

/** 描述编辑模式（缺省为要点模式，兼容旧数据） */
const rich = computed(() => props.item.descType === 'rich')

/** 富文本内容（HTML 片段），与纯文本要点分开持久化 */
const richHtml = computed({
  get: () => props.item.richDesc ?? '',
  set: (v: string) => store.updateItemRichDesc(props.module.id, props.item.id, v),
})

function onRichChange(v: boolean) {
  store.updateItemDescType(props.module.id, props.item.id, v ? 'rich' : 'points')
}

/** 摘要式模块的头部预览文本 */
const summaryText = computed(() => props.item.desc.join(' '))
</script>

<template>
  <div class="if">
    <div v-if="schema.length" class="if-fields" :class="{ single: schema.length === 1 }">
      <div v-for="f in schema" :key="f.key" class="if-field">
        <TipLabel :label="f.label" :tip="f.tip" />
        <input
          class="form-input"
          :value="item.fields[f.key] ?? ''"
          :placeholder="f.placeholder ?? f.label"
          @input="store.updateItemField(module.id, item.id, f.key, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div v-if="module.type === 'personal_summary'" class="if-summary">
      <TipLabel
        label="个人总结"
        tip="用 3-4 行概括你的核心竞争力：背景 + 核心技能 + 亮点成果，建议控制在 300 字以内"
      />
      <textarea
        class="form-input if-textarea"
        rows="5"
        :value="item.desc.join('\n')"
        placeholder="概括你的核心竞争力"
        @input="
          store.updateItemDesc(module.id, item.id, ($event.target as HTMLTextAreaElement).value.split('\n'))
        "
      />
      <p v-if="summaryText.length > 300" class="if-hint">
        当前 {{ summaryText.length }} 字，建议控制在 300 字以内
      </p>
    </div>

    <DescEditor
      v-else
      v-model="desc"
      :rich="rich"
      :rich-html="richHtml"
      @update:rich="onRichChange"
      @update:rich-html="richHtml = $event"
    />
  </div>
</template>

<style scoped>
.if {
  padding: 14px 16px 6px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fafbfc;
  margin-bottom: 10px;
}
.if-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.if-fields.single {
  grid-template-columns: 1fr;
}
.if-textarea {
  line-height: 1.7;
}
.if-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #e6a23c;
}
</style>
