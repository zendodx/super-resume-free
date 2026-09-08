/** GitHub Gist 云同步：简历备份存到用户自己的私有 Gist */

const API = 'https://api.github.com'
const GIST_FILE = 'super-resume-backup.json'
const GIST_DESC = '超级简历 - 简历备份（请勿手动编辑）'

const CFG_KEY = 'super-resume-free:gist'

export interface GistConfig {
  token: string
  gistId: string | null
  lastSyncAt: number | null
  lastSyncDir: 'up' | 'down' | null
}

export function loadGistConfig(): GistConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GistConfig
      if (parsed?.token) {
        return {
          token: parsed.token,
          gistId: parsed.gistId ?? null,
          lastSyncAt: parsed.lastSyncAt ?? null,
          lastSyncDir: parsed.lastSyncDir ?? null,
        }
      }
    }
  } catch {
    /* ignore */
  }
  return { token: '', gistId: null, lastSyncAt: null, lastSyncDir: null }
}

export function saveGistConfig(cfg: GistConfig) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg))
}

export function clearGistConfig() {
  localStorage.removeItem(CFG_KEY)
}

/** 统一请求封装 */
async function gistFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  })
  if (r.status === 401) throw new Error('Token 无效或已过期，请重新配置')
  if (r.status === 403) throw new Error('没有权限或请求被限流，请稍后重试')
  if (!r.ok) throw new Error(`请求失败（${r.status}），请检查网络后重试`)
  return r
}

async function fetchJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const r = await gistFetch(path, token, init)
  return (await r.json()) as T
}

/** 验证 Token 是否有效，返回 GitHub 用户名 */
export async function verifyToken(token: string): Promise<string> {
  const data = await fetchJson<{ login: string }>('/user', token)
  return data.login
}

/** 在用户已有的 Gist 中查找备份 Gist */
export async function findBackupGistId(token: string): Promise<string | null> {
  const list = await fetchJson<{ id: string; files: Record<string, unknown>; description: string }[]>(
    '/gists?per_page=100',
    token,
  )
  const hit = list.find((g) => GIST_FILE in (g.files ?? {}) || g.description === GIST_DESC)
  return hit?.id ?? null
}

/** 创建私有备份 Gist，返回 gistId */
export async function createBackupGist(token: string, backupJson: string): Promise<string> {
  const data = await fetchJson<{ id: string }>('/gists', token, {
    method: 'POST',
    body: JSON.stringify({
      description: GIST_DESC,
      public: false,
      files: { [GIST_FILE]: { content: backupJson } },
    }),
  })
  return data.id
}

/** 上传（覆盖）备份到 Gist */
export async function uploadBackup(token: string, gistId: string, backupJson: string): Promise<void> {
  await fetchJson(`/gists/${gistId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [GIST_FILE]: { content: backupJson } } }),
  })
}

/** 从 Gist 下载备份内容，返回解析后的 JSON */
export async function downloadBackup(token: string, gistId: string): Promise<unknown> {
  const data = await fetchJson<{ files: Record<string, { content?: string; raw_url?: string }> }>(
    `/gists/${gistId}`,
    token,
  )
  const file = data.files?.[GIST_FILE]
  if (!file) throw new Error('Gist 中未找到备份文件')
  const text = file.content ?? (file.raw_url ? await (await fetch(file.raw_url)).text() : '')
  if (!text) throw new Error('备份内容为空')
  return JSON.parse(text)
}

/** 拉取 Gist 云端更新时间（用于提示本地/云端新旧关系） */
export async function fetchGistUpdatedAt(token: string, gistId: string): Promise<number | null> {
  const data = await fetchJson<{ updated_at?: string }>(`/gists/${gistId}`, token)
  return data.updated_at ? Date.parse(data.updated_at) : null
}
