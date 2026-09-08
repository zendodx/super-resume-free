<script setup lang="ts">
import { computed } from 'vue'
import type { ResumeItem, ResumeModule } from '@/types/resume'
import { MODULE_SCHEMAS } from '@/data/constants'
import { useResumeStore } from '@/store/resume'
import DescEditor from './DescEditor.vue'

const props = defineProps<{ module: ResumeModule; item: ResumeItem }>()
const store = useResumeStore()

const schema = computed(() =>
  props.module.type === 'profile' ? [] : MODULE_SCHEMAS[props.module.type] ?? [],
)

const desc = computed({
  get: () => props.item.desc,
  set: (v: string[]) => store.updateItemDesc(props.module.id, props.item.id, v),
})

/** 摘要式模块的头部预览文本 */
const summaryText = computed(() => props.item.desc.join(' '))
</script>

<template>
  <div class="if">
    <div v-if="schema.length" class="if-fields" :class="{ single: schema.length === 1 }">
      <div v-for="f in schema" :key="f.key" class="if-field">
        <label class="form-label">{{ f.label }}</label>
        <input
          class="form-input"
          :value="item.fields[f.key] ?? ''"
          :placeholder="f.placeholder ?? f.label"
          @input="store.updateItemField(module.id, item.id, f.key, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div v-if="module.type === 'personal_summary'" class="if-summary">
      <label class="form-label">个人总结</label>
      <textarea
        class="form-input if-textarea"
        rows="5"
        :value="item.desc.join('\n')"
        placeholder="用 3-4 行概括你的核心竞争力：背景 + 核心技能 + 亮点成果"
        @input="
          store.updateItemDesc(module.id, item.id, ($event.target as HTMLTextAreaElement).value.split('\n'))
        "
      />
      <p v-if="summaryText.length > 300" class="if-hint">
        当前 {{ summaryText.length }} 字，建议控制在 300 字以内
      </p>
    </div>

    <DescEditor v-else v-model="desc" />
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
  gap: 10px 12px;
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
