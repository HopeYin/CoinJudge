/**
 * 金库（P1）：三张银行卡拟物卡片
 * 1. 资产卡：总资产估算 + 账户余额 SVG 柱状图 → /assets
 * 2. 预算卡：本月余额 + 进度条（注册月带灰前缀）→ /monthly；未设预算 → 灰卡 → /mine
 * 3. 存钱卡：预计能存 + 收入/预算/购物/会员四宫格；未设收入 → 灰卡 → /mine
 * 记账成功后大数字 0.4s 弹跳（监听全局 record-success 事件）。
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { IconVault, IconCardAsset, IconCardBudget, IconCardSave } from '../components/icons'
import { useStore } from '../store/store'
import {
  getMonthInfo, effectiveBudget, monthShopping, monthSubs,
  estimatedAssets, expectedSavings, monthRemaining, budgetUsedRatio,
} from '../store/derived'
import { fmt2 } from '../lib/format'

/* 银行卡通用样式（文档 9.2：严格 aspect-ratio 85.6/54，蓝渐变 + 彩色投影） */
const bankCardCls =
  'pressable mx-4 mt-2.5 rounded-l px-5 pt-[18px] pb-3.5 flex flex-col relative overflow-hidden cursor-pointer text-on-primary'
const bankCardStyle = { aspectRatio: '85.6 / 54' as const }

