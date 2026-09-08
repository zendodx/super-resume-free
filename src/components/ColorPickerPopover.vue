<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { THEME_COLORS } from '@/data/constants'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
const root = ref<HTMLElement>()

function toggle() {
  open.value = !open.value
}
function pick(c: string) {
  emit('update:modelValue', c)
  open.value = false
}
function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(async () => {
  await nextTick()
  document.addEventListener('mousedown', onDocClick)
})
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="root" class="cp">
    <button class="cp-trigger" type="button" title="主题色" @click="toggle">
      <span class="cp-swatch" :style="{ background: modelValue }" />
      <Icon name="chevron-down" :size="16" class="cp-caret" :class="{ flip: open }" />
    </button>
    <Transition name="cp">
      <div v-if="open" class="cp-pop">
        <div class="cp-grid">
          <button
            v-for="c in THEME_COLORS"
            :key="c"
            class="cp-item"
            :class="{ active: c === modelValue }"
            :style="{ background: c }"
            type="button"
            @click="pick(c)"
          >
            <Icon v-if="c === modelValue" name="check" :size="16" class="cp-check" />
          </button>
        </div>
        <div class="cp-custom">
          <span>自定义颜色</span>
          <input type="color" :value="modelValue" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.cp {
  position: relative;
  display: inline-block;
}
.cp-trigger {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 30px;
  padding: 0 6px;
  border-radius: 6px;
  transition: background 0.15s;
}
.cp-trigger:hover {
  background: #f0f1f3;
}
.cp-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
.cp-caret {
  color: var(--text-light);
  transition: transform 0.15s;
}
.cp-caret.flip {
  transform: rotate(180deg);
}
.cp-pop {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow);
  padding: 12px;
  z-index: 300;
  width: 196px;
}
.cp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.cp-item {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: transform 0.12s;
}
.cp-item:hover {
  transform: scale(1.1);
}
.cp-item.active {
  border-color: var(--brand);
}
.cp-check {
  color: #fff;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.6));
}
.cp-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-sub);
}
.cp-custom input {
  width: 36px;
  height: 22px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  padding: 1px;
}
.cp-enter-active,
.cp-leave-active {
  transition: opacity 0.12s, transform 0.12s;
}
.cp-enter-from,
.cp-leave-to {
  opacity: 0;
}
</style>
