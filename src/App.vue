<script setup lang="ts">
import { ref } from 'vue'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorPanel from '@/components/EditorPanel.vue'
import ResumePreview from '@/components/ResumePreview.vue'
import ModuleSortDialog from '@/components/ModuleSortDialog.vue'
import AddModuleDialog from '@/components/AddModuleDialog.vue'
import TemplateDialog from '@/components/TemplateDialog.vue'

const sortVisible = ref(false)
const addVisible = ref(false)
const templateVisible = ref(false)
</script>

<template>
  <div class="app-shell">
    <EditorHeader @open-sort="sortVisible = true" @open-template="templateVisible = true" />
    <div class="app-main">
      <EditorPanel @open-add="addVisible = true" />
      <ResumePreview />
    </div>
    <ModuleSortDialog v-if="sortVisible" @close="sortVisible = false" />
    <AddModuleDialog v-if="addVisible" @close="addVisible = false" />
    <TemplateDialog v-if="templateVisible" @close="templateVisible = false" />
  </div>
</template>

<style scoped>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
  min-height: 0;
  display: flex;
}
</style>
