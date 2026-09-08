<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLibraryStore } from '@/store/library'
import {
  loadGistConfig,
  saveGistConfig,
  clearGistConfig,
  verifyToken,
  findBackupGistId,
  createBackupGist,
  uploadBackup,
  downloadBackup,
  type GistConfig,
} from '@/utils/github'

const emit = defineEmits<{ (e: 'close'): void }>()
const lib = useLibraryStore()

const cfg = ref<GistConfig>(loadGistConfig())
const hasConfig = computed(() => Boolean(cfg.value.token))
const configured = computed(() => Boolean(cfg.value.token && cfg.value.gistId))

// ---------- 配置阶段 ----------
const step = ref<'config' | 'manage'>(configured.value ? 'manage' : 'config')
const tokenInput = ref(cfg.value.token)
const githubUser = ref('')
const checking = ref(false)

async function connect() {
  const token = tokenInput.value.trim()
  if (!token) {
    status.value = { type: 'err', text: '请先粘贴 GitHub Token' }
    return
  }
  checking.value = true
  status.value = { type: 'info', text: '正在验证 Token…' }
  try {
    githubUser.value = await verifyToken(token)
    // 查找已有备份 Gist，没有则创建一个（先传当前备份初始化）
    let gistId = await findBackupGistId(token)
    const backupJson = JSON.stringify(lib.exportBackup())
    if (!gistId) gistId = await createBackupGist(token, backupJson)
    cfg.value = { token, gistId, lastSyncAt: Date.now(), lastSyncDir: 'up' }
    saveGistConfig(cfg.value)
    status.value = {
      type: 'ok',
      text: `已连接 ${githubUser.value}，备份 Gist 已就绪`,
    }
    step.value = 'manage'
  } catch (e) {
    status.value = { type: 'err', text: e instanceof Error ? e.message : String(e) }
  } finally {
    checking.value = false
  }
}

function disconnect() {
  clearGistConfig()
  cfg.value = { token: '', gistId: null, lastSyncAt: null, lastSyncDir: null }
  tokenInput.value = ''
  githubUser.value = ''
  status.value = null
  step.value = 'config'
}

// ---------- 同步操作 ----------
const syncing = ref<'' | 'up' | 'down'>('')
const status = ref<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null)

async function syncUp() {
  syncing.value = 'up'
  status.value = { type: 'info', text: '正在上传备份…' }
  try {
    await uploadBackup(cfg.value.token, cfg.value.gistId!, JSON.stringify(lib.exportBackup()))
    cfg.value.lastSyncAt = Date.now()
    cfg.value.lastSyncDir = 'up'
    saveGistConfig(cfg.value)
    status.value = { type: 'ok', text: '已上传全部简历到私有 Gist' }
  } catch (e) {
    status.value = { type: 'err', text: e instanceof Error ? e.message : String(e) }
  } finally {
    syncing.value = ''
  }
}

const downloaded = ref<number | null>(null)
async function syncDown() {
  if (!window.confirm('下载后本地简历会被整体替换成云端备份的版本：\n· 本地多出来的简历会被删除\n· 内容以云端为准，本地未上传的修改将丢失\n确定继续吗？')) return
  syncing.value = 'down'
  status.value = { type: 'info', text: '正在下载备份…' }
  downloaded.value = null
  try {
    const data = await downloadBackup(cfg.value.token, cfg.value.gistId!)
    const count = lib.replaceWithBackup(data)
    if (count === null) throw new Error('云端备份内容无效或为空')
    cfg.value.lastSyncAt = Date.now()
    cfg.value.lastSyncDir = 'down'
    saveGistConfig(cfg.value)
    downloaded.value = count
    status.value = { type: 'ok', text: `已同步云端 ${count} 份简历（本地数据已按云端替换）` }
  } catch (e) {
    status.value = { type: 'err', text: e instanceof Error ? e.message : String(e) }
  } finally {
    syncing.value = ''
  }
}

