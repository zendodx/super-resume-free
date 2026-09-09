<script setup lang="ts">
import { ref, watch } from 'vue'
import { copyText } from '@/utils/file'

const props = defineProps<{
  /** import：粘贴导入；export：只读展示 JSON 文本 */
  mode: 'import' | 'export'
  title: string
  text?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'import', text: string): void
  (e: 'copied'): void
}>()

const input = ref('')
watch(
  () => props.text,
  (v) => {
    if (v !== undefined) input.value = v
  },
  { immediate: true },
)

const copying = ref(false)
async function onCopy() {
  copying.value = true
  const ok = await copyText(input.value)
  copying.value = false
  if (ok) emit('copied')
  else window.alert('复制失败，请手动全选复制')
}

function onImport() {
  const text = input.value.trim()
  if (!text) {
    window.alert('请先粘贴 JSON 内容')
    return
  }
  emit('import', text)
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal jtd" style="min-width: 560px">
      <div class="modal-header">
        <span class="jtd-title">
          <Icon :name="mode === 'import' ? 'upload' : 'save'" :size="17" />
          {{ title }}
        </span>
        <button class="jtd-close" type="button" @click="emit('close')">
          <Icon name="close" :size="18" />
        </button>
      </div>
      <div class="modal-body">
        <p v-if="mode === 'import'" class="jtd-tip">
          支持粘贴「整库备份 JSON」或「单份简历 JSON」，可先在其他设备「复制 JSON」再粘贴到此处导入。
        </p>
        <textarea
          v-model="input"
          class="jtd-area"
          :readonly="mode === 'export'"
          :placeholder="mode === 'import' ? '在此粘贴 JSON 内容…' : ''"
          spellcheck="false"
        ></textarea>
      </div>
      <div class="modal-footer jtd-footer">
        <div class="jtd-footer-left">
          <span v-if="mode === 'export'" class="jtd-count">{{ input.length }} 字符</span>
        </div>
        <div class="jtd-footer-right">
          <button class="btn btn-ghost" type="button" @click="emit('close')">关闭</button>
          <button
            v-if="mode === 'import'"
            class="btn btn-primary"
            type="button"
            @click="onImport"
          >
            导入
          </button>
          <button
            v-else
            class="btn btn-primary"
            type="button"
            :disabled="copying"
            @click="onCopy"
          >
            <Icon name="copy" :size="15" />
            {{ copying ? '复制中…' : '复制 JSON' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jtd-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.jtd-title .icon {
  color: var(--brand);
}
.jtd-close {
  color: var(--text-light);
  display: flex;
}
.jtd-close:hover {
  color: var(--text-main);
}
.jtd-tip {
  font-size: 12px;
  color: var(--text-sub);
  line-height: 1.6;
  margin-bottom: 10px;
}
.jtd-area {
  width: 100%;
  height: 300px;
  box-sizing: border-box;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-main);
  background: #fff;
  outline: none;
}
.jtd-area:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px rgba(20, 181, 138, 0.12);
}
.jtd-area[readonly] {
  background: #f8f9fa;
}
.jtd-footer {
  justify-content: space-between;
}
.jtd-footer-left {
  display: flex;
  align-items: center;
}
.jtd-count {
  font-size: 12px;
  color: var(--text-light);
}
.jtd-footer-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
</style>
