/**
 * 全站内联手写 SVG 图标（文档第 3 节：禁止引入图标库）
 * 图形全部沿用旧版手绘线条风（stroke 1.6–1.8，圆角线帽）。
 */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

function base(props: P): P {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    width: '1em',
    height: '1em',
    ...props,
  }
}

/* ── TabBar 图标（沿用旧版 App.vue） ── */
export const IconVault = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="3" width="16" height="18" rx="2" />
    <circle cx="10" cy="12" r="3.5" />
    <line x1="10" y1="8.5" x2="10" y2="12" />
    <circle cx="10" cy="12" r="1" fill="currentColor" stroke="none" />
    <path d="M18 9h3M18 15h3" />
    <path d="M20 9v6" />
    <line x1="3" y1="7" x2="3" y2="9.5" strokeWidth="2.5" />
    <line x1="3" y1="14.5" x2="3" y2="17" strokeWidth="2.5" />
  </svg>
)

export const IconFlow = (p: P) => (
  <svg {...base(p)} strokeWidth={1.7}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
)

export const IconScale = (p: P) => (
  <svg {...base(p)}>
    <line x1="12" y1="3" x2="12" y2="21" />
    <path d="M8 21h8" />
    <path d="M3 7h18" />
    <path d="M3 7l3 7a3 3 0 0 0 6 0L9 7" />
    <path d="M12 7l3 7a3 3 0 0 0 6 0L18 7" />
  </svg>
)

export const IconPerson = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4 20c0-3.8 3.6-6.5 8-6.5s8 2.7 8 6.5" />
  </svg>
)

export const IconStats = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
)

export const IconPlus = (p: P) => (
  <svg {...base(p)} strokeWidth={2.5}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

/* ── Wallet 银行卡卡面图标（沿用旧版 Wallet.vue） ── */
export const IconCardAsset = (p: P) => (
  <svg {...base(p)} stroke="white">
    <rect x="2" y="7" width="20" height="14" rx="2.5" />
    <path d="M2 11h20" />
    <circle cx="17" cy="14" r="1.5" fill="white" stroke="none" />
    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
  </svg>
)

export const IconCardBudget = (p: P) => (
  <svg {...base(p)} stroke="white">
    <line x1="12" y1="3" x2="12" y2="21" />
    <path d="M8 21h8" />
    <path d="M3 7h18" />
    <path d="M3 7l3 7a3 3 0 0 0 6 0L9 7" />
    <path d="M12 7l3 7a3 3 0 0 0 6 0L18 7" />
  </svg>
)

export const IconCardSave = (p: P) => (
  <svg {...base(p)} stroke="white">
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <circle cx="12" cy="16" r="2" />
    <path d="M8 6V4h8v2" />
  </svg>
)

/* ── 账户图标（沿用旧版 Assets.vue；key 按文档 5.2 命名） ── */
const stroke18 = (p: P): P => ({ ...base(p), strokeWidth: 1.8 })

export const IconWechat = (p: P) => (
  <svg {...stroke18(p)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
export const IconAlipay = (p: P) => (
  <svg {...stroke18(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5c1.5-2 5.5-2 7 0" />
    <line x1="12" y1="7" x2="12" y2="10" />
  </svg>
)
export const IconBankCard = (p: P) => (
  <svg {...stroke18(p)}>
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="9" x2="23" y2="9" />
    <line x1="6" y1="14" x2="9" y2="14" />
  </svg>
)
export const IconCash = (p: P) => (
  <svg {...stroke18(p)}>
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="20" y1="9" x2="23" y2="9" />
  </svg>
)
export const IconCloudpay = (p: P) => (
  <svg {...stroke18(p)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

/**
 * 账户预设（文档 P1：微信/支付宝/银行卡/现金/云闪付 5 种 SVG 图标）。
 * 底色/图标色沿用旧版配色，属于"数据"而非 CSS 硬编码（与分类色同理）。
 */
export interface AccountIconDef {
  key: string
  name: string
  bg: string
  color: string
  Icon: (p: P) => JSX.Element
}
export const ACCOUNT_ICON_DEFS: AccountIconDef[] = [
  { key: 'wechat',   name: '微信',   bg: '#E7F9EC', color: '#1AAD19', Icon: IconWechat },
  { key: 'alipay',   name: '支付宝', bg: '#E8F3FF', color: '#1677FF', Icon: IconAlipay },
  { key: 'card',     name: '银行卡', bg: '#EEF4FF', color: '#5BB8FF', Icon: IconBankCard },
  { key: 'cash',     name: '现金',   bg: '#EDFBF0', color: '#4CAF82', Icon: IconCash },
  { key: 'cloudpay', name: '云闪付', bg: '#FFECEC', color: '#E40000', Icon: IconCloudpay },
]
const FALLBACK_DEF = ACCOUNT_ICON_DEFS[2]
export function getAccountIconDef(key: string): AccountIconDef {
  return ACCOUNT_ICON_DEFS.find((d) => d.key === key) ?? FALLBACK_DEF
}

/* ── 通用小图标 ── */
export const IconBack = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
export const IconChevron = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)
export const IconBackspace = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <line x1="18" y1="9" x2="12" y2="15" />
    <line x1="12" y1="9" x2="18" y2="15" />
  </svg>
)
