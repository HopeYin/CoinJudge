/**
 * App 根组件（文档第 4 节）：路由出口 + TabBar + 全局 RecordModal
 * 另负责：主题（light/dark/auto 跟随系统）→ 在 <html> 上挂 .dark class
 */
import { useEffect } from 'react'
import { HashRouter, useLocation } from 'react-router-dom'
import AppRoutes from './router'
import TabBar from './components/TabBar'
import RecordModal from './components/RecordModal'
import { useStore } from './store/store'

/** 根据 settings.theme 切换 .dark；auto 时监听系统偏好 */
function useTheme() {
  const theme = useStore((s) => s.settings.theme)
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'auto' && mq.matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    if (theme === 'auto') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])
}

/** 路由变化时给内容区一个 0.12s 淡入（文档 9.3；key 变化触发 CSS 动画重播） */
function PageOutlet() {
  const location = useLocation()
  return (
    <main key={location.pathname} className="page-fade">
      <AppRoutes />
    </main>
  )
}

export default function App() {
  useTheme()
  return (
    <HashRouter>
      <div className="shell min-h-screen bg-bg relative">
        <PageOutlet />
        <TabBar />
        <RecordModal /> {/* 全局唯一记账入口，只挂载一份（文档 8.2） */}
      </div>
    </HashRouter>
  )
}
