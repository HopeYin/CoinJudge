/**
 * 原则页完整版（P2-2，v2.1 文档第 7 节）——核心闭环的"回顾"现场
 * 1. 回顾提醒：天数步进器（1–30，store 内自动夹取，实时生效）
 * 2. 待回顾列表：reminded=false 且 距今 ≥ 其 reminderDays，最久的排最前
 *    → 点击弹"你买的这个，用到了吗？"→ reviewRecord 标记 used
 * 3. 我的消费原则：编号列表 + 编辑模式（增/改/删），完成时自动清掉空白条
 * 4. 空状态配小怪兽插画（问卷 Q8）
 */
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Monster from '../components/Monster'
import { IconScale } from '../components/icons'
import { useStore } from '../store/store'
import { daysSince, formatMD } from '../lib/date'
import { fmt2 } from '../lib/format'
import type { Record as SpendRecord } from '../store/types'

export default function PrinciplePage() {
  const records = useStore((s) => s.records)
  const categories = useStore((s) => s.categories)
  const principles = useStore((s) => s.principles)
  const reminderDays = useStore((s) => s.settings.reminderDays)
  const setReminderDays = useStore((s) => s.setReminderDays)
  const reviewRecord = useStore((s) => s.reviewRecord)
  const addPrinciple = useStore((s) => s.addPrinciple)
  const updatePrinciple = useStore((s) => s.updatePrinciple)
  const deletePrinciple = useStore((s) => s.deletePrinciple)

  const [editing, setEditing] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<SpendRecord | null>(null)

  /* 待回顾：未回顾 且 到天数，最久的排最前（文档 5.2 + P2-2） */
  const pending = records
    .filter((r) => !r.reminded && daysSince(r.date) >= r.reminderDays)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const catEmoji = (id: string) => categories.find((c) => c.id === id)?.emoji ?? '🛍️'

  /* 退出编辑：倒序删掉空白原则，避免记账弹窗抽到空白提示 */
  const finishEdit = () => {
    for (let i = principles.length - 1; i >= 0; i--) {
      if (!principles[i].trim()) deletePrinciple(i)
    }
    setEditing(false)
  }

  const markUsed = (used: boolean) => {
    if (!reviewTarget) return
    reviewRecord(reviewTarget.id, used)
    setReviewTarget(null)
  }

  return (
    <div className="page-fade min-h-screen bg-bg pb-28">
      <PageHeader title="原则" icon={<IconScale width={22} height={22} />} />

      {/* ── 回顾提醒（步进器 1–30 实时生效） ── */}
      <div className="px-4 pt-3">
        <div className="text-xs text-text-3 mb-2 px-1">回顾提醒</div>
        <div className="bg-card rounded-l shadow-card px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <div className="text-sm text-text-1">消费回顾提醒</div>
                <div className="text-xs text-text-3 mt-0.5">记录后 N 天提醒你是否用到</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setReminderDays(reminderDays - 1)}
                className="pressable w-8 h-8 rounded-full bg-bg text-text-2 text-lg leading-none"
              >
                −
              </button>
              <span className="text-lg font-semibold tabular-nums w-7 text-center text-text-1">
                {reminderDays}
              </span>
              <button
                type="button"
                onClick={() => setReminderDays(reminderDays + 1)}
                className="pressable w-8 h-8 rounded-full bg-bg text-text-2 text-lg leading-none"
              >
                ＋
              </button>
            </div>
          </div>
          <div className="text-xs text-text-3 mt-2.5 pt-2.5 border-t border-border">
            每笔消费，{reminderDays} 天后会出现在下方「待回顾」里
          </div>
        </div>
      </div>

      {/* ── 待回顾 ── */}
      <div className="px-4 pt-4">
        <div className="text-xs text-text-3 mb-2 px-1">待回顾{pending.length > 0 && ` (${pending.length})`}</div>
        {pending.length === 0 ? (
          <div className="bg-card rounded-l shadow-card">
            <EmptyState
              illustration={<Monster variant="happy" width={72} />}
              title="没有待回顾的消费"
              description="到日子的账单会出现在这里"
            />
          </div>
        ) : (
          pending.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReviewTarget(r)}
              className="pressable w-full bg-card rounded-l shadow-card px-4 py-3 mb-2 flex items-center gap-3 text-left"
            >
              <span className="text-xl shrink-0">{catEmoji(r.categoryId)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-1 truncate">{r.name || '购物'}</div>
                <div className="text-xs text-text-3 mt-0.5 tabular-nums">
                  ¥{fmt2(r.amount)} · {formatMD(r.date)} · 已 {daysSince(r.date)} 天
                </div>
              </div>
              <span className="text-xs text-warning shrink-0">用到了吗？</span>
            </button>
          ))
        )}
      </div>

      {/* ── 我的消费原则 ── */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-text-3">我的消费原则</span>
          <button
            type="button"
            onClick={() => (editing ? finishEdit() : setEditing(true))}
            className="pressable text-xs text-primary"
          >
            {editing ? '完成' : '编辑'}
          </button>
        </div>

        {!editing ? (
          principles.length === 0 ? (
            <div className="bg-card rounded-l shadow-card">
              <EmptyState
                illustration={<Monster width={72} />}
                title="还没有消费原则"
                description="写一条，记账时会随机跳出来提醒你"
              />
              <div className="px-4 pb-4 -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    addPrinciple('')
                    setEditing(true)
                  }}
                  className="pressable w-full py-2.5 rounded-m bg-primary text-on-primary text-sm font-semibold"
                >
                  ＋ 写第一条原则
                </button>
              </div>
            </div>
          ) : (
            principles.map((p, i) => (
              <div key={i} className="bg-card rounded-l shadow-card px-4 py-3 mb-2 flex gap-3">
                <span className="text-text-3 text-sm shrink-0 tabular-nums">{i + 1}.</span>
                <span className="text-text-1 text-sm leading-relaxed">{p}</span>
              </div>
            ))
          )
        ) : (
          <div>
            {principles.map((p, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  value={p}
                  onChange={(e) => updatePrinciple(i, e.target.value)}
                  maxLength={60}
                  placeholder={`原则 ${i + 1}`}
                  className="flex-1 px-4 py-2.5 rounded-m border border-border bg-card text-sm text-text-1 outline-none focus:border-primary placeholder:text-text-3"
                />
                <button
                  type="button"
                  onClick={() => deletePrinciple(i)}
                  className="pressable w-9 h-9 rounded-full bg-danger-bg text-danger text-lg leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPrinciple('')}
              className="pressable w-full py-2.5 rounded-m border-[1.5px] border-dashed border-border text-text-3 text-sm"
            >
              ＋ 添加原则
            </button>
          </div>
        )}
      </div>

      {/* ── 回顾弹窗："你买的这个，用到了吗？" ── */}
      {reviewTarget && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[90] flex items-end justify-center"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setReviewTarget(null)
          }}
        >
          <div
            className="sheet-slide-up w-full bg-card rounded-t-[20px] px-5 pt-6"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="text-center text-lg font-semibold text-text-1 mb-4">
              你买的这个，用到了吗？
            </div>
            <div className="flex items-center justify-between bg-bg rounded-m px-4 py-3 mb-5">
              <span className="text-sm text-text-1 truncate">
                {catEmoji(reviewTarget.categoryId)} {reviewTarget.name || '购物'}
              </span>
              <span className="text-sm text-text-1 font-semibold tabular-nums shrink-0 ml-3">
                ¥{fmt2(reviewTarget.amount)}
              </span>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => markUsed(true)}
                className="pressable flex-1 py-3 rounded-m bg-success-bg border-2 border-success text-success text-sm font-semibold"
              >
                用到了 ✓
              </button>
              <button
                type="button"
                onClick={() => markUsed(false)}
                className="pressable flex-1 py-3 rounded-m bg-danger-bg border-2 border-danger text-danger text-sm font-semibold"
              >
                没用到 ✗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
