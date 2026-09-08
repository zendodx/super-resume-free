<script setup lang="ts">
import { ref } from 'vue'
import type { ResumeModule } from '@/types/resume'
import { useResumeStore } from '@/store/resume'
import ItemForm from './ItemForm.vue'

const props = defineProps<{ module: ResumeModule; index: number; total: number }>()
const store = useResumeStore()

const collapsed = ref(false)
const editingTitle = ref(false)
const titleDraft = ref('')
const confirmDelete = ref(false)

const iconFor: Record<string, string> = {
  personal_summary: 'edit',
  educations: 'font',
  works: 'person',
  internships: 'person',
  projects: 'sort',
  orgs: 'person',
  skills: 'check-circle',
  awards: 'check',
  certificates: 'check',
  custom: 'add',
}

function startRename() {
  titleDraft.value = props.module.title
  editingTitle.value = true
}
function commitRename() {
  store.renameModule(props.module.id, titleDraft.value)
  editingTitle.value = false
}
</script>

<template>
  <section class="mc" :class="{ hidden: module.hidden }">
    <div class="mc-head">
      <div class="mc-head-left">
        <span class="mc-icon"><Icon :name="iconFor[module.type] ?? 'edit'" :size="18" /></span>
        <input
          v-if="editingTitle"
          v-model="titleDraft"
          class="mc-title-input"
          @keyup.enter="commitRename"
          @blur="commitRename"
          v-focus
        />
        <div v-else class="mc-title" title="点击重命名" @click="startRename">
          {{ module.title }}
          <Icon name="edit" :size="15" class="mc-title-edit" />
        </div>
        <span class="mc-count">{{ module.items.length }}条</span>
      </div>
      <div class="mc-head-right">
        <button
          type="button"
          :title="module.hidden ? '显示模块' : '隐藏模块（不显示在简历中）'"
          @click="store.toggleModuleHidden(module.id)"
        >
          <Icon :name="module.hidden ? 'invisible' : 'visible'" :size="19" />
        </button>
        <button
          v-if="index > 0"
          type="button"
          title="上移模块"
          @click="store.moveModule(module.id, -1)"
        >
          <Icon name="arrow-up" :size="19" />
        </button>
        <button
          v-if="index < total - 1"
          type="button"
          title="下移模块"
          @click="store.moveModule(module.id, 1)"
        >
          <Icon name="arrow-down" :size="19" />
        </button>
        <button type="button" title="收起 / 展开" @click="collapsed = !collapsed">
          <Icon :name="collapsed ? 'chevron-down' : 'chevron-up'" :size="19" />
        </button>
        <button
          v-if="!confirmDelete"
          type="button"
          class="mc-del"
          title="删除模块"
          @click="confirmDelete = true"
        >
          <Icon name="delete" :size="19" />
        </button>
        <template v-else>
          <span class="mc-confirm-text">删除？</span>
          <button type="button" class="mc-del" @click="store.removeModule(module.id)">是</button>
          <button type="button" @click="confirmDelete = false">否</button>
        </template>
      </div>
    </div>

    <div v-show="!collapsed" class="mc-body">
      <p v-if="module.hidden" class="mc-hidden-tip">该模块已隐藏，不会出现在右侧简历中</p>
      <ItemForm
        v-for="item in module.items"
        :key="item.id"
        :module="module"
        :item="item"
      />
      <div class="mc-item-ops">
        <button class="mc-add-item" type="button" @click="store.addItem(module.id)">
          <Icon name="add" :size="18" />
          添加{{ module.type === 'personal_summary' ? '总结' : '一条经历' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  directives: {
    focus: {
      mounted(el: HTMLInputElement) {
        el.focus()
        el.select()
      },
    },
  },
}
</script>

<style scoped>
.mc {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 12px;
  overflow: visible;
}
.mc.hidden {
  opacity: 0.65;
}
.mc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 4px 10px 4px 16px;
}
.mc-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.mc-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--brand-light);
  color: var(--brand);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mc-title {
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mc-title-edit {
  color: var(--text-light);
  opacity: 0;
  flex-shrink: 0;
}
.mc-title:hover .mc-title-edit {
  opacity: 1;
}
.mc-title-input {
  height: 28px;
  border: 1px solid var(--brand);
  border-radius: 6px;
  padding: 0 6px;
  font-size: 14px;
  width: 180px;
}
.mc-count {
  font-size: 12px;
  color: var(--text-light);
  flex-shrink: 0;
}
.mc-head-right {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.mc-head-right button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.mc-head-right button:hover {
  background: #f0f1f3;
  color: var(--text-main);
}
.mc-head-right .mc-del:hover {
  color: var(--danger);
  background: #fdf0f0;
}
.mc-confirm-text {
  font-size: 12px;
  color: var(--danger);
}
.mc-hidden-tip {
  font-size: 12px;
  color: #e6a23c;
  background: #fdf6ec;
  border-radius: 6px;
  padding: 6px 10px;
  margin: 10px 16px 0;
}
.mc-body {
  padding: 2px 16px 14px;
}
.mc-item-ops {
  margin-top: 2px;
}
.mc-add-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 36px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--text-sub);
  font-size: 13px;
  transition: all 0.15s;
}
.mc-add-item:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: var(--brand-light);
}
</style>
