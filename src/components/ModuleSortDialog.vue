<script setup lang="ts">
import { ref } from 'vue'
import { useResumeStore } from '@/store/resume'

const store = useResumeStore()
const emit = defineEmits<{ (e: 'close'): void }>()

const list = ref(store.doc.modules.map((m) => ({ id: m.id, title: m.title, hidden: m.hidden })))

let dragIndex = -1

function onDragStart(i: number) {
  dragIndex = i
}
function onDrop(i: number) {
  if (dragIndex < 0 || dragIndex === i) return
  const [moved] = list.value.splice(dragIndex, 1)
  list.value.splice(i, 0, moved)
  dragIndex = -1
}
function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= list.value.length) return
  const [m] = list.value.splice(i, 1)
  list.value.splice(j, 0, m)
}

function apply() {
  store.setModuleOrder(list.value.map((x) => x.id))
  emit('close')
}
</script>

<template>
  <div class="modal-mask" @mousedown.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        模块排序
        <button class="ms-close" type="button" @click="emit('close')">
          <Icon name="close" :size="20" />
        </button>
      </div>
      <div class="modal-body">
        <p class="ms-tip">拖拽模块或使用箭头调整顺序，顺序与左侧编辑面板一致</p>
        <ul class="ms-list">
          <li
            v-for="(m, i) in list"
            :key="m.id"
            draggable="true"
            @dragstart="onDragStart(i)"
            @dragover.prevent
            @drop="onDrop(i)"
          >
            <Icon name="drag" :size="19" class="ms-drag" />
            <span class="ms-title">{{ m.title }}</span>
            <span v-if="m.hidden" class="ms-hidden">已隐藏</span>
            <span class="ms-ops">
              <button type="button" :disabled="i === 0" @click="move(i, -1)">
                <Icon name="arrow-up" :size="17" />
              </button>
              <button type="button" :disabled="i === list.length - 1" @click="move(i, 1)">
                <Icon name="arrow-down" :size="17" />
              </button>
            </span>
          </li>
        </ul>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" @click="apply">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ms-close {
  color: var(--text-light);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ms-close:hover {
  background: #f0f1f3;
  color: var(--text-main);
}
.ms-tip {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 12px;
}
.ms-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fff;
  cursor: grab;
}
.ms-list li:active {
  cursor: grabbing;
}
.ms-drag {
  color: var(--text-light);
}
.ms-title {
  flex: 1;
  font-size: 14px;
}
.ms-hidden {
  font-size: 11px;
  color: #e6a23c;
  background: #fdf6ec;
  border-radius: 4px;
  padding: 2px 6px;
}
.ms-ops {
  display: flex;
  gap: 4px;
}
.ms-ops button {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ms-ops button:hover:not(:disabled) {
  background: #f0f1f3;
  color: var(--text-main);
}
.ms-ops button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