export default function WalletPage() {
  const navigate = useNavigate()
  const state = useStore()
  const [bouncing, setBouncing] = useState(false)

  /* 记账成功：大数字弹跳 0.4s（文档 9.3） */
  useEffect(() => {
    const handler = () => {
      setBouncing(true)
      setTimeout(() => setBouncing(false), 400)
    }
    window.addEventListener('record-success', handler)
    return () => window.removeEventListener('record-success', handler)
  }, [])

  const { settings, accounts } = state
  const info = getMonthInfo(settings.registerDate)
  const assets = estimatedAssets(state)
  const remaining = monthRemaining(state)
  const savings = expectedSavings(state)
  const shopping = monthShopping(state.records)
  const subs = monthSubs(state.subscriptions)
  const effBudget = effectiveBudget(settings)
  const usedRatio = budgetUsedRatio(state)
  const grayPrefix = 1 - info.proRata // 注册月灰前缀宽度（文档 6.4）
  const dailyAvail = info.remainingDays > 0 ? remaining / info.remainingDays : 0
  const bigNumCls = `text-[26px] font-light tracking-tight tabular-nums ${bouncing ? 'success-bounce' : ''}`

  /* 资产卡柱状图（沿用旧版参数：100×60 视窗，白色半透明柱） */
  const chartW = 100
  const chartH = 60
  const barGap = 6
  const valid = accounts.filter((a) => a.balance > 0)
  const maxBal = Math.max(...valid.map((a) => a.balance), 1)
  const barW = Math.min((chartW - barGap * (valid.length + 1)) / Math.max(valid.length, 1), 18)

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title="金库" icon={<IconVault width={22} height={22} />} />

      {/* ≥768px：三卡改 2 栏网格（文档 8.3）；资产卡 + 预算卡一排，存钱卡第二排 */}
      <div className="md:grid md:grid-cols-2 md:items-start">

      {/* ── 资产卡 ── */}
      <div
        className={`${bankCardCls} shadow-blue-card`}
        style={{ ...bankCardStyle, background: 'var(--gradient-bank)' }}
        onClick={() => navigate('/assets')}
      >
        <IconCardAsset width={26} height={26} className="opacity-80 mb-0.5" />
        <div className="flex-1 flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] opacity-65 mb-[3px]">总资产</div>
            <div className={bigNumCls}>¥{fmt2(assets)}</div>
          </div>
          {valid.length > 0 && (
            <svg viewBox={`0 0 ${chartW} ${chartH + 14}`} className="w-[110px] h-[75px] shrink-0 overflow-visible">
              <line x1="0" y1="0" x2="0" y2={chartH} style={{ stroke: "var(--color-oncard-axis)" }} strokeWidth="1" />
              <line x1="0" y1={chartH} x2={chartW} y2={chartH} style={{ stroke: "var(--color-oncard-axis)" }} strokeWidth="1" />
              {valid.map((a, i) => {
                const h = Math.max((a.balance / maxBal) * (chartH - 8), 4)
                return (
                  <rect
                    key={a.id}
                    x={i * (barW + barGap) + barGap}
                    y={chartH - h}
                    width={barW}
                    height={h}
                    rx="3"
                    style={{ fill: "var(--color-oncard-bar)" }}
                  />
                )
              })}
              {valid.map((a, i) => (
                <text
                  key={`t${a.id}`}
                  x={i * (barW + barGap) + barGap + barW / 2}
                  y={chartH + 11}
                  textAnchor="middle"
                  style={{ fill: "var(--color-oncard-subtext)" }}
                  fontSize="8"
                  fontFamily="sans-serif"
                >
                  {a.name.slice(0, 2)}
                </text>
              ))}
            </svg>
          )}
        </div>
        <div className="text-right text-[10px] opacity-45 mt-auto mb-1.5">管理账户 →</div>
      </div>

      {/* ── 预算卡 ── */}
      <div
        className={`${bankCardCls} ${settings.budget > 0 ? 'shadow-blue-card' : ''}`}
        style={{
          ...bankCardStyle,
          background: settings.budget > 0 ? 'var(--gradient-bank)' : 'var(--gradient-bank-gray)',
        }}
        onClick={() => navigate(settings.budget > 0 ? '/monthly' : '/mine')}
      >
        <IconCardBudget width={26} height={26} className="opacity-80 mb-0.5" />
        <div className="flex-1 flex flex-col justify-center">
          {settings.budget > 0 ? (
            <>
              <div className="text-[11px] opacity-65 mb-[3px]">本月余额</div>
              <div className={bigNumCls}>¥{fmt2(remaining)}</div>
              <div className="text-[11px] opacity-55 mt-1.5">
                日均 ¥{Math.floor(dailyAvail)} · 剩余 {info.remainingDays} 天
              </div>
            </>
          ) : (
            <>
              <div className="text-[11px] opacity-65 mb-[3px]">预算卡</div>
              <div className="text-[22px] font-light opacity-70">未开卡</div>
              <div className="text-[11px] opacity-50 mt-1">点击设置日常预算 →</div>
            </>
          )}
        </div>
        {settings.budget > 0 && (
          <>
            <div className="mt-auto">
              <div className="h-[5px] rounded-[3px] relative mb-1" style={{ background: 'var(--color-oncard-track)' }}>
                {/* 注册月灰前缀（文档 6.4：宽度 = 1 − proRata） */}
                {info.isRegMonth && (
                  <div
                    className="absolute left-0 top-0 h-full rounded-l-[3px]"
                    style={{ width: `${grayPrefix * 100}%`, background: 'var(--color-oncard-gray)' }}
                  />
                )}
                {/* 已用进度：(购物+会员)/折算预算，占活动区（proRata）的比例 */}
                <div
                  className="absolute top-0 h-full rounded-[3px] transition-[width] duration-500"
                  style={{
                    left: `${grayPrefix * 100}%`,
                    width: `${Math.min(usedRatio * info.proRata, info.proRata) * 100}%`,
                    background: 'var(--gradient-oncard-fill)',
                  }}
                />
                {/* 今天刻度 */}
                <div
                  className="absolute -top-0.5 w-0.5 h-[9px] rounded-[1px] -translate-x-1/2"
                  style={{
                    left: `${(info.dayOfMonth / info.daysInMonth) * 100}%`,
                    background: 'var(--color-oncard-mark)',
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] opacity-55">
                <span>{info.isRegMonth ? `开卡第${info.dayOfMonth - info.regDay + 1}天` : `第${info.dayOfMonth}天`}</span>
                <span>额度 ¥{Math.floor(effBudget)}</span>
              </div>
            </div>
            <div className="text-right text-[10px] opacity-45 mt-1">月底对账 →</div>
          </>
        )}
      </div>

      {/* ── 存钱卡 ── */}
      <div
        className={`${bankCardCls} ${settings.income > 0 ? 'shadow-blue-card' : ''}`}
        style={{
          ...bankCardStyle,
          background: settings.income > 0 ? 'var(--gradient-bank)' : 'var(--gradient-bank-gray)',
        }}
        onClick={() => settings.income === 0 && navigate('/mine')}
      >
        <IconCardSave width={26} height={26} className="opacity-80 mb-0.5" />
        {settings.income > 0 ? (
          <div className="flex-1 flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] opacity-65 mb-[3px]">这个月预计能存</div>
              <div className={bigNumCls}>¥{fmt2(savings)}</div>
            </div>
            {/* 收入/预算/购物/会员 四宫格 */}
            <div className="grid grid-cols-2 gap-[5px] w-[110px] shrink-0">
              {[
                { label: '收入', val: settings.income },
                { label: '预算', val: settings.budget },
                { label: '购物', val: shopping },
                { label: '会员', val: subs },
              ].map((g) => (
                <div key={g.label} className="rounded-s px-2 py-1.5 flex flex-col gap-px" style={{ background: 'var(--color-oncard-track)' }}>
                  <span className="text-[11px] font-semibold tabular-nums">¥{fmt2(g.val)}</span>
                  <span className="text-[9px] opacity-60">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-[11px] opacity-65 mb-[3px]">存钱卡</div>
            <div className="text-[22px] font-light opacity-70">未开卡</div>
            <div className="text-[11px] opacity-50 mt-1">点击设置月收入 →</div>
          </div>
        )}
      </div>

      </div>{/* md:grid 双栏卡片区结束 */}
    </div>
  )
}
