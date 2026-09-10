<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import type { Profile, ResumeItem, ResumeModule, TitleStyle, ProfileStyle } from '@/types/resume'
import { MODULE_SCHEMAS } from '@/data/constants'
import { useResumeStore } from '@/store/resume'

export interface PreviewBlock {
  key: string
  module: ResumeModule
  items: ResumeItem[]
  showTitle: boolean
}

/** 渲染上下文：缺省时读取当前简历文档，缩略图传入模板样式覆盖 */
export interface PreviewCtx {
  titleStyle?: TitleStyle
  profileStyle?: ProfileStyle
  className?: string
}

/** 简历头部（个人信息）渲染块 */
const ProfileBlock = defineComponent({
  props: {
    name: String,
    intention: String,
    contacts: Array as () => { label: string; value: string }[],
    avatar: String,
    fontSize: Number,
    pstyle: String as () => ProfileStyle,
  },
  setup(props) {
    return () =>
      h('div', { class: ['pv-profile', `pv-profile-${props.pstyle ?? 'left'}`] }, [
        h('div', { class: 'pv-profile-main' }, [
          h('div', { class: 'pv-profile-info' }, [
            h(
              'div',
              { class: 'pv-profile-name', style: { fontSize: `${(props.fontSize ?? 14) + 9}px` } },
              props.name,
            ),
            props.intention
              ? h('div', { class: 'pv-profile-intention' }, `求职意向：${props.intention}`)
              : null,
            props.contacts?.length
              ? h(
                  'div',
                  { class: 'pv-profile-contacts' },
                  props.contacts.map((c) =>
                    h('span', { class: 'pv-contact-item' }, [
                      h('span', { class: 'pv-contact-label' }, `${c.label}：`),
                      h('span', { class: 'pv-contact-value' }, c.value),
                    ]),
                  ),
                )
              : null,
          ]),
          props.avatar
            ? h('img', { class: 'pv-profile-avatar', src: props.avatar, alt: '' })
            : null,
        ]),
      ])
  },
})

const props = defineProps<{
  blocks: PreviewBlock[]
  firstBlockKey?: string
  ctx?: PreviewCtx
  profileOverride?: Profile
}>()

const store = useResumeStore()

const titleStyle = computed(() => props.ctx?.titleStyle ?? store.doc.titleStyle)
const profileStyle = computed(() => props.ctx?.profileStyle ?? store.doc.profileStyle)
const profile = computed(() => props.profileOverride ?? store.doc.profile)
const fontSize = computed(() => store.doc.layout.fontSize)

const LINE_TYPES = ['awards', 'certificates']
const FLAT_TYPES = ['skills', 'personal_summary']

function mainOf(module: ResumeModule, item: ResumeItem): string {
  const schema = MODULE_SCHEMAS[module.type as keyof typeof MODULE_SCHEMAS] ?? []
  const mainKeys = schema.filter((f) => f.role === 'main').map((f) => f.key)
  return mainKeys.map((k) => item.fields[k]).filter(Boolean).join(' - ')
}

function subsOf(module: ResumeModule, item: ResumeItem): string[] {
  const schema = MODULE_SCHEMAS[module.type as keyof typeof MODULE_SCHEMAS] ?? []
  return schema
    .filter((f) => f.role === 'sub')
    .map((f) => item.fields[f.key])
    .filter(Boolean)
}

function rightOf(module: ResumeModule, item: ResumeItem): string {
  const schema = MODULE_SCHEMAS[module.type as keyof typeof MODULE_SCHEMAS] ?? []
  return schema
    .filter((f) => f.role === 'right')
    .map((f) => item.fields[f.key])
    .filter(Boolean)
    .join(' - ')
}

const itemVisible = (item: ResumeItem) => {
  const hasField = Object.values(item.fields).some((v) => v && v.trim())
  const hasDesc = item.desc.some((d) => d && d.trim())
  return hasField || hasDesc
}

const contactList = computed(() => profile.value.contacts.filter((c) => c.value.trim()))
</script>

<template>
  <div class="pv-content" :class="[ctx?.className ?? '', `pv-ts-${titleStyle}`]">
    <ProfileBlock
      v-if="firstBlockKey === '__profile__'"
      :name="profile.name"
      :intention="profile.jobIntention"
      :contacts="contactList"
      :avatar="profile.avatar"
      :font-size="fontSize"
      :pstyle="profileStyle"
    />

    <div
      v-for="b in blocks"
      :key="b.key"
      class="pv-block"
      :data-type="b.module.type"
      :class="{
        'pv-title-block': b.showTitle,
        'pv-first': b.key === firstBlockKey,
      }"
    >
      <div v-if="b.showTitle" class="pv-module-title">
        <span class="pv-module-title-text">{{ b.module.title }}</span>
      </div>

      <template v-for="item in b.items" :key="item.id">
        <!-- 荣誉 / 证书：单行式 -->
        <div v-if="LINE_TYPES.includes(b.module.type) && itemVisible(item)" class="pv-line">
          <span class="pv-line-main">{{ mainOf(b.module, item) }}</span>
          <span class="pv-line-right">{{ rightOf(b.module, item) }}</span>
        </div>

        <!-- 技能 / 个人总结：平铺式 -->
        <div v-else-if="FLAT_TYPES.includes(b.module.type) && itemVisible(item)" class="pv-flat">
          <span v-if="b.module.type === 'skills' && mainOf(b.module, item)" class="pv-flat-label">
            {{ mainOf(b.module, item) }}：
          </span>
          <span class="pv-flat-text">{{ item.desc.filter((d) => d.trim()).join('；') }}</span>
        </div>

        <!-- 常规模块：标题行 + 要点列表 -->
        <div v-else-if="itemVisible(item)" class="pv-item">
          <div class="pv-item-head">
            <div class="pv-item-head-left">
              <span class="pv-item-main">{{ mainOf(b.module, item) }}</span>
              <span v-for="s in subsOf(b.module, item)" :key="s" class="pv-item-sub">{{ s }}</span>
            </div>
            <span class="pv-item-right">{{ rightOf(b.module, item) }}</span>
          </div>
          <ul v-if="item.desc.some((d) => d.trim())" class="pv-desc">
            <li v-for="(d, i) in item.desc.filter((x) => x.trim())" :key="i">{{ d }}</li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pv-content {
  color: #22262b;
}

/* ---------- 模块块 ---------- */
.pv-block {
  padding-bottom: var(--pv-item-spacing);
}
.pv-title-block {
  padding-top: var(--pv-module-spacing);
}
.pv-first.pv-title-block,
.pv-block.pv-first {
  padding-top: 0;
}

/* ---------- 常规条目 ---------- */
.pv-item {
  margin-bottom: 4px;
}
.pv-item-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}
.pv-item-head-left {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.pv-item-main {
  font-weight: 700;
  word-break: break-all;
}
.pv-item-sub {
  color: #4e5359;
}
.pv-item-right {
  color: #4e5359;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.pv-desc {
  margin: 0;
  padding-left: 1.2em;
}
.pv-desc li {
  list-style: disc outside;
  word-break: break-all;
}

/* ---------- 单行式（荣誉/证书） ---------- */
.pv-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 3px;
}
.pv-line-main {
  font-weight: 600;
  word-break: break-all;
}

/* ---------- 平铺式（技能/总结） ---------- */
.pv-flat {
  margin-bottom: 3px;
  word-break: break-all;
}
.pv-flat-label {
  font-weight: 700;
}
</style>
