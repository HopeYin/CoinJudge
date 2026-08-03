/**
 * 月底对账（P2-6，v2.1 文档第 7 节）
 * 流程：展示期初/收入/预算 → 逐账户录期末余额 → 实时计算（公式 6.5）
 *      → 复盘 textarea → 保存（账户余额写回 + monthlyHistory upsert
 *      + openingBalance 滚动为期末 + 清复盘）→ 弹出分享卡。
 * 本月已保存过对账时再保存 = 覆盖（upsert），页面上有提示。
 */
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import ShareCard from '../components/ShareCard'
import { getAccountIconDef } from '../components/icons'
import { useStore } from '../store/store'
import {
  effectiveIncome, effectiveBudget, monthShopping, monthSubs,
  calcReconciliation, currentReconciliation,
} from '../store/derived'
import { monthKey, todayStr } from '../lib/date'
import { fmt2 } from '../lib/format'
import { useBackClose } from '../lib/useBackClose'

export default function MonthlyPage() {
  const accounts = useStore((s) => s.accounts)
  const settings = useStore((s) => s.settings)
  const records = useStore((s) => s.records)
  const subscriptions = useStore((s) => s.subscriptions)
  const history = useStore((s) => s.monthlyHistory)
  const updateAccount = useStore((s) => s.updateAccount)
  const upsertMonthlyRecord = useStore((s) => s.upsertMonthlyRecord)
  const setOpeningBalance = useStore((s) => s.setOpeningBalance)

  /* 逐账户期末余额输入（预填当前余额） */
  const [balances, setBalances] = useState<{ [id: number]: string }>(() =>
    Object.fromEntries(accounts.map((a) => [a.id, a.balance !== 0 ? String(a.balance) : ''])),
  )
  const [review, setReview] = useState('')
  const [showShare, setShowShare] = useState(false)
  useBackClose(showShare, () => setShowShare(false)) // P2-4 返回键联动

  const now = new Date()
  const opening = settings.openingBalance
  const effIncome = effectiveIncome(settings, now)
  const effBudget = effectiveBudget(settings, now)
  const shop = monthShopping(records, now)
  const sub = monthSubs(subscriptions)
  const already = currentReconciliation(history, now)

  const numOf = (id: number) => parseFloat(balances[id] || '') || 0
  const closing = accounts.reduce((s, a) => s + numOf(a.id), 0)
  const result = calcReconciliation({
    opening,
    effectiveIncome: effIncome,
    closingBalance: closing,
    shop,
    sub,
    income: settings.income,
    budget: settings.budget,
  })

  const save = () => {
    // 1. 期末余额写回各账户（v2 账户余额持久化模型）
    accounts.forEach((a) => updateAccount(a.id, { balance: numOf(a.id) }))
    // 2. 对账记录 upsert 本月
    upsertMonthlyRecord({
      month: monthKey(now),
      opening,
      closingBalance: closing,
      income: settings.income,
      budget: settings.budget,
      shop,
      sub,
      actualSpending: result.actualSpending,
      actualDaily: result.actualDaily,
      actualSavings: result.actualSavings,
      review: review.trim(),
      date: todayStr(),
    })
    // 3. 期初余额滚动为期末（月结闭环，文档 6.5）
    setOpeningBalance(closing)
    // 4. 清复盘 + 弹分享卡
    setReview('')
    setShowShare(true)
  }

  const Row = ({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) => (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-text-2">{label}</span>
      <span
        className={`text-sm tabular-nums ${strong ? 'font-semibold' : ''}`}
        style={color ? { color } : { color: 'var(--color-text-1)' }}
      >
        {value}
      </span>
    </div>
  )

  return (
    <div className="page-fade min-h-screen bg-bg pb-28">
      <PageHeader title="月底对账" back />

      {/* ── 本月信息 ── */}
      <div className="px-4 pt-3">
        <div className="text-xs text-text-3 mb-2 px-1">本月信息</div>
        <div className="bg-card rounded-l shadow-card px-4 py-2.5">
          <Row label="期初余额" value={`¥${fmt2(opening)}`} />
          <Row label="月收入" value={`¥${fmt2(effIncome)}`} />
          <Row label="日常预算" value={`¥${fmt2(effBudget)}`} />
        </div>
      </div>

      {/* ── 各账户期末余额 ── */}
      <div className="px-4 pt-4">
        <div className="text-xs text-text-3 mb-2 px-1">各账户余额（期末实际）</div>
        <div className="bg-card rounded-l shadow-card px-4 py-2">
          {accounts.length === 0 && (
            <div className="text-center text-text-3 text-sm py-4">还没有账户，先去「资产」页添加</div>
          )}
          {accounts.map((a) => {
            const def = getAccountIconDef(a.icon)
            return (
              <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <div
                  className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
                  style={{ background: def.bg, color: def.color }}
                >
                  <def.Icon width={16} height={16} />
                </div>
                <span className="flex-1 text-sm text-text-1 truncate">{a.name}</span>
                <div className="flex items-center gap-1 text-text-2">
                  <span className="text-sm">¥</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={balances[a.id] ?? ''}
                    placeholder="0.00"
                    onChange={(e) => setBalances((b) => ({ ...b, [a.id]: e.target.value }))}
                    className="w-24 text-right text-sm text-text-1 font-medium bg-bg rounded-s px-2 py-1.5 outline-none placeholder:text-text-3"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 对账结果（实时） ── */}
      <div className="px-4 pt-4">
        <div className="text-xs text-text-3 mb-2 px-1">对账结果</div>
        <div className="bg-card rounded-l shadow-card px-4 py-2.5">
          <Row label="总余额（期末）" value={`¥${fmt2(closing)}`} />
          <Row label="购物支出" value={`- ¥${fmt2(shop)}`} />
          <Row label="会员费" value={`- ¥${fmt2(sub)}`} />
          <div className="border-t border-border my-1.5" />
          <Row label="推算日常支出" value={`¥${fmt2(result.actualDaily)}`} strong />
          <Row label="本月实际总支出" value={`¥${fmt2(result.actualSpending)}`} strong />
          <Row
            label={result.actualSavings >= 0 ? '实际存了' : '超支'}
            value={`${result.actualSavings >= 0 ? '+' : ''}¥${fmt2(result.actualSavings)}`}
            strong
            color={result.actualSavings >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
          />
        </div>
      </div>

      {/* ── 本月复盘 ── */}
      <div className="px-4 pt-4">
        <div className="text-xs text-text-3 mb-2 px-1">本月复盘</div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="超支项、下月调整…"
          rows={4}
          maxLength={500}
          className="w-full bg-card rounded-l shadow-card px-4 py-3 text-sm text-text-1 outline-none placeholder:text-text-3 resize-none"
        />
      </div>

      {already && (
        <div className="px-4 pt-3 text-center text-xs text-warning">
          本月已保存过一次对账，再次保存会覆盖
        </div>
      )}

      {/* ── 保存 ── */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={save}
          className="pressable w-full py-3.5 rounded-l bg-primary text-on-primary text-base font-semibold"
        >
          保存记录
        </button>
      </div>

      {/* ── 分享卡弹窗 ── */}
      {showShare && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[100] flex items-center justify-center px-6"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowShare(false)
          }}
        >
          <div className="overlay-fade w-full max-w-[340px]">
            <ShareCard month={monthKey(now)} />
            <button
              type="button"
              onClick={() => setShowShare(false)}
              className="pressable w-full mt-2.5 py-2.5 rounded-m bg-card text-text-2 text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
