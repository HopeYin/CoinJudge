/**
 * 资产管理（P1）：账户增删改，预设 微信/支付宝/银行卡/现金/云闪付 5 种 SVG 图标
 * 沿用旧版 Assets.vue：顶部蓝色渐变总卡 + 白卡列表（余额可直接改）+ 右下角 + 唤起添加弹窗。
 */
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Monster from '../components/Monster'
import { ACCOUNT_ICON_DEFS, getAccountIconDef } from '../components/icons'
import { useStore } from '../store/store'
import { fmt2 } from '../lib/format'
import { useBackClose } from '../lib/useBackClose'

export default function AssetsPage() {
  const accounts = useStore((s) => s.accounts)
  const addAccount = useStore((s) => s.addAccount)
  const updateAccount = useStore((s) => s.updateAccount)
  const deleteAccount = useStore((s) => s.deleteAccount)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ icon: 'wechat', name: '微信', balance: '' })

  // 添加账户弹窗：返回键优先关弹窗（P2-4）
  useBackClose(showAdd, () => setShowAdd(false))

  const totalAssets = accounts.reduce((s, a) => s + (a.balance || 0), 0)

  const submit = () => {
    if (!form.name.trim()) return
    addAccount({ name: form.name.trim(), icon: form.icon, balance: parseFloat(form.balance) || 0 })
    setForm({ icon: 'wechat', name: '微信', balance: '' })
    setShowAdd(false)
  }

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="资产管理"
        back
        right={<span className="text-sm text-primary font-semibold">¥{fmt2(totalAssets)}</span>}
      />

      {/* 顶部总资产卡（蓝色渐变，沿用旧版） */}
      <div
        className="mx-4 mt-3 rounded-[18px] p-[22px] text-on-primary shadow-blue-card"
        style={{ background: 'var(--gradient-bank)' }}
      >
        <div className="text-xs opacity-70">总资产</div>
        <div className="text-[32px] font-light my-1 tabular-nums">¥{fmt2(totalAssets)}</div>
        <div className="text-xs opacity-60">{accounts.length} 个账户</div>
      </div>

      {/* 账户列表 */}
      <div className="text-xs text-text-3 px-5 pt-4 pb-1.5">我的账户</div>
      {accounts.length === 0 && (
        <EmptyState
          illustration={<Monster variant="wave" width={72} />}
          title="还没有账户"
          description="点右下角 + 添加第一个"
        />
      )}
      {accounts.map((acc) => {
        const def = getAccountIconDef(acc.icon)
        return (
          <div
            key={acc.id}
            className="bg-card mx-4 mb-1.5 rounded-[14px] shadow-card px-3.5 py-3 flex items-center gap-2.5"
          >
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: def.bg, color: def.color }}
            >
              <def.Icon width={18} height={18} />
            </div>
            <input
              value={acc.name}
              onChange={(e) => updateAccount(acc.id, { name: e.target.value })}
              className="flex-1 min-w-0 text-sm text-text-1 bg-transparent outline-none"
            />
            <input
              type="number"
              inputMode="decimal"
              value={acc.balance === 0 ? '' : String(acc.balance)}
              placeholder="0.00"
              onChange={(e) => updateAccount(acc.id, { balance: parseFloat(e.target.value) || 0 })}
              className="w-24 text-right text-sm text-text-1 font-medium bg-bg rounded-s px-2.5 py-1.5 outline-none placeholder:text-text-3"
            />
            <button
              className="pressable w-6 h-6 rounded-full bg-danger-bg text-danger text-sm flex items-center justify-center shrink-0"
              onClick={() => deleteAccount(acc.id)}
              aria-label={`删除${acc.name}`}
            >
              ×
            </button>
          </div>
        )
      })}

      {/* 右下角 +（相对 430 内容区定位） */}
      <div
        className="modal-fixed pointer-events-none z-40"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-end px-4">
          <button
            className="pressable pointer-events-auto w-[52px] h-[52px] rounded-full bg-primary text-on-primary text-[28px] leading-none shadow-float flex items-center justify-center"
            onClick={() => setShowAdd(true)}
            aria-label="添加账户"
          >
            +
          </button>
        </div>
      </div>

      {/* 添加账户弹窗（底部弹层，沿用旧版） */}
      {showAdd && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[100] flex items-end justify-center"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false)
          }}
        >
          <div
            className="sheet-slide-up w-full bg-card rounded-t-[22px] px-5 pt-6"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="text-base font-semibold text-text-1 mb-4">添加账户</div>

            {/* 5 种预设图标 */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {ACCOUNT_ICON_DEFS.map((def) => (
                <button
                  key={def.key}
                  type="button"
                  onClick={() => setForm({ ...form, icon: def.key, name: def.name })}
                  className={`pressable shrink-0 flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-[14px] border-[1.5px] ${
                    form.icon === def.key ? 'border-primary bg-primary-bg' : 'border-border bg-bg'
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-[13px] flex items-center justify-center"
                    style={{ background: def.bg, color: def.color }}
                  >
                    <def.Icon width={22} height={22} />
                  </div>
                  <span className="text-[11px] text-text-2">{def.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <label className="text-sm text-text-2 w-[52px] shrink-0">账户名</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="自定义名称"
                className="flex-1 text-[15px] text-text-1 bg-transparent outline-none placeholder:text-text-3"
              />
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-border">
              <label className="text-sm text-text-2 w-[52px] shrink-0">余额</label>
              <div className="flex items-center gap-1 flex-1 text-text-2">
                <span>¥</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.balance}
                  placeholder="0.00"
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  className="flex-1 text-[15px] text-text-1 bg-transparent outline-none placeholder:text-text-3"
                />
              </div>
            </div>

            <button
              className="pressable w-full mt-5 py-3.5 rounded-[14px] bg-primary text-on-primary text-base"
              onClick={submit}
            >
              确认添加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
