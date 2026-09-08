<script setup lang="ts">
import { useResumeStore } from '@/store/resume'
import { MODULE_CATALOG } from '@/data/constants'

const store = useResumeStore()
const emit = defineEmits<{ (e: 'close'): void }>()

function exists(type: string) {
  return store.doc.modules.some((m) => m.type === type)
}

function add(type: (typeof MODULE_CATALOG)[number]['type']) {
  store.addModule(type)
  emit('close')
}
</script>

<template>
  <div class="modal-mask" @mousedown.self="emit('close')">
    <div class="modal am-modal">
      <div class="modal-header">
        添加模块
        <button class="am-close" type="button" @click="emit('close')">
          <Icon name="close" :size="20" />
        </button>
      </div>
      <div class="modal-body">
        <ul class="am-list">
          <li v-for="m in MODULE_CATALOG" :key="m.type">
            <div class="am-info">
              <div class="am-title">{{ m.title }}</div>
              <div class="am-desc">{{ m.desc }}</div>
            </div>
            <button class="btn am-btn" :class="exists(m.type) ? 'btn-ghost' : 'btn-primary'" type="button" @click="add(m.type)">
              {{ exists(m.type) ? '再添加一个' : '添加' }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.am-close {
  color: var(--text-light);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.am-close:hover {
  background: #f0f1f3;
  color: var(--text-main);
}
.am-modal {
  min-width: 460px;
}
.am-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 10px;
  transition: border-color 0.15s;
}
.am-list li:hover {
  border-color: var(--brand);
}
.am-title {
  font-size: 14px;
  font-weight: 500;
}
.am-desc {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 3px;
}
.am-btn {
  height: 30px;
  padding: 0 14px;
  flex-shrink: 0;
}
</style>
