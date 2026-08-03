import PageHeader from '../components/PageHeader'
import { IconScale } from '../components/icons'
import { useStore } from '../store/store'

// P1 基础版：只读展示消费原则（完整 CRUD + 回顾闭环在 P2）
export default function PrinciplePage() {
  const principles = useStore((s) => s.principles)
  return (
    <div className="page-fade min-h-screen bg-bg pb-28">
      <PageHeader title="原则" icon={<IconScale width={22} height={22} />} />
      {principles.length === 0 ? (
        <p className="text-center text-text-3 text-sm pt-20">
          还没有消费原则
          <br />
          <span className="text-xs">（原则的增删改在下一阶段开放）</span>
        </p>
      ) : (
        <div className="px-4 pt-2">
          {principles.map((p, i) => (
            <div key={i} className="bg-card rounded-l shadow-card px-4 py-3 mb-2 flex gap-3">
              <span className="text-text-3 text-sm">{i + 1}.</span>
              <span className="text-text-1 text-sm leading-relaxed">{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
