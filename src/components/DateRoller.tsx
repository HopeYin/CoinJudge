/**
 * 日期滚轮 DateRoller（P2-1，v2.1 文档第 7 节）
 * 手感沿用旧版 RecordModal 的 Picker：
 * - 年月日三列，40px 行高，scroll-snap 吸附，上下 60px 渐变遮罩
 * - 未来日期禁用（灰掉不可点）
 * - 今 / 昨 / 前 快捷键
 * - 打开自动定位到当前选中项（直接设 scrollTop，避免 scrollIntoView 牵连页面滚动）
 * - 点击某一项会平滑滚动把它送到中间（iOS 滚轮手感）
 * 年份范围：1970 ~ 今年（旧版到 2064，但未来日期本就全部禁用，精简掉无效年份）
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { daysInMonth, parseDate } from '../lib/date'
import { useBackClose } from '../lib/useBackClose'

/* 跨 React 18/19 类型版本都兼容的 ref 形状（只要求有 current 可读） */
type DivRef = { current: HTMLDivElement | null }

const ITEM_H = 40
const PAD = 60 // 上下留白 = 遮罩高度，首尾项才能滚到中间
const WHEEL_H = 180

interface WheelProps {
  items: number[]
  selected: number
  renderLabel: (v: number) => string
  isDisabled?: (v: number) => boolean
  onPick: (v: number, idx: number) => void
  listRef: DivRef
}

