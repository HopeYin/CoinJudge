/**
 * zustand store + persist（文档 5.3）
 * - 单 key：coinjudge_v2，整个 state JSON 序列化进 localStorage
 * - 业务代码任何位置禁止直接调用 localStorage，必须走这里
 * - 首次启动自动播种内置 6 分类（文档 5.2）
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppState, Settings, MonthlyRecord,
  ThemeMode, Mood, Tag, SubCycle,
} from './types'
import { BUILTIN_CATEGORIES, DEFAULT_SETTINGS } from './types'
import { todayStr } from '../lib/date'

/** addRecord 的入参：id/reminderDays/reminded/used/createdAt 由 store 自动补 */
export interface NewRecordInput {
  amount: number
  name: string
  categoryId: string
  mood: Mood
  tag?: Tag          // 缺省 'worth'（文档 5.2）
  date: string       // 'YYYY-MM-DD'
}

export interface NewSubscriptionInput {
  name: string
  icon: string
  amount: number
  renewDate: string
  cycle: SubCycle
  autoRenew: boolean
}

export interface StoreActions {
  /* 设置 */
  setIncome: (income: number) => void
  setBudget: (budget: number) => void
  setOpeningBalance: (openingBalance: number) => void
  setReminderDays: (days: number) => void
  setTheme: (theme: ThemeMode) => void
  setNotifyEnabled: (on: boolean) => void
  /* 消费记录 */
  addRecord: (input: NewRecordInput) => void
  deleteRecord: (id: number) => void
  reviewRecord: (id: number, used: boolean) => void // 回顾：标记 used + reminded（P2 用）
  /* 账户 */
  addAccount: (input: { name: string; icon: string; balance: number }) => void
  updateAccount: (id: number, patch: Partial<{ name: string; icon: string; balance: number }>) => void
  deleteAccount: (id: number) => void
  /* 会员订阅 */
  addSubscription: (input: NewSubscriptionInput) => void
  updateSubscription: (id: number, patch: Partial<NewSubscriptionInput>) => void
  deleteSubscription: (id: number) => void
  /* 分类（内置不可删；删除前须把记录迁移走） */
  addCategory: (input: { name: string; emoji: string; color: string }) => void
  updateCategory: (id: string, patch: Partial<{ name: string; emoji: string; color: string }>) => void
  deleteCategory: (id: string) => void
  migrateCategory: (fromId: string, toId: string) => void // 把某分类下的记录全部改挂到另一分类
  /* 消费原则 */
  addPrinciple: (text: string) => void
  updatePrinciple: (index: number, text: string) => void
  deletePrinciple: (index: number) => void
  /* 月度对账历史（P2 用） */
  upsertMonthlyRecord: (rec: MonthlyRecord) => void
  /* 数据管理（文档 5.4） */
  importAll: (data: Omit<AppState, 'meta'>) => void // 导入备份：整体替换，保留 meta
  clearRecords: (range?: { start: string; end: string }) => void // 清空流水：全部或按日期范围
}

export type Store = AppState & StoreActions

/** 首次同时填完收入+预算时自动记录 registerDate（文档 5.1） */
function withRegisterDate(settings: Settings): Settings {
  if (!settings.registerDate && settings.income > 0 && settings.budget > 0) {
    return { ...settings, registerDate: todayStr() }
  }
  return settings
}

