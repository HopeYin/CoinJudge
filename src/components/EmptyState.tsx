/**
 * 空状态（文档第 4 节 EmptyState）
 */
interface Props {
  title: string
  description?: string
  emoji?: string
}

export default function EmptyState({ title, description, emoji = '📦' }: Props) {
  return (
    <div className="flex flex-col items-center pt-16 pb-8 text-center">
      <span className="text-4xl mb-3 opacity-60">{emoji}</span>
      <p className="text-sm text-text-3">{title}</p>
      {description && <p className="text-xs text-text-3 mt-1 opacity-70">{description}</p>}
    </div>
  )
}
