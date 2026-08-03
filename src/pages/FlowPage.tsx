/**
 * 流水（P1）：月份切换（不可超过当前月）+ 记录列表 + 值得/不值得/会员筛选 + 点击删除
 * 会员订阅 CRUD 也在本页（筛选切到「会员」）。
 * 沿用旧版：月份胶囊导航、筛选药丸、列表前 10 条逐条上浮、详情底栏弹窗。
 */
import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Monster from '../components/Monster'
import { IconFlow } from '../components/icons'
import { useStore } from '../store/store'
import { recordsInMonth } from '../store/derived'
import { MOODS } from '../store/types'
import type { Record as RecordItem, Subscription } from '../store/types'
import { formatMD, formatYMD, relativeDayLabel } from '../lib/date'
import { fmt2 } from '../lib/format'

type Filter = 'all' | 'worth' | 'unworth' | 'sub'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'worth', label: '值得' },
  { value: 'unworth', label: '不值得' },
  { value: 'sub', label: '会员' },
]

const SUB_ICONS = ['💳', '📺', '🎵', '📚', '☁️', '🎮', '📱', '✉️']
const PAGE_SIZE = 20

interface SubFormState {
  id: number | null // 有 id = 编辑，无 = 新增
  icon: string
  name: string
  amount: string
  renewDate: string
  cycle: 'month' | 'year'
  autoRenew: boolean
}
const EMPTY_SUB_FORM: SubFormState = {
  id: null, icon: '💳', name: '', amount: '', renewDate: '', cycle: 'month', autoRenew: true,
}

