<script setup lang="ts">
import { useResumeStore } from '@/store/resume'
import ProfileForm from './ProfileForm.vue'
import ModuleCard from './ModuleCard.vue'

const store = useResumeStore()
const emit = defineEmits<{ (e: 'openAdd'): void }>()
</script>

<template>
  <aside class="ep">
    <div class="ep-scroll">
      <ProfileForm />
      <ModuleCard
        v-for="(m, i) in store.doc.modules"
        :key="m.id"
        :module="m"
        :index="i"
        :total="store.doc.modules.length"
      />
      <button class="ep-add-module" type="button" @click="emit('openAdd')">
        <Icon name="add-circle" :size="20" />
        添加模块
      </button>
    </div>
  </aside>
</template>

<style scoped>
.ep {
  width: 460px;
  flex-shrink: 0;
  background: var(--bg-page);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ep-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.ep-add-module {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 44px;
  border: 1px dashed #cfd3d9;
  border-radius: var(--radius);
  background: #fff;
  color: var(--text-sub);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
}
.ep-add-module:hover {
  border-color: var(--brand);
  color: var(--brand);
}
</style>