function Wheel({ items, selected, renderLabel, isDisabled, onPick, listRef }: WheelProps) {
  return (
    <div className="flex-1 relative overflow-hidden">
      {/* 渐变遮罩（文档：上下各 60px） */}
      <div
        className="absolute top-0 left-0 right-0 z-[2] pointer-events-none"
        style={{ height: PAD, background: 'linear-gradient(to bottom, var(--color-card), transparent)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-[2] pointer-events-none"
        style={{ height: PAD, background: 'linear-gradient(to top, var(--color-card), transparent)' }}
      />
      <div
        ref={listRef}
        className="picker-list h-full overflow-y-auto"
        style={{ scrollSnapType: 'y mandatory', padding: `${PAD}px 0`, WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((v, i) => {
          const disabled = isDisabled?.(v) ?? false
          const active = v === selected
          return (
            <div
              key={v}
              onClick={() => !disabled && onPick(v, i)}
              className={`flex items-center justify-center text-base cursor-pointer rounded-s ${
                active
                  ? 'bg-primary text-on-primary font-semibold'
                  : disabled
                    ? 'text-text-3 opacity-30'
                    : 'text-text-3'
              }`}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            >
              {renderLabel(v)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  open: boolean
  value: string // 'YYYY-MM-DD'
  onConfirm: (date: string) => void
  onCancel: () => void
}

const SHORTCUTS = [
  { label: '今', daysAgo: 0 },
  { label: '昨', daysAgo: 1 },
  { label: '前', daysAgo: 2 },
]

export default function DateRoller({ open, value, onConfirm, onCancel }: Props) {
  const currentYear = new Date().getFullYear()
  const years = useMemo(
    () => Array.from({ length: currentYear - 1970 + 1 }, (_, i) => 1970 + i),
    [currentYear],
  )
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])

  const [y, setY] = useState(currentYear)
  const [m, setM] = useState(new Date().getMonth() + 1)
  const [d, setD] = useState(new Date().getDate())

  const yearRef = useRef<HTMLDivElement>(null)
  const monthRef = useRef<HTMLDivElement>(null)
  const dayRef = useRef<HTMLDivElement>(null)

  const days = useMemo(() => Array.from({ length: daysInMonth(y, m - 1) }, (_, i) => i + 1), [y, m])

  /* 定位：行高固定 40、上留白 60、容器高 180 → 第 idx 项居中时 scrollTop = idx*40 − 10 */
  const scrollToIdx = (ref: DivRef, idx: number, smooth: boolean) => {
    const el = ref.current
    if (!el || idx < 0) return
    el.scrollTo({ top: idx * ITEM_H - 10, behavior: smooth ? 'smooth' : 'auto' })
  }

  /* 打开时读入当前值并定位到选中项（文档：打开自动定位） */
  useEffect(() => {
    if (!open) return
    const dt = parseDate(value)
    const yy = dt.getFullYear()
    const mm = dt.getMonth() + 1
    const dd = dt.getDate()
    setY(yy)
    setM(mm)
    setD(dd)
    requestAnimationFrame(() => {
      scrollToIdx(yearRef, years.indexOf(yy), false)
      scrollToIdx(monthRef, mm - 1, false)
      scrollToIdx(dayRef, dd - 1, false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /* 换年/月时把日收进当月天数（如 1/31 → 2/28） */
  const clampDay = (yy: number, mm: number, dd: number) => Math.min(dd, daysInMonth(yy, mm - 1))

  const pickYear = (v: number, idx: number) => {
    setY(v)
    setD((dd) => clampDay(v, m, dd))
    scrollToIdx(yearRef, idx, true)
  }
  const pickMonth = (v: number, idx: number) => {
    setM(v)
    setD((dd) => clampDay(y, v, dd))
    scrollToIdx(monthRef, idx, true)
  }
  const pickDay = (v: number, idx: number) => {
    setD(v)
    scrollToIdx(dayRef, idx, true)
  }

  /* 未来日期禁用（文档 P2-1） */
  const today0 = new Date()
  today0.setHours(0, 0, 0, 0)
  const futureMonth = (mm: number) => new Date(y, mm - 1, 1) > today0
  const futureDay = (dd: number) => new Date(y, m - 1, dd) > today0

  /* 今/昨/前快捷键 */
  const shortcutTarget = (daysAgo: number) => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    t.setDate(t.getDate() - daysAgo)
    return t
  }
  const isShortcutActive = (daysAgo: number) => {
    const t = shortcutTarget(daysAgo)
    return y === t.getFullYear() && m === t.getMonth() + 1 && d === t.getDate()
  }
  const applyShortcut = (daysAgo: number) => {
    const t = shortcutTarget(daysAgo)
    const yy = t.getFullYear()
    const mm = t.getMonth() + 1
    const dd = t.getDate()
    setY(yy)
    setM(mm)
    setD(dd)
    scrollToIdx(yearRef, years.indexOf(yy), true)
    scrollToIdx(monthRef, mm - 1, true)
    scrollToIdx(dayRef, dd - 1, true)
  }

  const confirm = () => {
    const dd = clampDay(y, m, d)
    onConfirm(`${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`)
  }

  // 返回键优先关滚轮（P2-4；嵌套在记账弹窗上时只关自己）
  useBackClose(open, onCancel)

  if (!open) return null

  return (
    <div
      className="modal-fixed overlay-fade top-0 bottom-0 z-[110] flex items-end justify-center"
      style={{ background: 'var(--color-overlay)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="sheet-slide-up w-full bg-card rounded-t-[20px] px-5 pt-4"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
      >
        {/* 三列滚轮 */}
        <div className="flex gap-3 mb-4" style={{ height: WHEEL_H }}>
          <Wheel items={years} selected={y} renderLabel={(v) => `${v}年`} onPick={pickYear} listRef={yearRef} />
          <Wheel
            items={months}
            selected={m}
            renderLabel={(v) => `${v}月`}
            isDisabled={futureMonth}
            onPick={pickMonth}
            listRef={monthRef}
          />
          <Wheel
            items={days}
            selected={d}
            renderLabel={(v) => `${v}日`}
            isDisabled={futureDay}
            onPick={pickDay}
            listRef={dayRef}
          />
        </div>

        {/* 今/昨/前快捷键 */}
        <div className="flex gap-2.5 mb-4">
          {SHORTCUTS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => applyShortcut(s.daysAgo)}
              className={`pressable flex-1 py-2.5 rounded-[10px] text-[13px] ${
                isShortcutActive(s.daysAgo)
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-bg text-text-2'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 取消 / 确定 */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="pressable flex-1 py-3 rounded-m bg-bg text-text-2 text-sm"
          >
            取消
          </button>
          <button
            type="button"
            onClick={confirm}
            className="pressable flex-1 py-3 rounded-m bg-primary text-on-primary text-sm font-semibold"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}
