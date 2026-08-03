/**
 * P1 公式手算验证脚本（文档第 7 节验收要求：至少 3 组手算示例）
 * 用项目真实的 derived.ts 计算，再和"人脑手算结果"对答案。
 * 运行：node scripts/verify-formulas.mjs
 *
 * 注：源码里是相对导入不带扩展名（Vite 风格），Node 直接跑需要补扩展名，
 * 所以这里把两个源文件复制到 .tmp/ 并补全导入路径后再 import——跑的是同一套代码。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tmp = join(root, 'scripts', '.tmp')
mkdirSync(tmp, { recursive: true })

const dateSrc = readFileSync(join(root, 'src/lib/date.ts'), 'utf8')
writeFileSync(join(tmp, 'date.ts'), dateSrc)

const derivedSrc = readFileSync(join(root, 'src/store/derived.ts'), 'utf8')
  .replaceAll(`from '../lib/date'`, `from './date.ts'`)
writeFileSync(join(tmp, 'derived.ts'), derivedSrc)

const {
  getMonthInfo, effectiveBudget, effectiveIncome, monthShopping, monthSubs,
  estimatedAssets, expectedSavings, monthRemaining, budgetUsedRatio,
  calcReconciliation, categoryDistribution, tagStats, moodDistribution,
} = await import(pathToFileURL(join(tmp, 'derived.ts')).href)

let pass = 0
let fail = 0
function check(name, actual, expected, eps = 0.01) {
  const ok = Math.abs(actual - expected) <= eps
  console.log(`${ok ? '✅' : '❌'} ${name}：代码算出 ${round4(actual)} ｜ 手算 ${round4(expected)}`)
  ok ? pass++ : fail++
}
const round4 = (n) => Math.round(n * 10000) / 10000

/* ══ 案例 A：普通月（非注册月），一切不折算 ══════════════
 * 手算设定：假装今天是 2026-08-20；8 月有 31 天
 * 收入 6000 / 预算 3000 / 期初 10000 / 注册日 2026-07-10（上个月）
 * 本月记录：500 + 300 = 800；会员：月付 30 + 年付 120（摊 10/月）= 40
 */
console.log('\n── 案例 A：普通月 ──')
const nowA = new Date(2026, 7, 20) // 2026-08-20
const stateA = {
  meta: { version: 2 },
  settings: { income: 6000, budget: 3000, registerDate: '2026-07-10', openingBalance: 10000, reminderDays: 7, theme: 'auto', notifyEnabled: false },
  accounts: [],
  records: [
    { id: 1, amount: 500, name: 'a', categoryId: 'food', mood: 'need', tag: 'worth', date: '2026-08-02', reminderDays: 7, reminded: false, used: null, createdAt: 1 },
    { id: 2, amount: 300, name: 'b', categoryId: 'shopping', mood: 'impulse', tag: 'unworth', date: '2026-08-10', reminderDays: 7, reminded: false, used: null, createdAt: 2 },
    { id: 3, amount: 999, name: 'c', categoryId: 'food', mood: 'need', tag: 'worth', date: '2026-07-31', reminderDays: 7, reminded: false, used: null, createdAt: 3 }, // 上月，不应计入
  ],
  subscriptions: [
    { id: 1, name: 'm', icon: '💳', amount: 30, renewDate: '2026-09-01', cycle: 'month', autoRenew: true },
    { id: 2, name: 'y', icon: '💳', amount: 120, renewDate: '2027-01-01', cycle: 'year', autoRenew: true },
  ],
  categories: [], principles: [], monthlyHistory: [],
}
const infoA = getMonthInfo(stateA.settings.registerDate, nowA)
check('A proRata（非注册月=1）', infoA.proRata, 1)
check('A 折算预算', effectiveBudget(stateA.settings, nowA), 3000)
check('A 本月购物', monthShopping(stateA.records, nowA), 800)
check('A 本月会员（30 + 120/12）', monthSubs(stateA.subscriptions), 40)
check('A 总资产估算（10000-800-40）', estimatedAssets(stateA, nowA), 9160)
check('A 预计能存（6000-3000-800-40）', expectedSavings(stateA, nowA), 2160)
check('A 本月余额（3000-800-40）', monthRemaining(stateA, nowA), 2160)
check('A 预算已用比例（840/3000）', budgetUsedRatio(stateA, nowA), 0.28)

