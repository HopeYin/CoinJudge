/**
 * 我的（P1）：月收入 / 月预算 / 期初余额设置
 * 首次同时填完收入+预算 → store 自动记录 registerDate（文档 5.1）
 * 数据管理（导入导出/清空）在 P2，主题切换在 P3。
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { IconPerson, IconChevron } from '../components/icons'
import { useStore } from '../store/store'
import { formatYMD } from '../lib/date'

interface MoneyRowProps {
  label: string
  placeholder: string
  value: number
  onSave: (v: number) => void
}

function MoneyRow({ label, placeholder, value, onSave }: MoneyRowProps) {
  const [text, setText] = useState(value > 0 ? String(value) : '')
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-b-0">
      <span className="text-[15px] text-text-1">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-[15px] text-text-2">¥</span>
        <input
          type="number"
          inputMode="decimal"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => onSave(parseFloat(text) || 0)}
          className="w-24 text-right text-[15px] text-text-1 bg-transparent outline-none placeholder:text-text-3"
        />
      </div>
    </div>
  )
}

export default function MinePage() {
  const navigate = useNavigate()
  const settings = useStore((s) => s.settings)
  const setIncome = useStore((s) => s.setIncome)
  const setBudget = useStore((s) => s.setBudget)
  const setOpeningBalance = useStore((s) => s.setOpeningBalance)

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title="我的" icon={<IconPerson width={22} height={22} />} />

      {/* 预算设置 */}
      <div className="bg-card rounded-l shadow-card mx-4 mt-2.5 p-4">
        <div className="text-xs text-text-3 mb-1">预算设置</div>
        <MoneyRow label="每月日常预算" placeholder="食费预算" value={settings.budget} onSave={setBudget} />
        <MoneyRow label="每月固定收入" placeholder="工资/生活费" value={settings.income} onSave={setIncome} />
        <MoneyRow
          label="期初余额"
          placeholder="各账户总和"
          value={settings.openingBalance}
          onSave={setOpeningBalance}
        />
        {settings.registerDate && (
          <p className="text-[11px] text-text-3 pt-2.5">
            注册于 {formatYMD(settings.registerDate)} · 注册当月收入/预算按剩余天数自动折算
          </p>
        )}
      </div>

      {/* 功能 */}
      <div className="bg-card rounded-l shadow-card mx-4 mt-2.5 p-4">
        <div className="text-xs text-text-3 mb-1">功能</div>
        <button
          className="pressable w-full flex items-center justify-between py-3.5"
          onClick={() => navigate('/monthly')}
        >
          <span className="text-[15px] text-text-1">月底对账</span>
          <IconChevron width={18} height={18} className="text-text-3" />
        </button>
      </div>

      <p className="text-center text-xs text-text-3 py-5">硬币判官 v2.0 · 记一笔，判一笔</p>
    </div>
  )
}
