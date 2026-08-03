/**
 * 空状态（文档第 4 节 EmptyState）
 * v2.1（问卷 Q8）：优先展示小怪兽插画；illustration 传入 <Monster/> 等 SVG。
 * 插画坐在主题浅蓝圆底上（白身体需要底色衬托，深浅主题自动适配）。
 */
import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  emoji?: string
  illustration?: ReactNode
}

export default function EmptyState({ title, description, emoji = '📦', illustration }: Props) {
  return (
    <div className="flex flex-col items-center pt-16 pb-8 text-center">
      {illustration ? (
        <div className="w-24 h-24 rounded-full bg-primary-bg flex items-end justify-center overflow-hidden mb-3">
          {illustration}
        </div>
      ) : (
        <span className="text-4xl mb-3 opacity-60">{emoji}</span>
      )}
      <p className="text-sm text-text-3">{title}</p>
      {description && <p className="text-xs text-text-3 mt-1 opacity-70">{description}</p>}
    </div>
  )
}
