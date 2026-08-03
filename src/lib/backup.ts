/**
 * 数据备份（文档 5.4）
 * - 导出：整个 state 打包成一个 JSON 文件下载
 * - 导入：只接受 v2 格式（app === 'CoinJudge' && version === 2），不做 v1 迁移
 */
import type { AppState } from '../store/types'

interface BackupFile {
  app: 'CoinJudge'
  version: 2
  exportedAt: string
  settings: AppState['settings']
  accounts: AppState['accounts']
  records: AppState['records']
  subscriptions: AppState['subscriptions']
  categories: AppState['categories']
  principles: AppState['principles']
  monthlyHistory: AppState['monthlyHistory']
}

/** 打包当前数据为 JSON 字符串 */
export function buildBackup(state: AppState): string {
  const file: BackupFile = {
    app: 'CoinJudge',
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    accounts: state.accounts,
    records: state.records,
    subscriptions: state.subscriptions,
    categories: state.categories,
    principles: state.principles,
    monthlyHistory: state.monthlyHistory,
  }
  return JSON.stringify(file, null, 2)
}

/**
 * 解析备份文件 → AppState（不含 meta，由 store 保留）
 * 格式不对就 throw，message 是能直接给用户看的大白话
 */
export function parseBackup(json: string): Omit<AppState, 'meta'> {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('这个文件不是有效的 JSON，可能已损坏')
  }
  const obj = raw as Partial<BackupFile>
  if (obj?.app !== 'CoinJudge') {
    throw new Error('这不是硬币判官的备份文件')
  }
  if (obj.version !== 2) {
    throw new Error('这是旧版 v1 的备份，v2 暂不支持导入旧数据，请见谅')
  }
  const arrayFields = ['accounts', 'records', 'subscriptions', 'categories', 'principles', 'monthlyHistory'] as const
  for (const f of arrayFields) {
    if (!Array.isArray(obj[f])) {
      throw new Error('备份文件内容不完整（缺少 ' + f + '），无法恢复')
    }
  }
  if (typeof obj.settings !== 'object' || obj.settings === null) {
    throw new Error('备份文件内容不完整（缺少 settings），无法恢复')
  }
  return {
    settings: obj.settings as AppState['settings'],
    accounts: obj.accounts as AppState['accounts'],
    records: obj.records as AppState['records'],
    subscriptions: obj.subscriptions as AppState['subscriptions'],
    categories: obj.categories as AppState['categories'],
    principles: obj.principles as AppState['principles'],
    monthlyHistory: obj.monthlyHistory as AppState['monthlyHistory'],
  }
}
