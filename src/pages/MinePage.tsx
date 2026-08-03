/**
 * 我的（P2-6b）：预算设置 + 功能入口 + 数据管理
 * - 导出备份：整包 JSON 下载（文档 5.4）
 * - 导入恢复：只认 v2 备份，格式错误给出明确提示
 * - 清空流水：全部 / 按日期范围，实时预览删除条数，输入「确定」才可执行
 */
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { IconPerson, IconChevron } from '../components/icons'
import { useStore } from '../store/store'
import { formatYMD, todayStr } from '../lib/date'
import { buildBackup, parseBackup } from '../lib/backup'
import { useBackClose } from '../lib/useBackClose'

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
  const records = useStore((s) => s.records)
  const importAll = useStore((s) => s.importAll)
  const clearRecords = useStore((s) => s.clearRecords)

  const [tip, setTip] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* 清空流水弹窗状态 */
  const [clearOpen, setClearOpen] = useState(false)
  const [clearMode, setClearMode] = useState<'all' | 'range'>('all')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [confirmText, setConfirmText] = useState('')
  useBackClose(clearOpen, () => setClearOpen(false))

  const showTip = (ok: boolean, text: string) => {
    setTip({ ok, text })
    window.setTimeout(() => setTip(null), 3000)
  }

  /* ── 导出备份 ── */
  const handleExport = () => {
    const json = buildBackup(useStore.getState())
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `硬币判官_备份_${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showTip(true, '备份文件已开始下载，请妥善保存')
  }

  /* ── 导入恢复 ── */
  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = parseBackup(String(reader.result))
        importAll(data)
        showTip(true, `恢复成功：${data.records.length} 条流水、${data.accounts.length} 个账户`)
      } catch (err) {
        showTip(false, err instanceof Error ? err.message : '导入失败，请换个文件试试')
      }
    }
    reader.onerror = () => showTip(false, '文件读取失败，请重试')
    reader.readAsText(file)
  }

  /* ── 清空流水 ── */
  const rangeValid = clearMode === 'all' || (rangeStart !== '' && rangeEnd !== '' && rangeStart <= rangeEnd)
  const willDelete =
    clearMode === 'all'
      ? records.length
      : rangeValid
        ? records.filter((r) => r.date >= rangeStart && r.date <= rangeEnd).length
        : 0
  const canClear = rangeValid && willDelete > 0 && confirmText === '确定'
  const openClear = () => {
    setClearMode('all')
    setRangeStart('')
    setRangeEnd('')
    setConfirmText('')
    setClearOpen(true)
  }
  const handleClear = () => {
    clearRecords(clearMode === 'range' ? { start: rangeStart, end: rangeEnd } : undefined)
    setClearOpen(false)
    showTip(true, `已删除 ${willDelete} 条流水`)
  }

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

      {/* 数据管理 */}
      <div className="bg-card rounded-l shadow-card mx-4 mt-2.5 p-4">
        <div className="text-xs text-text-3 mb-1">数据管理</div>
        <button className="pressable w-full flex items-center justify-between py-3.5 border-b border-border" onClick={handleExport}>
          <span className="text-[15px] text-text-1">导出备份</span>
          <span className="text-xs text-text-3">JSON 文件</span>
        </button>
        <button
          className="pressable w-full flex items-center justify-between py-3.5 border-b border-border"
          onClick={() => fileRef.current?.click()}
        >
          <span className="text-[15px] text-text-1">导入恢复</span>
          <span className="text-xs text-text-3">会覆盖当前全部数据</span>
        </button>
        <button className="pressable w-full flex items-center justify-between py-3.5" onClick={openClear}>
          <span className="text-[15px] text-danger">清空流水</span>
          <span className="text-xs text-text-3">不可恢复</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImportFile(f)
            e.target.value = ''
          }}
        />
        {tip && (
          <p className={`text-xs pt-2 ${tip.ok ? 'text-success' : 'text-danger'}`}>{tip.text}</p>
        )}
      </div>

      <p className="text-center text-xs text-text-3 py-5">硬币判官 v2.1 · 记一笔，判一笔</p>

      {/* ── 清空流水确认弹窗 ── */}
      {clearOpen && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[90] flex items-end justify-center"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setClearOpen(false)
          }}
        >
          <div
            className="sheet-slide-up w-full bg-card rounded-t-[20px] px-5 pt-6"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="text-center text-lg font-semibold text-text-1 mb-1">清空流水</div>
            <p className="text-center text-xs text-text-3 mb-4">删除后不可恢复，建议先导出备份</p>

            {/* 范围选择 */}
            <div className="flex gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => setClearMode('all')}
                className={`pressable flex-1 py-2.5 rounded-m text-sm border-2 ${
                  clearMode === 'all'
                    ? 'border-danger text-danger bg-danger-bg font-semibold'
                    : 'border-border text-text-2'
                }`}
              >
                全部流水
              </button>
              <button
                type="button"
                onClick={() => setClearMode('range')}
                className={`pressable flex-1 py-2.5 rounded-m text-sm border-2 ${
                  clearMode === 'range'
                    ? 'border-danger text-danger bg-danger-bg font-semibold'
                    : 'border-border text-text-2'
                }`}
              >
                按日期范围
              </button>
            </div>
            {clearMode === 'range' && (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="flex-1 min-w-0 bg-bg rounded-m px-3 py-2.5 text-sm text-text-1 outline-none"
                />
                <span className="text-text-3 text-sm">至</span>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="flex-1 min-w-0 bg-bg rounded-m px-3 py-2.5 text-sm text-text-1 outline-none"
                />
              </div>
            )}

            {/* 实时预览 */}
            <p className="text-center text-sm mb-4">
              {rangeValid ? (
                <span className="text-danger font-semibold">将删除 {willDelete} 条流水</span>
              ) : (
                <span className="text-text-3">请选择有效的日期范围</span>
              )}
            </p>

            {/* 输入「确定」解锁 */}
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="输入「确定」二字解锁删除按钮"
              className="w-full bg-bg rounded-m px-4 py-3 text-sm text-text-1 text-center outline-none mb-4 placeholder:text-text-3"
            />
            <button
              type="button"
              disabled={!canClear}
              onClick={handleClear}
              className={`pressable w-full py-3 rounded-m text-sm font-semibold ${
                canClear ? 'bg-danger text-white' : 'bg-bg text-text-3'
              }`}
            >
              确认删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
