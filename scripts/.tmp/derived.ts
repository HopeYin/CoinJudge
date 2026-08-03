/**
 * 全部派生计算（文档第 6 节公式，一个不许错）
 *
 * 全部是纯函数：输入 state + now，输出结果。
 * 技术债 #6：当月信息必须"每次计算时实时求值"，所以 now 默认为 new Date()，
 * 绝不模块顶层缓存。页面每次渲染都重新算，跨天自然刷新。
 */
import type { AppState, Record, Settings, Subscription, MonthlyRecord, Mood } from './types'
import { daysInMonth, isSameMonth, isInMonth, parseDate, todayStr, monthKey } from './date.ts'

/* ── 当月信息（6.0） ─────────────────────────────── */
export interface MonthInfo {
  daysInMonth: number   // 本月天数
  dayOfMonth: number    // 今天第几天
  isRegMonth: boolean   // 现在是否注册当月
  regDay: number        // 注册日是该月第几天（非注册月为 1）
  proRata: number       // 注册月折算系数（非注册月 = 1）
  remainingDays: number // 本月还剩几天（含今天）
}

export function getMonthInfo(registerDate: string, now: Date = new Date()): MonthInfo {
  const dim = daysInMonth(now.getFullYear(), now.getMonth())
  const dom = now.getDate()
  let isRegMonth = false
  let regDay = 1
  if (registerDate) {
    const rd = parseDate(registerDate)
    isRegMonth = rd.getFullYear() === now.getFullYear() && rd.getMonth() === now.getMonth()
    if (isRegMonth) regDay = rd.getDate()
  }
  // 6.1 注册月折算：注册当月按剩余天数比例折算
  const proRata = isRegMonth ? (dim - regDay + 1) / dim : 1
  return { daysInMonth: dim, dayOfMonth: dom, isRegMonth, regDay, proRata, remainingDays: dim - dom + 1 }
}

/* ── 6.1 折算后的预算/收入 ────────────────────────── */
export function effectiveBudget(settings: Settings, now: Date = new Date()): number {
  return settings.budget * getMonthInfo(settings.registerDate, now).proRata
}
export function effectiveIncome(settings: Settings, now: Date = new Date()): number {
  return settings.income * getMonthInfo(settings.registerDate, now).proRata
}

/* ── 6.2 本月聚合 ───────────────────────────────── */
export function monthShopping(records: Record[], now: Date = new Date()): number {
  return records
    .filter((r) => isSameMonth(r.date, now))
    .reduce((s, r) => s + r.amount, 0)
}

/** 会员月费：年付按 amount/12 分摊 */
export function monthSubs(subs: Subscription[]): number {
  return subs.reduce((s, sub) => s + (sub.cycle === 'year' ? sub.amount / 12 : sub.amount), 0)
}

/* ── 6.3 资产与储蓄估算 ───────────────────────────── */
export function estimatedAssets(state: AppState, now: Date = new Date()): number {
  return state.settings.openingBalance - monthShopping(state.records, now) - monthSubs(state.subscriptions)
}
export function expectedSavings(state: AppState, now: Date = new Date()): number {
  return (
    effectiveIncome(state.settings, now) -
    effectiveBudget(state.settings, now) -
    monthShopping(state.records, now) -
    monthSubs(state.subscriptions)
  )
}

/* ── 6.4 预算卡（本月余额口径） ────────────────────── */
export function monthRemaining(state: AppState, now: Date = new Date()): number {
  return effectiveBudget(state.settings, now) - monthShopping(state.records, now) - monthSubs(state.subscriptions)
}

/** 预算进度条已用比例 0–1；注册月灰前缀宽度 = 1 − proRata */
export function budgetUsedRatio(state: AppState, now: Date = new Date()): number {
  const eb = effectiveBudget(state.settings, now)
  if (eb <= 0) return 0
  return Math.min((monthShopping(state.records, now) + monthSubs(state.subscriptions)) / eb, 1)
}

