/**
 * 银行卡组件（v2.1 文档 9.2 真卡规范）：
 * - aspect-ratio 85.6/54（真卡比例，.bank-card 类实现）
 * - 圆角 4% / 6% 百分比（真卡手感，卡片任何尺寸下观感一致）
 * - 宽度 = 内容宽 − 32px（mx-4），桌面端不随屏幕放大
 * - 蓝渐变 + 蓝色彩色投影；active=false 时未开卡灰渐变
 */
import type { CSSProperties, ReactNode } from 'react'

interface BankCardProps {
  active?: boolean          // true=蓝渐变已开卡；false=灰渐变未开卡
  onClick?: () => void
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export default function BankCard({ active = true, onClick, className = '', style, children }: BankCardProps) {
  return (
    <div
      className={`bank-card pressable mx-4 mt-2.5 px-5 pt-[18px] pb-3.5 flex flex-col relative overflow-hidden cursor-pointer text-on-primary ${
        active ? 'shadow-blue-card' : ''
      } ${className}`}
      style={{
        background: active ? 'var(--gradient-bank)' : 'var(--gradient-bank-gray)',
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
