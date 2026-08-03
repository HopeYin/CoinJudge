/**
 * 金额格式化（文档第 4 节 lib/format.ts）
 */

/** 保留两位小数：1234.5 → "1234.50" */
export function fmt2(n: number): string {
  return (Number.isFinite(n) ? n : 0).toFixed(2)
}

/** 取整展示：1234.5 → "1235"（旧版大量用 Math.floor，这里用 round 更贴近直觉；卡片大数字仍用 fmt2） */
export function fmt0(n: number): string {
  return String(Math.round(Number.isFinite(n) ? n : 0))
}

/** 带 ¥ 的两位小数 */
export function fmtMoney(n: number): string {
  return `¥${fmt2(n)}`
}
