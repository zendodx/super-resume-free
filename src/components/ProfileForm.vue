<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useResumeStore } from '@/store/resume'
import { PROFILE_FIELD_OPTIONS } from '@/data/constants'

const store = useResumeStore()
const profile = store.doc.profile

const pickerOpen = ref(false)
const pickerRoot = ref<HTMLElement>()

function onPickerDocClick(e: MouseEvent) {
  if (pickerRoot.value && !pickerRoot.value.contains(e.target as Node)) pickerOpen.value = false
}
onMounted(async () => {
  await nextTick()
  document.addEventListener('mousedown', onPickerDocClick)
})
onBeforeUnmount(() => document.removeEventListener('mousedown', onPickerDocClick))

const grouped = computed(() => {
  const map = new Map<string, string[]>()
  for (const o of PROFILE_FIELD_OPTIONS) {
    if (!map.has(o.group)) map.set(o.group, [])
    map.get(o.group)!.push(o.label)
  }
  return [...map.entries()]
})

const usedLabels = computed(() => new Set(profile.contacts.map((c) => c.label)))

function addField(label: string) {
  if (!usedLabels.value.has(label)) store.addProfileField(label)
  pickerOpen.value = false
}

function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => store.updateProfile({ avatar: String(reader.result) })
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div class="pf">
    <div class="pf-title">
      <Icon name="person" :size="19" class="pf-title-icon" />
      个人信息
    </div>

    <div class="pf-body">
      <div class="pf-row">
        <div class="pf-field">
          <label class="form-label">姓名</label>
          <input
            class="form-input"
            :value="profile.name"
            placeholder="请输入姓名"
            @input="store.updateProfile({ name: ($event.target as HTMLInputElement).value })"
          />
        </div>
        <div class="pf-field">
          <label class="form-label">求职意向</label>
          <input
            class="form-input"
            :value="profile.jobIntention"
            placeholder="如：产品经理"
            @input="store.updateProfile({ jobIntention: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </div>

      <div
        v-for="f in profile.contacts"
        :key="f.id"
        class="pf-contact"
      >
        <input
          class="form-input pf-contact-label"
          :value="f.label"
          placeholder="标签"
          @input="store.updateProfileField(f.id, { label: ($event.target as HTMLInputElement).value })"
        />
        <input
          class="form-input pf-contact-value"
          :value="f.value"
          placeholder="内容"
          @input="store.updateProfileField(f.id, { value: ($event.target as HTMLInputElement).value })"
        />
        <button class="pf-contact-del" type="button" title="删除" @click="store.removeProfileField(f.id)">
          <Icon name="close" :size="16" />
        </button>
      </div>

      <div ref="pickerRoot" class="pf-add-wrapper">
        <button class="pf-add" type="button" @click="pickerOpen = !pickerOpen">
          <Icon name="add" :size="17" />
          添加字段
        </button>
        <Transition name="pop">
          <div v-if="pickerOpen" class="pf-picker">
            <template v-for="[group, labels] in grouped" :key="group">
              <div class="pf-picker-group">{{ group }}</div>
              <div class="pf-picker-list">
                <button
                  v-for="label in labels"
                  :key="label"
                  class="pf-picker-item"
                  :class="{ used: usedLabels.has(label) }"
                  type="button"
                  @click="addField(label)"
                >
                  <Icon name="add-circle" :size="16" />
                  {{ label }}
                </button>
              </div>
            </template>
          </div>
        </Transition>
      </div>

      <div class="pf-avatar-row">
        <label class="form-label">证件照（选填）</label>
        <div class="pf-avatar">
          <img v-if="profile.avatar" :src="profile.avatar" alt="avatar" class="pf-avatar-img" />
          <div v-else class="pf-avatar-empty">
            <Icon name="person" :size="28" />
          </div>
          <div class="pf-avatar-ops">
            <label class="btn btn-ghost pf-avatar-btn">
              {{ profile.avatar ? '更换照片' : '上传照片' }}
              <input type="file" accept="image/*" hidden @change="onAvatarChange" />
            </label>
            <button
              v-if="profile.avatar"
              class="btn btn-danger-text pf-avatar-btn"
              type="button"
              @click="store.updateProfile({ avatar: '' })"
            >
              移除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pf {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 12px;
}
.pf-title {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 600;
}
.pf-title-icon {
  color: var(--brand);
}
.pf-body {
  padding: 4px 16px 16px;
}
.pf-row {
  display: flex;
  gap: 10px;
}
.pf-field {
  flex: 1;
  min-width: 0;
  margin-bottom: 12px;
}
.pf-contact {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.pf-contact-label {
  width: 92px;
  flex-shrink: 0;
  color: var(--text-sub);
}
.pf-contact-value {
  flex: 1;
}
.pf-contact-del {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pf-contact-del:hover {
  color: var(--danger);
  background: #fdf0f0;
}
.pf-add-wrapper {
  position: relative;
  margin-top: 4px;
}
.pf-add {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--brand);
  padding: 6px 2px;
}
.pf-add:hover {
  opacity: 0.85;
}
.pf-picker {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 300px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow);
  padding: 12px 14px;
  z-index: 200;
}
.pf-picker-group {
  font-size: 12px;
  color: var(--text-light);
  margin: 8px 0 6px;
}
.pf-picker-group:first-child {
  margin-top: 0;
}
.pf-picker-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pf-picker-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-main);
  background: #f5f6f8;
  border-radius: 14px;
  padding: 5px 10px;
}
.pf-picker-item:hover {
  background: var(--brand-light);
  color: var(--brand);
}
.pf-picker-item.used {
  opacity: 0.4;
  cursor: not-allowed;
}
.pf-avatar-row {
  margin-top: 16px;
}
.pf-avatar {
  display: flex;
  gap: 14px;
  align-items: center;
}
.pf-avatar-img,
.pf-avatar-empty {
  width: 74px;
  height: 99px;
  border-radius: 6px;
  border: 1px dashed var(--border);
  object-fit: cover;
  flex-shrink: 0;
}
.pf-avatar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  background: #fafbfc;
}
.pf-avatar-ops {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pf-avatar-btn {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.12s, transform 0.12s;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
