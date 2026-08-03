/**
 * 弹窗与浏览器返回键联动（v2.1 文档 P2-4）
 * 用法：useBackClose(open, onClose)
 * - 弹窗打开时 pushState 压入一条历史；按系统/浏览器返回键 → 关闭弹窗，页面不后退
 * - 弹窗被按钮程序关闭（保存/取消/遮罩）→ 自动把压入的历史退掉，不多留记录
 * - 模块级栈处理嵌套弹窗（如日期滚轮盖在记账弹窗上）：
 *   · 返回键一次只关最上层
 *   · 上层被程序关闭触发的那次 popstate，下层通过 skipPop 集合识别并忽略
 */
import { useEffect, useRef } from 'react'

const stack: symbol[] = []
const skipPop = new Set<symbol>()

export function useBackClose(open: boolean, onClose: () => void) {
  const idRef = useRef<symbol | null>(null)
  if (idRef.current === null) idRef.current = Symbol('modal')
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const id = idRef.current as symbol
    window.history.pushState(null, '')
    stack.push(id)

    const onPop = () => {
      if (skipPop.delete(id)) return // 这次后退是上层弹窗程序关闭引发的，忽略
      if (stack[stack.length - 1] !== id) return // 只关最上层
      stack.pop()
      onCloseRef.current()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      const idx = stack.indexOf(id)
      if (idx === -1) return // 自己是被返回键关掉的，历史已弹出
      const isTop = idx === stack.length - 1
      stack.splice(idx, 1)
      if (isTop) {
        // 程序关闭：通知其余弹窗忽略接下来这次 popstate，然后退掉自己压入的历史
        stack.forEach((other) => skipPop.add(other))
        window.history.back()
      }
    }
  }, [open])
}
