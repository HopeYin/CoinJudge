/**
 * 全局记账弹窗（文档 P1：唯一记账入口，全局只挂载一份）
 * 流程：金额键盘 → 分类（内置 6 类）→ 情绪三选 → 审判二选 → 日期（P2-1 自研滚轮 DateRoller）→ 保存/再记
 * 彩蛋：弹窗内随机展示一条用户原则（移植自旧版 Add.vue 的 💡 提示条；无原则不显示）
 *
 * 打开方式：任何地方 dispatch 'open-record-modal' 事件（TabBar 中央 + 号）。
 * 保存成功：dispatch 'record-success' 事件（Wallet 大数字弹跳反馈用）。
 */
import { useEffect, useState } from 'react'
import { useStore } from '../store/store'
import { MOODS } from '../store/types'
import type { Mood, Tag } from '../store/types'
import { todayStr, formatYMD, relativeDayLabel } from '../lib/date'
import { useBackClose } from '../lib/useBackClose'
import Numpad from './Numpad'
import DateRoller from './DateRoller'

export default function RecordModal() {
  const [open, setOpen] = useState(false)
  const categories = useStore((s) => s.categories)
  const principles = useStore((s) => s.principles)
  const addRecord = useStore((s) => s.addRecord)

  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [mood, setMood] = useState<Mood | ''>('')
  const [tag, setTag] = useState<Tag>('worth') // 审判默认「值得」（文档 5.2）
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayStr())
  const [pickerOpen, setPickerOpen] = useState(false) // 日期滚轮开关（P2-1）
  const [hintIdx, setHintIdx] = useState(0)

  // 返回键优先关弹窗（P2-4）；日期滚轮自己也有，嵌套时只关最上层
  useBackClose(open, () => setOpen(false))

  useEffect(() => {
    const handler = () => {
      // 每次打开都重置表单 + 重新随机一条原则
      setAmount('')
      setCategoryId('')
      setMood('')
      setTag('worth')
      setName('')
      setDate(todayStr())
      setHintIdx(Math.floor(Math.random() * Math.max(principles.length, 1)))
      setOpen(true)
    }
    window.addEventListener('open-record-modal', handler)
    return () => window.removeEventListener('open-record-modal', handler)
  }, [principles.length])

  if (!open) return null

  /* 金额显示：实时解析成两位小数（沿用旧版） */
  const num = parseFloat(amount)
  const displayAmount = amount && !Number.isNaN(num) ? num.toFixed(2) : '0.00'

  /* 键盘输入规则（文档 P1：8 位整数 + 2 位小数） */
  const onKeypress = (key: string) => {
    if (key === '⌫') {
      setAmount((a) => a.slice(0, -1))
      return
    }
    setAmount((a) => {
      if (key === '.' && a.includes('.')) return a
      const [int = '', dec] = a.split('.')
      if (dec !== undefined && dec.length >= 2) return a // 小数最多 2 位
      if (dec === undefined && key !== '.' && int.length >= 8) return a // 整数最多 8 位
      if (a === '' && key === '.') return '0.'
      if (a === '' && key === '00') return '0'
      return a + key
    })
  }

  const save = (keepOpen: boolean) => {
    const value = parseFloat(amount)
    if (!amount || Number.isNaN(value) || value <= 0) return
    addRecord({
      amount: value,
      name: name.trim(),
      categoryId: categoryId || 'other', // 不选分类默认「其他」
      mood: mood || 'need',              // 不选情绪默认「需要」
      tag,
      date,
    })
    window.dispatchEvent(new CustomEvent('record-success'))
    if (keepOpen) {
      // 再记：只清金额和备注，其余选择保留（沿用旧版）
      setAmount('')
      setName('')
    } else {
      setOpen(false)
    }
  }

  const hint = principles.length > 0 ? principles[hintIdx % principles.length] : null

  return (
    <div
      className="modal-fixed overlay-fade top-0 bottom-0 z-[100] flex items-end justify-center"
      style={{ background: 'var(--color-overlay)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        className="sheet-slide-up w-full bg-card rounded-t-[20px] px-4 pt-4 max-h-[88vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        {/* 金额 */}
        <div className="mb-4 font-bold text-text-1 tabular-nums">
          <span className="text-2xl text-primary mr-1">¥</span>
          <span className="text-[40px] leading-none">{displayAmount}</span>
        </div>

        {/* 分类（内置 6 类） */}
        <div className="grid grid-cols-6 gap-1.5 mb-3.5">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId((cur) => (cur === c.id ? '' : c.id))}
              className={`flex flex-col items-center gap-1 py-2 rounded-m transition-all active:scale-95 ${
                categoryId === c.id ? 'bg-primary' : 'bg-bg'
              }`}
            >
              <span className="text-[22px] leading-none">{c.emoji}</span>
              <span className={`text-[11px] ${categoryId === c.id ? 'text-on-primary' : 'text-text-2'}`}>
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {/* 情绪三选 */}
        <div className="flex gap-2 mb-3.5">
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMood((cur) => (cur === m.key ? '' : m.key))}
              className={`flex-1 py-2 rounded-[10px] border-[1.5px] text-[13px] transition-all active:scale-95 ${
                mood === m.key
                  ? 'bg-primary-bg border-primary text-primary'
                  : 'bg-card border-border text-text-2'
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {/* 审判二选 */}
        <div className="flex gap-2.5 mb-3.5">
          <button
            type="button"
            onClick={() => setTag('worth')}
            className={`flex-1 py-3 rounded-m border-2 text-sm font-semibold transition-all active:scale-95 ${
              tag === 'worth'
                ? 'bg-success-bg border-success text-success'
                : 'bg-card border-border text-text-3'
            }`}
          >
            值得买
          </button>
          <button
            type="button"
            onClick={() => setTag('unworth')}
            className={`flex-1 py-3 rounded-m border-2 text-sm font-semibold transition-all active:scale-95 ${
              tag === 'unworth'
                ? 'bg-danger-bg border-danger text-danger'
                : 'bg-card border-border text-text-3'
            }`}
          >
            不值得
          </button>
        </div>

        {/* 备注（沿用旧版 Add 页：始终可写"买什么了/为什么买"） */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="买什么了 / 为什么买？"
          className="w-full px-4 py-3 mb-3 rounded-m border border-border bg-bg text-[15px] text-text-1 outline-none focus:border-primary placeholder:text-text-3"
        />

        {/* 💡 原则提示条（移植自旧版 Add.vue；无原则不显示） */}
        {hint && (
          <div className="mb-3 bg-hint-bg border border-hint-border rounded-m px-3.5 py-2.5 flex items-start gap-2">
            <span className="text-[13px] mt-px shrink-0">💡</span>
            <span className="text-xs text-text-2 leading-relaxed">{hint}</span>
          </div>
        )}

        {/* 日期（P2-1：自研滚轮 DateRoller；显示 YYYY/M/D + 今天/昨天/前天） */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="pressable w-full flex items-center gap-3 px-3.5 py-2.5 mb-3 rounded-[10px] bg-bg text-left"
        >
          <span className="text-sm text-text-2 shrink-0">日期</span>
          <span className="flex-1 text-sm text-text-1">
            {formatYMD(date)}
            {relativeDayLabel(date) && <span className="text-primary ml-1.5">{relativeDayLabel(date)}</span>}
          </span>
          <span className="text-text-3 text-xs">›</span>
        </button>

        {/* 深色数字键盘 */}
        <Numpad onKeypress={onKeypress} onSave={() => save(false)} onSaveMore={() => save(true)} />
      </div>

      {/* 日期滚轮（盖在记账弹窗之上，z-110） */}
      <DateRoller
        open={pickerOpen}
        value={date}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(ds) => {
          setDate(ds)
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
