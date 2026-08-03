/**
 * 底部悬浮胶囊导航（文档 P1：金库 / 流水 /（中央 +）/ 原则 / 我的）
 * 沿用旧版：毛玻璃 blur(20px)、圆角 28px、中央蓝色圆形 + 上浮 8px、safe-area 适配。
 * 中央 + 通过全局事件唤起 RecordModal（全局只挂载一份，文档 8.2）。
 */
import { NavLink } from 'react-router-dom'
import type { SVGProps } from 'react'
import { IconVault, IconFlow, IconScale, IconPerson, IconPlus } from './icons'

type IconComponent = (p: SVGProps<SVGSVGElement>) => JSX.Element

const LEFT_TABS = [
  { to: '/wallet', label: '金库', Icon: IconVault },
  { to: '/flow', label: '流水', Icon: IconFlow },
]
const RIGHT_TABS = [
  { to: '/principle', label: '原则', Icon: IconScale },
  { to: '/mine', label: '我的', Icon: IconPerson },
]

function TabItem({ to, label, Icon }: { to: string; label: string; Icon: IconComponent }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `pressable flex-1 flex flex-col items-center gap-0.5 py-1.5 no-underline transition-colors ${
          isActive ? 'text-primary' : 'text-text-3'
        }`
      }
    >
      <Icon width={22} height={22} />
      <span className="text-[10px] tracking-wide">{label}</span>
    </NavLink>
  )
}

export default function TabBar() {
  const openRecordModal = () => {
    window.dispatchEvent(new CustomEvent('open-record-modal'))
  }
  return (
    <nav
      className="modal-fixed z-50 h-14 rounded-full shadow-nav flex items-center justify-around px-3 backdrop-blur-xl"
      style={{
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        background: 'var(--color-tabbar-bg)',
      }}
    >
      {LEFT_TABS.map((t) => (
        <TabItem key={t.to} {...t} />
      ))}
      <button
        className="tab-center-btn w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-float"
        onClick={openRecordModal}
        aria-label="记一笔"
      >
        <IconPlus width={24} height={24} />
      </button>
      {RIGHT_TABS.map((t) => (
        <TabItem key={t.to} {...t} />
      ))}
    </nav>
  )
}
