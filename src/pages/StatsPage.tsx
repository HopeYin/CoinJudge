/**
 * 统计页（P2-3，v2.1 文档第 7 节）
 * 1. 月度概览三格：购物支出 / 会员费 / 记录笔数
 * 2. 每日消费趋势（手写 SVG 折线，虚线=预算日均基准，今天加粗）
 * 3. 分类占比条（按金额排序，条长相对最大类，标注真实占比）
 * 4. 值不值统计（两桶，技术债 #5）+ "不值得总共花了 ¥X"
 * 5. 情绪分布占比条（😡冲动=红 / ✅需要=绿 / 🎁奖励=黄）
 */
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Monster from '../components/Monster'
import TrendLine from '../components/charts/TrendLine'
import { useStore } from '../store/store'
import {
  getMonthInfo, effectiveBudget, monthShopping, monthSubs,
  recordsInMonth, categoryDistribution, moodDistribution, tagStats,
} from '../store/derived'
import { MOODS } from '../store/types'
import { fmt2 } from '../lib/format'

/* 情绪条配色：冲动=红、需要=绿、奖励=黄（与全站语义一致） */
const moodColor: { [key: string]: string } = {
  impulse: 'var(--color-danger)',
  need: 'var(--color-success)',
  reward: 'var(--color-warning)',
}

export default function StatsPage() {
  const records = useStore((s) => s.records)
  const subscriptions = useStore((s) => s.subscriptions)
  const categories = useStore((s) => s.categories)
  const settings = useStore((s) => s.settings)

  const now = new Date()
  const info = getMonthInfo(settings.registerDate, now)
  const monthRecs = recordsInMonth(records, now.getFullYear(), now.getMonth() + 1)

  /* 每日金额（index 0 = 1 号） */
  const daily = new Array(info.daysInMonth).fill(0) as number[]
  for (const r of monthRecs) {
    const day = Number(r.date.slice(8, 10))
    if (day >= 1 && day <= info.daysInMonth) daily[day - 1] += r.amount
  }
  const baseline = effectiveBudget(settings, now) / info.daysInMonth

  const shopping = monthShopping(records, now)
  const subs = monthSubs(subscriptions)
  const catDist = categoryDistribution(records, now)
  const moodDist = moodDistribution(records, now)
  const tags = tagStats(records, now)

  const catMeta = (id: string) => categories.find((c) => c.id === id)
  const catMax = Math.max(...catDist.map((c) => c.amount), 1)
  const moodMax = Math.max(...moodDist.map((m) => m.amount), 1)
  const moodOf = (key: string) => moodDist.find((m) => m.mood === key)

  return (
    <div className="page-fade min-h-screen bg-bg pb-28">
      <PageHeader title="统计" back />

      {/* ── 月度概览三格 ── */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        {[
          { label: '购物支出', val: `¥${fmt2(shopping)}` },
          { label: '会员费', val: `¥${fmt2(subs)}` },
          { label: '记录笔数', val: `${monthRecs.length}` },
        ].map((g) => (
          <div key={g.label} className="bg-card rounded-l shadow-card px-2 py-3 text-center">
            <div className="text-[15px] font-semibold text-text-1 tabular-nums truncate">{g.val}</div>
            <div className="text-[11px] text-text-3 mt-1">{g.label}</div>
          </div>
        ))}
      </div>

      {/* ── 每日消费趋势 ── */}
      <div className="mx-4 mt-3 bg-card rounded-l shadow-card px-4 py-3.5">
        <div className="text-sm font-semibold text-text-1 mb-2">每日消费趋势（{info.daysInMonth} 天）</div>
        {monthRecs.length === 0 ? (
          <EmptyState
            illustration={<Monster width={72} />}
            title="本月还没有记录"
            description="点底部 + 号记一笔，这里就会长出折线"
          />
        ) : (
          <TrendLine values={daily} baseline={baseline} todayIdx={info.dayOfMonth - 1} />
        )}
      </div>

      {/* ── 分类占比 ── */}
      <div className="mx-4 mt-3 bg-card rounded-l shadow-card px-4 py-3.5">
        <div className="text-sm font-semibold text-text-1 mb-3">分类占比</div>
        {catDist.length === 0 ? (
          <div className="text-center text-text-3 text-xs py-4">暂无数据</div>
        ) : (
          catDist.map((c) => {
            const meta = catMeta(c.categoryId)
            return (
              <div key={c.categoryId} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
                <span className="text-base w-6 text-center shrink-0">{meta?.emoji ?? '📦'}</span>
                <span className="text-[13px] text-text-2 w-10 shrink-0">{meta?.name ?? '其他'}</span>
                <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${(c.amount / catMax) * 100}%`, background: meta?.color ?? 'var(--color-primary)' }}
                  />
                </div>
                <span className="text-[11px] text-text-3 w-9 text-right shrink-0 tabular-nums">
                  {Math.round(c.pct * 100)}%
                </span>
                <span className="text-[13px] text-text-1 w-16 text-right shrink-0 tabular-nums">
                  ¥{fmt2(c.amount)}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* ── 值不值统计（两桶） ── */}
      <div className="mx-4 mt-3 bg-card rounded-l shadow-card px-4 py-3.5">
        <div className="text-sm font-semibold text-text-1 mb-3">值不值统计</div>
        <div className="flex">
          <div className="flex-1 text-center">
            <div className="text-xl font-semibold text-success tabular-nums">{tags.worth.count}</div>
            <div className="text-[11px] text-text-3 mt-0.5">值得（¥{fmt2(tags.worth.amount)}）</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xl font-semibold text-danger tabular-nums">{tags.unworth.count}</div>
            <div className="text-[11px] text-text-3 mt-0.5">不值得（¥{fmt2(tags.unworth.amount)}）</div>
          </div>
        </div>
        {tags.unworth.amount > 0 && (
          <div className="mt-3 pt-3 border-t border-border text-center text-[13px] text-text-2">
            不值得的总共花了 <strong className="text-danger tabular-nums">¥{fmt2(tags.unworth.amount)}</strong>
          </div>
        )}
      </div>

      {/* ── 情绪消费分布 ── */}
      <div className="mx-4 mt-3 bg-card rounded-l shadow-card px-4 py-3.5">
        <div className="text-sm font-semibold text-text-1 mb-3">情绪消费分布</div>
        {monthRecs.length === 0 ? (
          <div className="text-center text-text-3 text-xs py-4">暂无数据</div>
        ) : (
          MOODS.map((m) => {
            const d = moodOf(m.key)
            const amount = d?.amount ?? 0
            const count = d?.count ?? 0
            return (
              <div key={m.key} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
                <span className="text-[13px] text-text-2 w-16 shrink-0">
                  {m.emoji} {m.label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${(amount / moodMax) * 100}%`, background: moodColor[m.key] }}
                  />
                </div>
                <span className="text-[11px] text-text-3 w-20 text-right shrink-0 tabular-nums">
                  {count} 笔 ¥{fmt2(amount)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