function lastSyncText() {
  if (!cfg.value.lastSyncAt) return '尚未同步'
  const d = new Date(cfg.value.lastSyncAt)
  const t = `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${cfg.value.lastSyncDir === 'down' ? '最后下载' : '最后同步'}：${t}`
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal" style="min-width: 440px">
      <div class="modal-header">
        <span class="gs-title">
          <Icon name="upload" :size="17" />
          GitHub Gist 云同步
        </span>
        <button class="gs-close" type="button" @click="emit('close')">
          <Icon name="close" :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <!-- 配置阶段 -->
        <template v-if="step === 'config'">
          <p class="gs-desc">
            将简历库备份到你自己的 GitHub 私有 Gist，实现跨设备同步。Token 仅保存在本机浏览器。
          </p>
          <ol class="gs-steps">
            <li>
              打开
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">GitHub Token 设置页</a>
              创建 Token，勾选 <code>gist</code> 权限
            </li>
            <li>将 Token 粘贴到下方，点击「连接并初始化」</li>
          </ol>
          <input
            v-model="tokenInput"
            class="form-input gs-token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxx"
            autocomplete="off"
            spellcheck="false"
            @keyup.enter="connect"
          />
          <div v-if="status" class="gs-status" :class="status.type">{{ status.text }}</div>
        </template>

        <!-- 管理阶段 -->
        <template v-else>
          <div class="gs-account">
            <Icon name="check-circle" :size="16" />
            已连接 Gist 私有备份
            <span class="gs-time">{{ lastSyncText() }}</span>
          </div>
          <div class="gs-actions">
            <button class="btn btn-primary gs-btn" type="button" :disabled="!!syncing" @click="syncUp">
              <Icon name="upload" :size="15" />
              {{ syncing === 'up' ? '上传中…' : '上传到云端' }}
            </button>
            <button class="btn btn-ghost gs-btn" type="button" :disabled="!!syncing" @click="syncDown">
              <Icon name="download" :size="15" />
              {{ syncing === 'down' ? '下载中…' : '从云端下载' }}
            </button>
          </div>
          <div v-if="status" class="gs-status" :class="status.type">{{ status.text }}</div>
          <div class="gs-tip">上传会用本地简历覆盖云端；下载会用云端备份整体替换本地简历。两端以最后一次操作为准。</div>
        </template>
      </div>

      <div class="modal-footer gs-footer">
        <button
          v-if="hasConfig && step === 'manage'"
          class="btn btn-danger-text"
          type="button"
          @click="disconnect"
        >
          断开连接并清除 Token
        </button>
        <div class="gs-footer-right">
          <button class="btn btn-ghost" type="button" @click="emit('close')">关闭</button>
          <button
            v-if="step === 'config'"
            class="btn btn-primary"
            type="button"
            :disabled="checking || !tokenInput.trim()"
            @click="connect"
          >
            {{ checking ? '验证中…' : '连接并初始化' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gs-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gs-title .icon {
  color: var(--brand);
}
.gs-close {
  color: var(--text-light);
  display: flex;
}
.gs-close:hover {
  color: var(--text-main);
}
.gs-desc {
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.7;
  margin-bottom: 12px;
}
.gs-steps {
  margin: 0 0 14px;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-sub);
  line-height: 2;
}
.gs-steps a {
  color: var(--brand);
  text-decoration: none;
}
.gs-steps a:hover {
  text-decoration: underline;
}
.gs-steps code {
  background: #f2f3f5;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 12px;
}
.gs-token {
  font-family: ui-monospace, monospace;
  font-size: 13px;
}
.gs-status {
  margin-top: 12px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}
.gs-status.ok {
  background: var(--brand-light);
  color: var(--brand-hover);
}
.gs-status.err {
  background: #fdf0f0;
  color: var(--danger);
}
.gs-status.info {
  background: #f2f3f5;
  color: var(--text-sub);
}
.gs-account {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--brand-hover);
  margin-bottom: 16px;
}
.gs-time {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-light);
}
.gs-actions {
  display: flex;
  gap: 12px;
}
.gs-btn {
  flex: 1;
  height: 38px;
  font-size: 14px;
}
.gs-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.gs-tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-light);
  line-height: 1.6;
}
.gs-footer {
  justify-content: space-between;
}
.gs-footer-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
</style>
