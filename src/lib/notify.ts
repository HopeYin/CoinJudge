/**
 * 系统通知（文档 P3-2）：有"买后该回顾"的东西时，用浏览器系统通知提醒
 * - 网页通知完全依赖浏览器能力，用户需允许通知权限
 * - App 启动时查一次；打开期间每 30 分钟查一次，同一天最多提醒一回
 */
import { useEffect } from 'react'
import { useStore } from '../store/store'
import { pendingReview } from '../store/derived'
import { todayStr } from './date'

let lastNotifyDate = '' // 本次运行内，哪天提醒过

function checkAndNotify() {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  const today = todayStr()
  if (lastNotifyDate === today) return
  const pending = pendingReview(useStore.getState().records)
  if (pending.length === 0) return
  lastNotifyDate = today
  new Notification('硬币判官', {
    body: `你有 ${pending.length} 笔买的东西该回顾了，还记得用起来值不值吗？`,
    icon: '/pwa-192.png',
  })
}

/** 挂载后：立即查一次 + 每 30 分钟查一次 */
export function useReviewNotify() {
  const enabled = useStore((s) => s.settings.notifyEnabled)
  useEffect(() => {
    if (!enabled) return
    checkAndNotify()
    const timer = window.setInterval(checkAndNotify, 30 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [enabled])
}

/** 打开开关：先请求浏览器权限，返回是否成功启用 */
export async function enableNotify(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof Notification === 'undefined') {
    return { ok: false, reason: '当前浏览器不支持系统通知' }
  }
  if (Notification.permission === 'granted') return { ok: true }
  if (Notification.permission === 'denied') {
    return { ok: false, reason: '浏览器已拒绝通知权限，请在地址栏左侧的站点设置里手动允许' }
  }
  const result = await Notification.requestPermission()
  return result === 'granted'
    ? { ok: true }
    : { ok: false, reason: '未获得通知权限，提醒不会发出' }
}
