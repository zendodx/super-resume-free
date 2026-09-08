<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

export interface SelectOption {
  label: string
  value: string | number
}

const props = defineProps<{
  modelValue: string | number
  options: SelectOption[]
  /** 显示宽度，如 90px */
  width?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string | number): void }>()

const open = ref(false)
const root = ref<HTMLElement>()

const currentLabel = () =>
  props.options.find((o) => String(o.value) === String(props.modelValue))?.label ?? String(props.modelValue)

function toggle() {
  open.value = !open.value
}

function pick(o: SelectOption) {
  emit('update:modelValue', o.value)
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
  <div ref="root" class="sd" :style="{ width }">
    <button class="sd-trigger" :class="{ open }" type="button" @click="toggle">
      <slot name="icon" />
      <span class="sd-label ellipsis">{{ currentLabel() }}</span>
      <Icon name="chevron-down" :size="16" class="sd-caret" :class="{ flip: open }" />
    </button>
    <Transition name="sd">
      <ul v-if="open" class="sd-pop">
        <li
          v-for="o in options"
          :key="String(o.value)"
          :class="{ active: String(o.value) === String(modelValue) }"
          @click="pick(o)"
        >
          <Icon v-if="String(o.value) === String(modelValue)" name="check" :size="16" />
          {{ o.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.sd {
  position: relative;
  display: inline-block;
}
.sd-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 30px;
  padding: 0 6px 0 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-sub);
  transition: background 0.15s;
}
.sd-trigger:hover,
.sd-trigger.open {
  background: #f0f1f3;
  color: var(--text-main);
}
.sd-label {
  flex: 1;
  text-align: left;
}
.sd-caret {
  transition: transform 0.15s;
  color: var(--text-light);
}
.sd-caret.flip {
  transform: rotate(180deg);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sd-pop {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  max-height: 260px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 4px;
  z-index: 300;
}
.sd-pop li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-main);
  cursor: pointer;
  white-space: nowrap;
}
.sd-pop li:hover {
  background: #f5f6f8;
}
.sd-pop li.active {
  color: var(--brand);
  font-weight: 500;
}
.sd-enter-active,
.sd-leave-active {
  transition: opacity 0.12s, transform 0.12s;
}
.sd-enter-from,
.sd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
