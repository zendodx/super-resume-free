<script setup lang="ts">
defineProps<{ label: string; tip?: string }>()
</script>

<template>
  <div class="form-label tl">
    <span class="tl-row">
      <span class="tl-text">{{ label }}</span>
      <span v-if="tip" class="tl-icon" title="">
        <Icon name="info" :size="14" />
        <span class="tl-tip">{{ tip }}</span>
      </span>
    </span>
  </div>
</template>

<style scoped>
.tl-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tl-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: #b0b6bd;
  cursor: help;
  transition: color 0.15s;
}
.tl-icon:hover {
  color: var(--brand);
}
/* 悬停气泡 */
.tl-tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%) translateY(2px);
  z-index: 30;
  width: max-content;
  max-width: 220px;
  padding: 5px 9px;
  border-radius: 5px;
  background: #30343a;
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  white-space: normal;
  text-align: left;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s, transform 0.15s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}
.tl-tip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #30343a;
}
.tl-icon:hover .tl-tip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
</style>
