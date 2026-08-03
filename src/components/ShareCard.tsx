/**
 * 月度分享卡 ShareCard（P2-6，v2.1 文档第 7 节）
 * 对账保存后弹出；html2canvas 导出 PNG（scale 2）。
 * 内容沿用旧版：月份标题 / 总支出 / 笔数 / 最高单笔 / 值得·不值得·待回顾 / 品牌落款。
 * 待回顾 = 本月 !reminded 的记录数（v2 口径，无 pending 桶）。
 */
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { useStore } from '../store/store'
import { recordsInMonth } from '../store/derived'
import { fmt2 } from '../lib/format'

interface Props {
  month: string // 'YYYY-M'（monthKey 格式）
}

export default function ShareCard({ month }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [capturing, setCapturing] = useState(false)
  const records = useStore((s) => s.records)

  const [y, m] = month.split('-').map(Number)
  const items = recordsInMonth(records, y, m)
  const total = items.reduce((s, r) => s + r.amount, 0)
  const maxItem = items.length > 0 ? items.reduce((a, b) => (b.amount > a.amount ? b : a)) : null
  const worth = items.filter((r) => r.tag === 'worth').length
  const unworth = items.filter((r) => r.tag === 'unworth').length
  const pending = items.filter((r) => !r.reminded).length

  const capture = async () => {
    if (!cardRef.current || capturing) return
    setCapturing(true)
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true })
      const link = document.createElement('a')
      link.download = `硬币判官-${month}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setCapturing(false)
    }
  }

  const dot = (color: string) => (
    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: color }} />
  )

  return (
    <div>
      {/* 被截图的卡片本体 */}
      <div ref={cardRef} className="bg-card rounded-xl shadow-float p-5 w-[300px] mx-auto">
        <div className="text-[15px] font-semibold text-text-1 mb-3">📅 {y} 年 {m} 月消费总结</div>

        <div className="flex justify-between text-sm py-1">
          <span className="text-text-2">总支出</span>
          <span className="text-text-1 font-semibold tabular-nums">¥{fmt2(total)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-text-2">购物笔数</span>
          <span className="text-text-1 font-semibold tabular-nums">{items.length} 笔</span>
        </div>
        {maxItem && (
          <div className="flex justify-between text-sm py-1">
            <span className="text-text-2">最高单笔</span>
            <span className="text-text-1 font-semibold tabular-nums truncate max-w-[170px]">
              ¥{fmt2(maxItem.amount)}
              <span className="text-text-3 font-normal">（{maxItem.name || '未命名'}）</span>
            </span>
          </div>
        )}

        <div className="border-t border-border my-3" />

        <div className="text-[13px] text-text-2 py-0.5 flex items-center">
          {dot('var(--color-success)')}值得 {worth} 笔
        </div>
        <div className="text-[13px] text-text-2 py-0.5 flex items-center">
          {dot('var(--color-danger)')}不值得 {unworth} 笔
        </div>
        <div className="text-[13px] text-text-2 py-0.5 flex items-center">
          {dot('var(--color-warning)')}待回顾 {pending} 笔
        </div>

        <div className="mt-4 text-center">
          <div className="text-primary font-bold text-[15px]">硬币判官</div>
          <div className="text-text-3 text-xs mt-0.5">记一笔，判一笔</div>
        </div>
      </div>

      <button
        type="button"
        onClick={capture}
        disabled={capturing}
        className="pressable w-full mt-4 py-3 rounded-m bg-primary text-on-primary text-sm font-semibold disabled:opacity-60"
      >
        {capturing ? '正在生成…' : '保存截图'}
      </button>
    </div>
  )
}
