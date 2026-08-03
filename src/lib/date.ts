/**
 * 日期工具（文档第 4 节 lib/date.ts）
 * 技术债 #6：所有"当月信息"必须调用时实时求值，禁止模块顶层快照。
 * 所以这里全部是纯函数，每次调用都拿新鲜的 now。
 */

/** 今天的 'YYYY-MM-DD'（本地时区，文档统一的日期存储格式） */
export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 任意 Date → 'YYYY-MM-DD' */
export function toDateStr(d: Date): string {
  return todayStr(d)
}

/** 某月有多少天。month 为 0-based（与 Date 一致） */
export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

/** 今天是本月第几天 */
export function dayOfMonth(now: Date = new Date()): number {
  return now.getDate()
}

/** 'YYYY-MM-DD' → 本地 Date（避免 new Date(str) 的时区坑） */
export function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** 两个 'YYYY-MM-DD' 相差几天（a - b），忽略时分秒 */
export function daysBetween(a: string, b: string): number {
  const da = parseDate(a)
  const db = parseDate(b)
  da.setHours(0, 0, 0, 0)
  db.setHours(0, 0, 0, 0)
  return Math.round((da.getTime() - db.getTime()) / 86400000)
}

/** 'YYYY-MM-DD' 是否属于「now 所在的月份」 */
export function isSameMonth(dateStr: string, now: Date = new Date()): boolean {
  const d = parseDate(dateStr)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

/** 'YYYY-MM-DD' 是否属于指定年月（month 为 1-based） */
export function isInMonth(dateStr: string, year: number, month1: number): boolean {
  const d = parseDate(dateStr)
  return d.getFullYear() === year && d.getMonth() === month1 - 1
}

/** 'YYYY-MM-DD' → 'M/D' 展示 */
export function formatMD(dateStr: string): string {
  const d = parseDate(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 'YYYY-MM-DD' → 'YYYY/M/D' 展示 */
export function formatYMD(dateStr: string): string {
  const d = parseDate(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

/** 相对今天的友好后缀：今天 / 昨天 / 前天 / '' */
export function relativeDayLabel(dateStr: string, now: Date = new Date()): string {
  const diff = daysBetween(todayStr(now), dateStr)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff === 2) return '前天'
  return ''
}

/** 当前月的 'YYYY-M'（monthlyHistory 的 key 格式，文档 5.2） */
export function monthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}`
}

/** 距离今天几天（未来为负）。回顾提醒用：距今 ≥ reminderDays 即待回顾 */
export function daysSince(dateStr: string, now: Date = new Date()): number {
  return daysBetween(todayStr(now), dateStr)
}
