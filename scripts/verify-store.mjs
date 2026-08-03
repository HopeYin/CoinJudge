/**
 * P1 store 实战验证（补充手算脚本：测"看不见"的数据层行为）
 * 用 Map 模拟浏览器 localStorage，跑真实的 store.ts，验证：
 *   1. 首次启动自动播种 6 个内置分类
 *   2. 首次同时填完收入+预算自动记录 registerDate
 *   3. addRecord 自动补 id/快照 reminderDays/默认 tag/used=null
 *   4. persist 把数据写进 localStorage 单 key coinjudge_v2
 *   5. 模拟刷新后重新打开：数据原样恢复（持久化闭环）
 * 运行：node scripts/verify-store.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

/* ── 模拟浏览器 localStorage（zustand 内部访问的是 window.localStorage，所以先造 window） ── */
globalThis.window = globalThis
const memory = new Map()
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
  clear: () => memory.clear(),
}

/* ── 复制源码补全导入扩展名（Vite 风格 → Node 可跑，跑的是同一套代码） ── */
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tmp = join(root, 'scripts', '.tmp')
mkdirSync(tmp, { recursive: true })
writeFileSync(join(tmp, 'date.ts'), readFileSync(join(root, 'src/lib/date.ts'), 'utf8'))
writeFileSync(join(tmp, 'types.ts'), readFileSync(join(root, 'src/store/types.ts'), 'utf8'))
writeFileSync(
  join(tmp, 'store.ts'),
  readFileSync(join(root, 'src/store/store.ts'), 'utf8').replaceAll(`from '../lib/date'`, `from './date.ts'`).replaceAll(`from './types'`, `from './types.ts'`),
)

let pass = 0, fail = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` ｜ ${extra}` : ''}`)
  ok ? pass++ : fail++
}

const { useStore } = await import(pathToFileURL(join(tmp, 'store.ts')).href)
const S = () => useStore.getState()

/* 1. 首次启动播种 */
check('首次启动播种 6 个内置分类', S().categories.length === 6 && S().categories.every((c) => c.builtin))
check('数据版本号 meta.version = 2', S().meta.version === 2)

/* 2. registerDate 自动记录 */
S().setIncome(5000)
check('只填收入时还不上注册日', S().settings.registerDate === '')
S().setBudget(2000)
const today = new Date()
const expectToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
check('收入+预算都填完自动记录注册日', S().settings.registerDate === expectToday, S().settings.registerDate)

/* 3. addRecord 自动补全 */
S().setReminderDays(10)
S().addRecord({ amount: 88.5, name: '测试奶茶', categoryId: 'food', mood: 'impulse', date: expectToday })
const r = S().records[0]
check('记录自动快照 reminderDays=10', r.reminderDays === 10)
check('审判默认 worth', r.tag === 'worth')
check('未回顾 used=null', r.used === null && r.reminded === false)
check('记录插入到最前面（unshift）', S().records[0].name === '测试奶茶')

/* 4. persist 写入单 key */
const raw = memory.get('coinjudge_v2')
check('localStorage 出现单 key coinjudge_v2', typeof raw === 'string')
const saved = JSON.parse(raw)
check('存档里有刚才那条记录', saved.state.records.length === 1 && saved.state.records[0].amount === 88.5)
check('存档不含函数（只有数据字段）', typeof saved.state.addRecord === 'undefined')

/* 5. 模拟刷新：清内存中的 store 模块缓存，重新 import，应从 localStorage 恢复 */
const mod2 = await import(pathToFileURL(join(tmp, 'store.ts')).href + '?reload=1')
const S2 = mod2.useStore.getState()
check('刷新后记录还在（持久化恢复）', S2.records.length === 1 && S2.records[0].name === '测试奶茶')
check('刷新后设置还在（income=5000）', S2.settings.income === 5000 && S2.settings.registerDate === expectToday)
check('刷新后分类不重复播种（仍 6 个）', S2.categories.length === 6)

/* 6. 内置分类保护 */
S2.deleteCategory('food')
check('内置分类不可删', S2.categories.length === 6)

/* 7. 自定义分类 + 迁移删除（P3-3） */
const S3 = () => mod2.useStore.getState() // 每次取最新快照
const catCountBefore = S3().categories.length
S3().addCategory({ name: '宠物', emoji: '🐱', color: '#FF6B6B' })
const customCat = S3().categories[S3().categories.length - 1]
check('新增自定义分类', S3().categories.length === catCountBefore + 1 && customCat.builtin === false)
S3().addRecord({ amount: 15, name: '猫粮', categoryId: customCat.id, mood: 'need', date: expectToday })
S3().migrateCategory(customCat.id, 'food')
check('迁移分类：记录改挂到餐饮', S3().records.find((r) => r.name === '猫粮')?.categoryId === 'food')
S3().deleteCategory(customCat.id)
check('迁移后自定义分类可删', !S3().categories.some((c) => c.id === customCat.id))

console.log(`\n══ 结果：${pass} 通过 / ${fail} 失败 ══`)
process.exit(fail > 0 ? 1 : 0)
