/**
 * 硬币判官 v2 · 全部 TypeScript 接口（文档第 5 节，逐字落地）
 *
 * 注意：文档把"消费记录"命名为 Record，与 TS 内置 Record<K,V> 工具类型同名。
 * 本项目内部统一用文档的 Record（消费记录），需要字典类型时写 { [k: string]: X }。
 */

export type ThemeMode = 'auto' | 'light' | 'dark'
export type Mood = 'impulse' | 'need' | 'reward' // 冲动😡 / 需要✅ / 奖励🎁
export type Tag = 'worth' | 'unworth'           // 审判结果只有两桶（技术债 #5）
export type SubCycle = 'month' | 'year'

export interface Settings {
  income: number            // 每月固定收入
  budget: number            // 每月日常预算
  registerDate: string      // 'YYYY-MM-DD'，首次同时填完收入+预算时自动记录
  openingBalance: number    // 期初余额（注册时=初始余额；之后=上月期末余额）
  reminderDays: number      // 回顾提醒天数 1–30，默认 7
  theme: ThemeMode          // v2 新增，默认 'auto'（跟随系统）
  notifyEnabled: boolean    // v2 新增（P3），默认 false
}

export interface Record { // 消费记录（最核心；旧版 shopping 表改名）
  id: number              // Date.now()
  amount: number
  name: string            // 备注："买什么了/为什么买"
  categoryId: string      // → categories 表的 id
  mood: Mood
  tag: Tag                // 审判结果，默认 'worth'
  date: string            // 统一 'YYYY-MM-DD'（技术债 #4：旧版两种格式并存）
  reminderDays: number    // 创建时快照当时的全局 reminderDays
  reminded: boolean       // 是否已回顾
  used: boolean | null    // 回顾结果：用到了/没用到；未回顾为 null
  createdAt: number
}

export interface Account {
  id: number
  name: string
  icon: string            // 'wechat' | 'alipay' | 'card' | 'cash' | 'cloudpay' | 自定义
  balance: number
}

export interface Subscription {
  id: number
  name: string
  icon: string            // emoji
  amount: number
  renewDate: string       // 'YYYY-MM-DD' 下次扣费日
  cycle: SubCycle         // 年付在计算时 amount/12 分摊
  autoRenew: boolean
}

export interface Category { // v2 新增：支持自定义分类
  id: string
  name: string
  emoji: string
  color: string           // hex
  builtin: boolean        // 内置 6 类可改名/改图标，不可删除；自定义类可删
}

export interface MonthlyRecord { // 月度对账历史
  month: string           // 'YYYY-M'
  opening: number
  closingBalance: number
  income: number
  budget: number
  shop: number
  sub: number
  actualSpending: number
  actualDaily: number     // 推算出的"看不见的日常支出"
  actualSavings: number
  review: string          // 本月复盘
  date: string            // 对账操作日期
}

export interface AppState {
  meta: { version: 2 }    // 数据结构版本号，用于未来迁移
  settings: Settings
  accounts: Account[]
  records: Record[]
  subscriptions: Subscription[]
  categories: Category[]
  principles: string[]    // 消费原则
  monthlyHistory: MonthlyRecord[]
}

/** 内置 6 分类（文档 5.2，首次启动自动播种，builtin: true） */
export const BUILTIN_CATEGORIES: Category[] = [
  { id: 'food',          name: '餐饮', emoji: '🍜', color: '#FF9F43', builtin: true },
  { id: 'shopping',      name: '购物', emoji: '🛍', color: '#5BB8FF', builtin: true },
  { id: 'entertainment', name: '娱乐', emoji: '🎮', color: '#A55EEA', builtin: true },
  { id: 'transport',     name: '交通', emoji: '🚇', color: '#26DE81', builtin: true },
  { id: 'daily',         name: '日用', emoji: '🏠', color: '#FDCE4C', builtin: true },
  { id: 'other',         name: '其他', emoji: '📦', color: '#A0A4B8', builtin: true },
]

/** 情绪三选（文档 5.2） */
export const MOODS: { key: Mood; label: string; emoji: string }[] = [
  { key: 'impulse', label: '冲动', emoji: '😡' },
  { key: 'need',    label: '需要', emoji: '✅' },
  { key: 'reward',  label: '奖励', emoji: '🎁' },
]

/** 默认设置（文档 5.1） */
export const DEFAULT_SETTINGS: Settings = {
  income: 0,
  budget: 0,
  registerDate: '',
  openingBalance: 0,
  reminderDays: 7,
  theme: 'auto',
  notifyEnabled: false,
}
