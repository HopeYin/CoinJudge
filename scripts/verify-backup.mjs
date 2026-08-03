/**
 * P2-6b 数据管理验证：备份打包/解析 + importAll + clearRecords
 * 运行：node scripts/verify-backup.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

globalThis.window = globalThis
const memory = new Map()
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
  clear: () => memory.clear(),
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tmp = join(root, 'scripts', '.tmp')
mkdirSync(tmp, { recursive: true })
writeFileSync(join(tmp, 'date.ts'), readFileSync(join(root, 'src/lib/date.ts'), 'utf8'))
writeFileSync(join(tmp, 'types.ts'), readFileSync(join(root, 'src/store/types.ts'), 'utf8'))
writeFileSync(
  join(tmp, 'store.ts'),
  readFileSync(join(root, 'src/store/store.ts'), 'utf8')
    .replaceAll(`from '../lib/date'`, `from './date.ts'`)
    .replaceAll(`from './types'`, `from './types.ts'`),
)
writeFileSync(
  join(tmp, 'backup.ts'),
  readFileSync(join(root, 'src/lib/backup.ts'), 'utf8').replaceAll(`from '../store/types'`, `from './types.ts'`),
)

let pass = 0, fail = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` ｜ ${extra}` : ''}`)
  ok ? pass++ : fail++
}

const { useStore } = await import(pathToFileURL(join(tmp, 'store.ts')).href)
const { buildBackup, parseBackup } = await import(pathToFileURL(join(tmp, 'backup.ts')).href)
const S = () => useStore.getState()

/* 造数据 */
S().setIncome(1500); S().setBudget(800)
S().addRecord({ amount: 10, name: '早饭', categoryId: 'food', mood: 'need', date: '2026-08-01' })
S().addRecord({ amount: 20, name: '奶茶', categoryId: 'food', mood: 'impulse', date: '2026-08-02' })
S().addRecord({ amount: 30, name: '旧账', categoryId: 'food', mood: 'need', date: '2026-07-15' })

/* 1. 备份往返 */
const json = buildBackup(S())
const parsed = parseBackup(json)
check('备份打包→解析：3 条记录原样回来', parsed.records.length === 3)
check('备份打包→解析：设置原样回来', parsed.settings.income === 1500 && parsed.settings.budget === 800)

/* 2. 错误格式拒绝（信息要是大白话） */
const bad = (j, expect) => { try { parseBackup(j); return false } catch (e) { return e.message.includes(expect) } }
check('拒绝坏 JSON', bad('not json', 'JSON'))
check('拒绝别的 app 的文件', bad(JSON.stringify({ app: 'Other', version: 2 }), '不是硬币判官'))
check('拒绝 v1 旧备份（不做迁移）', bad(JSON.stringify({ app: 'CoinJudge', version: 1 }), '旧版 v1'))
check('拒绝缺字段的备份', bad(JSON.stringify({ app: 'CoinJudge', version: 2, settings: {} }), '缺少'))

/* 3. importAll 整体替换 + meta 保留 */
const metaBefore = S().meta
S().importAll({ ...parsed, records: parsed.records.slice(0, 1) })
check('importAll 整体替换记录', S().records.length === 1)
check('importAll 保留 meta.version', S().meta === metaBefore)

/* 4. clearRecords */
S().importAll(parsed)
S().clearRecords({ start: '2026-08-01', end: '2026-08-31' })
check('clearRecords 按范围删：只剩 7 月那条', S().records.length === 1 && S().records[0].date === '2026-07-15')
S().clearRecords()
check('clearRecords 全部清空', S().records.length === 0)
S().setBudget(800) // 确认清空后其他数据还在
check('清空流水不动设置/账户', S().settings.budget === 800 && S().settings.income === 1500)

console.log(`\n══ 结果：${pass} 通过 / ${fail} 失败 ══`)
process.exit(fail ? 1 : 0)