export default function FlowPage() {
  const records = useStore((s) => s.records)
  const categories = useStore((s) => s.categories)
  const subscriptions = useStore((s) => s.subscriptions)
  const deleteRecord = useStore((s) => s.deleteRecord)
  const addSubscription = useStore((s) => s.addSubscription)
  const updateSubscription = useStore((s) => s.updateSubscription)
  const deleteSubscription = useStore((s) => s.deleteSubscription)

  const [filter, setFilter] = useState<Filter>('all')
  const [shown, setShown] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<RecordItem | null>(null)
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [subForm, setSubForm] = useState<SubFormState | null>(null)

  /* 月份切换（不可超过当前月） */
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1) // 1-based
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1
  const changeMonth = (delta: number) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1)) return
    setViewYear(y)
    setViewMonth(m)
    setShown(PAGE_SIZE)
  }

  const monthRecords = useMemo(
    () => recordsInMonth(records, viewYear, viewMonth),
    [records, viewYear, viewMonth],
  )
  const filtered = useMemo(() => {
    if (filter === 'all' || filter === 'sub') return monthRecords
    return monthRecords.filter((r) => r.tag === filter)
  }, [monthRecords, filter])
  const page = filtered.slice(0, shown)

  const catOf = (id: string) => categories.find((c) => c.id === id)
  const moodEmoji = (m: string) => MOODS.find((x) => x.key === m)?.emoji ?? ''

  /* 会员订阅：新增 / 编辑 / 删除 */
  const openEditSub = (sub: Subscription) => {
    setSelectedSub(null)
    setSubForm({
      id: sub.id, icon: sub.icon, name: sub.name, amount: String(sub.amount),
      renewDate: sub.renewDate, cycle: sub.cycle, autoRenew: sub.autoRenew,
    })
  }
  const submitSub = () => {
    if (!subForm) return
    const amount = parseFloat(subForm.amount)
    if (!subForm.name.trim() || Number.isNaN(amount) || amount <= 0 || !subForm.renewDate) return
    const payload = {
      name: subForm.name.trim(), icon: subForm.icon, amount,
      renewDate: subForm.renewDate, cycle: subForm.cycle, autoRenew: subForm.autoRenew,
    }
    if (subForm.id) updateSubscription(subForm.id, payload)
    else addSubscription(payload)
    setSubForm(null)
  }

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="流水"
        icon={<IconFlow width={22} height={22} />}
        right={
          <div className="flex items-center gap-1.5">
            <button className="pressable text-primary text-[22px] leading-none px-1" onClick={() => changeMonth(-1)}>‹</button>
            <span className="bg-primary-bg text-primary text-xs px-2.5 py-[3px] rounded-m min-w-10 text-center">
              {viewYear === now.getFullYear() ? '' : `${viewYear}年`}{viewMonth}月
            </span>
            <button
              className={`pressable text-primary text-[22px] leading-none px-1 ${isCurrentMonth ? 'invisible' : ''}`}
              onClick={() => changeMonth(1)}
            >›</button>
          </div>
        }
      />

      {/* 筛选药丸 */}
      <div className="flex gap-2 px-4 pb-3 pt-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`pressable shrink-0 px-4 py-1.5 rounded-full border-[1.5px] text-[13px] transition-colors ${
              filter === f.value
                ? 'border-primary text-primary bg-primary-bg'
                : 'border-border text-text-3 bg-card'
            }`}
            onClick={() => { setFilter(f.value); setShown(PAGE_SIZE) }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── 会员订阅 ── */}
      {filter === 'sub' ? (
        <div>
          {subscriptions.length === 0 && (
            <EmptyState
              illustration={<Monster variant="wave" width={72} />}
              title="还没有会员订阅"
              description="点下面按钮添加第一个"
            />
          )}
          {subscriptions.map((sub) => (
            <button
              key={sub.id}
              className="pressable w-[calc(100%-32px)] text-left bg-card mx-4 mb-2 rounded-[14px] shadow-card px-3.5 py-3 flex items-center gap-3"
              onClick={() => setSelectedSub(sub)}
            >
              <div className="w-10 h-10 bg-primary-bg rounded-m flex items-center justify-center text-xl shrink-0">
                {sub.icon || '💳'}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <span className="text-sm text-text-1 truncate">{sub.name}</span>
                <span className="text-[11px] text-text-3">
                  {sub.autoRenew ? '自动续费' : '手动'} · {formatMD(sub.renewDate)}到期
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[15px] font-semibold text-text-1 tabular-nums">
                  ¥{fmt2(sub.amount)}/{sub.cycle === 'year' ? '年' : '月'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-[10px] bg-primary-bg text-primary">订阅</span>
              </div>
            </button>
          ))}
          <button
            className="pressable block mx-4 mt-1 w-[calc(100%-32px)] py-3 rounded-m bg-primary-bg text-primary text-sm"
            onClick={() => setSubForm({ ...EMPTY_SUB_FORM })}
          >
            + 添加会员订阅
          </button>
        </div>
      ) : (
        /* ── 记录列表 ── */
        <div>
          {page.length === 0 ? (
            <EmptyState
              illustration={<Monster width={72} />}
              title="还没有记录"
              description="点击底部 + 记第一笔"
            />
          ) : (
            <div className="record-list">
              {page.map((r) => (
                <button
                  key={r.id}
                  className="item-enter pressable w-[calc(100%-32px)] text-left bg-card mx-4 mb-2 rounded-[14px] shadow-card px-3.5 py-3 flex items-center gap-3"
                  onClick={() => setSelected(r)}
                >
                  <div className="w-10 h-10 bg-bg rounded-m flex items-center justify-center text-xl shrink-0">
                    {catOf(r.categoryId)?.emoji ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                    <span className="text-sm text-text-1 truncate">
                      {r.name || catOf(r.categoryId)?.name || '未分类'}
                      {r.mood && <span className="ml-1 text-[13px]">{moodEmoji(r.mood)}</span>}
                    </span>
                    <span className="text-[11px] text-text-3">
                      {formatMD(r.date)} {relativeDayLabel(r.date)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[15px] font-semibold text-text-1 tabular-nums">¥{fmt2(r.amount)}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-[10px] ${
                        r.tag === 'worth' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                      }`}
                    >
                      {r.tag === 'worth' ? '值得' : '不值得'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {filtered.length > shown && (
            <button
              className="pressable block mx-4 mt-1 w-[calc(100%-32px)] py-3.5 rounded-l border border-border bg-card text-text-2 text-[15px]"
              onClick={() => setShown(shown + PAGE_SIZE)}
            >
              加载更多
            </button>
          )}
        </div>
      )}

      {/* ── 记录详情弹窗（点击可删除） ── */}
      {selected && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[100] flex items-end justify-center"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div
            className="sheet-slide-up w-full bg-card rounded-t-[22px] px-5 pt-6"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="text-4xl font-light text-text-1 mb-4 tabular-nums">¥{fmt2(selected.amount)}</div>
            {[
              ['分类', `${catOf(selected.categoryId)?.emoji ?? ''} ${catOf(selected.categoryId)?.name ?? '未分类'}`],
              ['标签', selected.tag === 'worth' ? '值得' : '不值得'],
              ['情绪', `${moodEmoji(selected.mood)} ${MOODS.find((m) => m.key === selected.mood)?.label ?? ''}`],
              ['备注', selected.name || '无'],
              ['日期', `${formatYMD(selected.date)} ${relativeDayLabel(selected.date)}`.trim()],
              ['回顾', selected.reminded ? (selected.used ? '✓ 用到了' : '✗ 没用到') : '待回顾'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-3 border-b border-border text-sm">
                <span className="text-text-3">{k}</span>
                <span className="text-text-1">{v}</span>
              </div>
            ))}
            <button
              className="pressable w-full mt-5 py-3.5 rounded-m bg-danger-bg text-danger text-[15px]"
              onClick={() => { deleteRecord(selected.id); setSelected(null) }}
            >
              删除这条记录
            </button>
          </div>
        </div>
      )}

      {/* ── 订阅详情弹窗 ── */}
      {selectedSub && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[100] flex items-end justify-center"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => e.target === e.currentTarget && setSelectedSub(null)}
        >
          <div
            className="sheet-slide-up w-full bg-card rounded-t-[22px] px-5 pt-6"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="text-3xl font-light text-text-1 mb-4">{selectedSub.icon} {selectedSub.name}</div>
            {[
              ['费用', `¥${fmt2(selectedSub.amount)}/${selectedSub.cycle === 'year' ? '年' : '月'}`],
              ['到期日', formatYMD(selectedSub.renewDate)],
              ['续费方式', selectedSub.autoRenew ? '自动续费' : '手动续费'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-3 border-b border-border text-sm">
                <span className="text-text-3">{k}</span>
                <span className="text-text-1">{v}</span>
              </div>
            ))}
            <div className="flex gap-2.5 mt-5">
              <button
                className="pressable flex-1 py-3.5 rounded-m bg-primary-bg text-primary text-[15px]"
                onClick={() => openEditSub(selectedSub)}
              >
                编辑
              </button>
              <button
                className="pressable flex-1 py-3.5 rounded-m bg-danger-bg text-danger text-[15px]"
                onClick={() => { deleteSubscription(selectedSub.id); setSelectedSub(null) }}
              >
                删除订阅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 新增/编辑订阅弹窗 ── */}
      {subForm && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[110] flex items-end justify-center"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => e.target === e.currentTarget && setSubForm(null)}
        >
          <div
            className="sheet-slide-up w-full bg-card rounded-t-[22px] px-5 pt-6 max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="text-base font-semibold text-text-1 mb-4">
              {subForm.id ? '编辑订阅' : '添加会员订阅'}
            </div>
            <div className="flex gap-2 mb-3.5 flex-wrap">
              {SUB_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={`pressable text-[22px] px-2 py-1.5 rounded-[10px] border-[1.5px] ${
                    subForm.icon === ic ? 'border-primary bg-primary-bg' : 'border-border bg-bg'
                  }`}
                  onClick={() => setSubForm({ ...subForm, icon: ic })}
                >
                  {ic}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-border">
              <label className="text-sm text-text-2 w-[60px] shrink-0">名称</label>
              <input
                value={subForm.name}
                onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                placeholder="如：微信读书"
                className="flex-1 text-[15px] text-text-1 bg-transparent outline-none placeholder:text-text-3"
              />
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-border">
              <label className="text-sm text-text-2 w-[60px] shrink-0">费用</label>
              <div className="flex items-center gap-1 flex-1 text-text-2">
                <span>¥</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={subForm.amount}
                  placeholder="0.00"
                  onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })}
                  className="flex-1 text-[15px] text-text-1 bg-transparent outline-none placeholder:text-text-3"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-border">
              <label className="text-sm text-text-2 w-[60px] shrink-0">到期日</label>
              <input
                type="date"
                value={subForm.renewDate}
                onChange={(e) => setSubForm({ ...subForm, renewDate: e.target.value })}
                className="flex-1 text-[15px] text-text-1 bg-transparent outline-none"
              />
            </div>
            {(
              [
                ['周期', 'month', 'year', '月付', '年付', 'cycle'],
                ['自动续费', true, false, '是', '否', 'autoRenew'],
              ] as const
            ).map(([label, v1, v2, l1, l2, key]) => (
              <div key={label} className="flex items-center gap-3 py-3 border-b border-border">
                <label className="text-sm text-text-2 w-[60px] shrink-0">{label}</label>
                <div className="flex gap-2">
                  {[
                  [v1, l1],
                  [v2, l2],
                ].map(([v, l]) => (
                    <button
                      key={String(v)}
                      type="button"
                      className={`pressable px-3.5 py-[5px] rounded-full border-[1.5px] text-[13px] ${
                        subForm[key as 'cycle' | 'autoRenew'] === v
                          ? 'border-primary text-primary bg-primary-bg'
                          : 'border-border text-text-3 bg-bg'
                      }`}
                      onClick={() => setSubForm({ ...subForm, [key]: v } as SubFormState)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="pressable w-full mt-[18px] py-3.5 rounded-[14px] bg-primary text-on-primary text-[15px]"
              onClick={submitSub}
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
