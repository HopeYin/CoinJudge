import PageHeader from '../components/PageHeader'

// P2 页面：月底对账（期初/收入/预算 → 期末录入 → 复盘保存）
export default function MonthlyPage() {
  return (
    <div className="page-fade min-h-screen bg-bg pb-28">
      <PageHeader title="月底对账" back />
      <p className="text-center text-text-3 text-sm pt-20">月底对账在 P2 阶段开放</p>
    </div>
  )
}
