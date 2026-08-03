/**
 * 路由表（文档 8.1）：HashRouter，7 条路由全部懒加载
 * / → /wallet；Tab 页 4 个；二级页 3 个（统计/资产/月底对账）
 */
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const WalletPage = lazy(() => import('./pages/WalletPage'))
const FlowPage = lazy(() => import('./pages/FlowPage'))
const PrinciplePage = lazy(() => import('./pages/PrinciplePage'))
const MinePage = lazy(() => import('./pages/MinePage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const AssetsPage = lazy(() => import('./pages/AssetsPage'))
const MonthlyPage = lazy(() => import('./pages/MonthlyPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <Routes>
        <Route path="/" element={<Navigate to="/wallet" replace />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/flow" element={<FlowPage />} />
        <Route path="/principle" element={<PrinciplePage />} />
        <Route path="/mine" element={<MinePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/monthly" element={<MonthlyPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="*" element={<Navigate to="/wallet" replace />} />
      </Routes>
    </Suspense>
  )
}