/* ── 6.5 月底对账 ───────────────────────────────── */
export interface ReconciliationInput {
  opening: number          // 期初余额
  effectiveIncome: number  // 折算后收入
  closingBalance: number   // 期末余额（用户逐账户加总录入）
  shop: number             // 本月购物支出
  sub: number              // 本月会员费
  income: number           // 原始月收入
  budget: number           // 原始月预算
}
export interface ReconciliationResult {
  actualSpending: number   // 实际总支出
  actualDaily: number      // 推算日常支出（看不见的那部分）
  actualSavings: number    // 实际存了
}
export function calcReconciliation(i: ReconciliationInput): ReconciliationResult {
  const actualSpending = i.opening + i.effectiveIncome - i.closingBalance
  const actualDaily = actualSpending - i.shop - i.sub
  const actualSavings = (i.income - i.budget) - i.shop - i.sub + (i.budget - actualDaily)
  return { actualSpending, actualDaily, actualSavings }
}

/* ── 6.6 分布统计（默认算本月） ────────────────────── */
export interface CategoryDistItem {
  categoryId: string
  amount: number
  count: number
  pct: number // 金额占比 0–1
}
export function categoryDistribution(records: Record[], now: Date = new Date()): CategoryDistItem[] {
  const sums: { [categoryId: string]: { amount: number; count: number } } = {}
  let total = 0
  for (const r of records) {
    if (!isSameMonth(r.date, now)) continue
    if (!sums[r.categoryId]) sums[r.categoryId] = { amount: 0, count: 0 }
    sums[r.categoryId].amount += r.amount
    sums[r.categoryId].count += 1
    total += r.amount
  }
  return Object.entries(sums)
    .map(([categoryId, v]) => ({
      categoryId,
      amount: v.amount,
      count: v.count,
      pct: total > 0 ? v.amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface MoodDistItem { mood: Mood; count: number; amount: number }
export function moodDistribution(records: Record[], now: Date = new Date()): MoodDistItem[] {
  const sums = new Map<Mood, { count: number; amount: number }>()
  for (const r of records) {
    if (!isSameMonth(r.date, now)) continue
    const cur = sums.get(r.mood) ?? { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += r.amount
    sums.set(r.mood, cur)
  }
  return Array.from(sums.entries()).map(([mood, v]) => ({ mood, ...v }))
}

/** 值得/不值得两桶（技术债 #5：无其他桶） */
export interface TagStats {
  worth: { count: number; amount: number }
  unworth: { count: number; amount: number }
}
export function tagStats(records: Record[], now: Date = new Date()): TagStats {
  const stats: TagStats = { worth: { count: 0, amount: 0 }, unworth: { count: 0, amount: 0 } }
  for (const r of records) {
    if (!isSameMonth(r.date, now)) continue
    stats[r.tag].count += 1
    stats[r.tag].amount += r.amount
  }
  return stats
}

/* ── 常用辅助 ───────────────────────────────────── */
/** 指定年月的记录（Flow 页月份切换用，month1 为 1-based） */
export function recordsInMonth(records: Record[], year: number, month1: number): Record[] {
  return records
    .filter((r) => isInMonth(r.date, year, month1))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
}

/** 待回顾列表：未回顾 且 距今 ≥ 创建时快照的 reminderDays（P2 Principle 页用） */
export function pendingReview(records: Record[], now: Date = new Date()): Record[] {
  const today = todayStr(now)
  return records.filter((r) => {
    if (r.reminded) return false
    const gap = Math.round((parseDate(today).getTime() - parseDate(r.date).getTime()) / 86400000)
    return gap >= r.reminderDays
  })
}

/** 本月是否已对账（P2 存钱卡口径切换用） */
export function currentReconciliation(history: MonthlyRecord[], now: Date = new Date()): MonthlyRecord | undefined {
  const key = monthKey(now)
  return history.find((h) => h.month === key)
}