const initialState: AppState = {
  meta: { version: 2 },
  settings: DEFAULT_SETTINGS,
  accounts: [],
  records: [],
  subscriptions: [],
  categories: BUILTIN_CATEGORIES, // 首次启动播种；persist 有存档后会被存档覆盖
  principles: [],
  monthlyHistory: [],
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,

      /* ── 设置 ── */
      setIncome: (income) =>
        set((s) => ({ settings: withRegisterDate({ ...s.settings, income }) })),
      setBudget: (budget) =>
        set((s) => ({ settings: withRegisterDate({ ...s.settings, budget }) })),
      setOpeningBalance: (openingBalance) =>
        set((s) => ({ settings: { ...s.settings, openingBalance } })),
      setReminderDays: (days) =>
        set((s) => ({ settings: { ...s.settings, reminderDays: Math.min(30, Math.max(1, Math.round(days))) } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setNotifyEnabled: (notifyEnabled) =>
        set((s) => ({ settings: { ...s.settings, notifyEnabled } })),

      /* ── 消费记录 ── */
      addRecord: (input) =>
        set((s) => ({
          records: [
            {
              id: Date.now(),
              amount: input.amount,
              name: input.name,
              categoryId: input.categoryId,
              mood: input.mood,
              tag: input.tag ?? 'worth',
              date: input.date,
              reminderDays: s.settings.reminderDays, // 创建时快照（文档 5.2）
              reminded: false,
              used: null,
              createdAt: Date.now(),
            },
            ...s.records,
          ],
        })),
      deleteRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
      reviewRecord: (id, used) =>
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, reminded: true, used } : r)),
        })),

      /* ── 账户 ── */
      addAccount: (input) =>
        set((s) => ({ accounts: [...s.accounts, { ...input, id: Date.now() }] })),
      updateAccount: (id, patch) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      deleteAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      /* ── 会员订阅 ── */
      addSubscription: (input) =>
        set((s) => ({ subscriptions: [...s.subscriptions, { ...input, id: Date.now() }] })),
      updateSubscription: (id, patch) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...patch } : sub)),
        })),
      deleteSubscription: (id) =>
        set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub.id !== id) })),

      /* ── 分类 ── */
      addCategory: (input) =>
        set((s) => ({
          categories: [...s.categories, { ...input, id: `custom_${Date.now()}`, builtin: false }],
        })),
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteCategory: (id) =>
        set((s) => ({
          // 内置 6 类不可删（文档 5.2）
          categories: s.categories.find((c) => c.id === id)?.builtin
            ? s.categories
            : s.categories.filter((c) => c.id !== id),
        })),
      migrateCategory: (fromId, toId) =>
        set((s) => ({
          records: s.records.map((r) => (r.categoryId === fromId ? { ...r, categoryId: toId } : r)),
        })),

      /* ── 消费原则 ── */
      addPrinciple: (text) => set((s) => ({ principles: [...s.principles, text] })),
      updatePrinciple: (index, text) =>
        set((s) => ({ principles: s.principles.map((p, i) => (i === index ? text : p)) })),
      deletePrinciple: (index) =>
        set((s) => ({ principles: s.principles.filter((_, i) => i !== index) })),

      /* ── 月度对账历史 ── */
      upsertMonthlyRecord: (rec) =>
        set((s) => {
          const idx = s.monthlyHistory.findIndex((h) => h.month === rec.month)
          const monthlyHistory =
            idx >= 0
              ? s.monthlyHistory.map((h, i) => (i === idx ? rec : h))
              : [...s.monthlyHistory, rec]
          return { monthlyHistory }
        }),

      /* ── 数据管理 ── */
      importAll: (data) =>
        set(() => ({
          settings: data.settings,
          accounts: data.accounts,
          records: data.records,
          subscriptions: data.subscriptions,
          categories: data.categories,
          principles: data.principles,
          monthlyHistory: data.monthlyHistory,
        })),
      clearRecords: (range) =>
        set((s) => ({
          records: range
            ? s.records.filter((r) => r.date < range.start || r.date > range.end)
            : [],
        })),
    }),
    {
      name: 'coinjudge_v2', // 单 key（文档 5.3）
      version: 2,
      // 只持久化数据字段，函数不进 localStorage
      partialize: (s) => ({
        meta: s.meta,
        settings: s.settings,
        accounts: s.accounts,
        records: s.records,
        subscriptions: s.subscriptions,
        categories: s.categories,
        principles: s.principles,
        monthlyHistory: s.monthlyHistory,
      }),
    },
  ),
)
