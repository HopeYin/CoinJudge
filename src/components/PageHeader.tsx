/**
 * 页面顶部固定栏（沿用旧版 header-fixed：白底 64px + 占位高度）
 * Tab 页传 icon+title+right；二级页传 back 显示返回箭头。
 */
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBack } from './icons'

interface Props {
  title: string
  icon?: ReactNode      // 标题左侧小图标（Tab 页用）
  back?: boolean        // 显示返回按钮（二级页用）
  right?: ReactNode     // 右侧插槽
}

export default function PageHeader({ title, icon, back, right }: Props) {
  const navigate = useNavigate()
  return (
    <>
      <div className="shell-fixed top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center gap-2 px-5 py-4 h-16">
          {back && (
            <button
              className="pressable text-text-1 text-xl leading-none -ml-1 mr-1"
              onClick={() => navigate(-1)}
              aria-label="返回"
            >
              <IconBack width={22} height={22} />
            </button>
          )}
          {icon && <span className="text-text-1 flex items-center">{icon}</span>}
          <span className="text-xl font-semibold text-text-1 flex-1 truncate">{title}</span>
          {right}
        </div>
      </div>
      <div className="h-16" /> {/* 占位：把内容顶到固定栏下面 */}
    </>
  )
}