/* ══ 案例 B：注册月折算 ══════════════════════════════
 * 手算设定：假装今天 2026-08-20；注册日 2026-08-11（本月第 11 天）
 * proRata = (31 - 11 + 1) / 31 = 21/31 ≈ 0.6774
 * 折算预算 = 3000 × 21/31 ≈ 2032.26；灰前缀 = 1 - 21/31 = 10/31 ≈ 0.3226
 */
console.log('\n── 案例 B：注册月折算 ──')
const nowB = new Date(2026, 7, 20)
const stateB = { ...stateA, settings: { ...stateA.settings, registerDate: '2026-08-11' }, records: [] }
const infoB = getMonthInfo(stateB.settings.registerDate, nowB)
check('B 是否注册月', infoB.isRegMonth ? 1 : 0, 1)
check('B proRata（21/31）', infoB.proRata, 21 / 31)
check('B 折算预算（3000×21/31）', effectiveBudget(stateB.settings, nowB), 3000 * 21 / 31)
check('B 折算收入（6000×21/31）', effectiveIncome(stateB.settings, nowB), 6000 * 21 / 31)
check('B 灰前缀宽度（1-21/31）', 1 - infoB.proRata, 10 / 31)
check('B 开卡第几天（20-11+1）', infoB.dayOfMonth - infoB.regDay + 1, 10)

/* ══ 案例 C：月底对账（6.5） ═════════════════════════
 * 手算：actualSpending = 10000 + 6000 - 13200 = 2800
 *       actualDaily   = 2800 - 800 - 40 = 1960
 *       actualSavings = (6000-3000) - 800 - 40 + (3000-1960) = 3000 - 840 + 1040 = 3200
 */
console.log('\n── 案例 C：月底对账 ──')
const rec = calcReconciliation({
  opening: 10000, effectiveIncome: 6000, closingBalance: 13200,
  shop: 800, sub: 40, income: 6000, budget: 3000,
})
check('C 实际总支出', rec.actualSpending, 2800)
check('C 推算日常支出', rec.actualDaily, 1960)
check('C 实际存了', rec.actualSavings, 3200)

/* ══ 案例 D：分布统计（6.6） ════════════════════════
 * 本月记录：food 100×2、shopping 300（值得）、other 100（不值得）
 * 分类占比：food 200/600=33.33%，tag：值得 500/3 笔（100+100+300），不值得 100/1 笔
 */
console.log('\n── 案例 D：分布统计 ──')
const recsD = [
  { id: 1, amount: 100, name: '', categoryId: 'food', mood: 'need', tag: 'worth', date: '2026-08-01', reminderDays: 7, reminded: false, used: null, createdAt: 1 },
  { id: 2, amount: 100, name: '', categoryId: 'food', mood: 'need', tag: 'worth', date: '2026-08-02', reminderDays: 7, reminded: false, used: null, createdAt: 2 },
  { id: 3, amount: 300, name: '', categoryId: 'shopping', mood: 'reward', tag: 'worth', date: '2026-08-03', reminderDays: 7, reminded: false, used: null, createdAt: 3 },
  { id: 4, amount: 100, name: '', categoryId: 'other', mood: 'impulse', tag: 'unworth', date: '2026-08-04', reminderDays: 7, reminded: false, used: null, createdAt: 4 },
]
const distD = categoryDistribution(recsD, nowA)
check('D 餐饮金额', distD.find((d) => d.categoryId === 'food')?.amount ?? -1, 200)
check('D 餐饮占比（200/600）', distD.find((d) => d.categoryId === 'food')?.pct ?? -1, 200 / 600)
const tagD = tagStats(recsD, nowA)
check('D 值得金额/笔数', tagD.worth.amount + tagD.worth.count / 100, 500 + 3 / 100)
check('D 不值得金额/笔数', tagD.unworth.amount + tagD.unworth.count / 100, 100 + 1 / 100)
const moodD = moodDistribution(recsD, nowA)
check('D 情绪-需要金额', moodD.find((m) => m.mood === 'need')?.amount ?? -1, 200)

console.log(`\n══ 结果：${pass} 通过 / ${fail} 失败 ══`)
process.exit(fail > 0 ? 1 : 0)
