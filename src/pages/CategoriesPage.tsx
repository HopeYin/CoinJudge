/**
 * 分类管理（P3-3，文档 5.2 / P3-3）
 * - 内置 6 类：可改名/改 emoji/改色，不可删
 * - 自定义类：增删改；删除前若该分类下有记录，必须先选"迁移到某分类"
 * RecordModal 分类区直接读 store，改完自动同步
 */
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useStore } from '../store/store'
import type { Category } from '../store/types'
import { useBackClose } from '../lib/useBackClose'

/** 预设色板（取自内置色 + 同温同饱和扩展） */
const COLOR_CHOICES = [
  '#FF9F43', '#5BB8FF', '#A55EEA', '#26DE81', '#FDCE4C', '#A0A4B8',
  '#FF6B6B', '#FF7FA5', '#4ECDC4', '#54A0FF', '#F368E0', '#8395A7',
]

interface Editing {
  id: string | null // null = 新增
  name: string
  emoji: string
  color: string
}

export default function CategoriesPage() {
  const categories = useStore((s) => s.categories)
  const records = useStore((s) => s.records)
  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const migrateCategory = useStore((s) => s.migrateCategory)

  const [editing, setEditing] = useState<Editing | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [migrateTo, setMigrateTo] = useState('')
  useBackClose(editing !== null, () => setEditing(null))
  useBackClose(deleting !== null, () => setDeleting(null))

  const countOf = (id: string) => records.filter((r) => r.categoryId === id).length

  /* ── 新增 / 编辑 ── */
  const openEdit = (c?: Category) =>
    setEditing(c ? { id: c.id, name: c.name, emoji: c.emoji, color: c.color } : { id: null, name: '', emoji: '', color: COLOR_CHOICES[0] })
  const canSave = editing !== null && editing.name.trim() !== '' && editing.emoji.trim() !== ''
  const handleSave = () => {
    if (!editing || !canSave) return
    const patch = { name: editing.name.trim(), emoji: editing.emoji.trim(), color: editing.color }
    if (editing.id) updateCategory(editing.id, patch)
    else addCategory(patch)
    setEditing(null)
  }

  /* ── 删除（带迁移检查）── */
  const openDelete = (c: Category) => {
    setMigrateTo(categories.find((x) => x.id !== c.id)?.id ?? '')
    setDeleting(c)
  }
  const deleteCount = deleting ? countOf(deleting.id) : 0
  const canDelete = deleting !== null && (deleteCount === 0 || migrateTo !== '')
  const handleDelete = () => {
    if (!deleting || !canDelete) return
    if (deleteCount > 0) migrateCategory(deleting.id, migrateTo)
    deleteCategory(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-bg pb-10">
      <PageHeader title="分类管理" back />

      <div className="bg-card rounded-l shadow-card mx-4 mt-2.5 overflow-hidden">
        {categories.map((c) => {
          const n = countOf(c.id)
          return (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ background: c.color + '22' }}
              >
                {c.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-text-1">
                  {c.name}
                  {c.builtin && <span className="text-[10px] text-text-3 ml-1.5">内置</span>}
                </div>
                <div className="text-[11px] text-text-3">{n} 条记录</div>
              </div>
              <button type="button" onClick={() => openEdit(c)} className="pressable text-[13px] text-primary px-2 py-1">
                编辑
              </button>
              {!c.builtin && (
                <button type="button" onClick={() => openDelete(c)} className="pressable text-[13px] text-danger px-2 py-1">
                  删除
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mx-4 mt-4">
        <button
          type="button"
          onClick={() => openEdit()}
          className="pressable w-full py-3 rounded-l bg-card shadow-card text-primary text-[15px] font-semibold"
        >
          ＋ 新增分类
        </button>
        <p className="text-[11px] text-text-3 text-center mt-3">
          内置分类不可删除，但可以改名、换图标、换颜色
        </p>
      </div>

      {/* ── 新增/编辑弹窗 ── */}
      {editing && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[90] flex items-end justify-center"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditing(null)
          }}
        >
          <div
            className="sheet-slide-up w-full bg-card rounded-t-[20px] px-5 pt-6"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="text-center text-lg font-semibold text-text-1 mb-5">
              {editing.id ? '编辑分类' : '新增分类'}
            </div>
            <div className="flex gap-2.5 mb-4">
              <input
                type="text"
                value={editing.emoji}
                onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                placeholder="😀"
                maxLength={4}
                className="w-16 bg-bg rounded-m px-3 py-3 text-xl text-center outline-none"
              />
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="分类名称，如：宠物"
                maxLength={8}
                className="flex-1 bg-bg rounded-m px-4 py-3 text-[15px] text-text-1 outline-none placeholder:text-text-3"
              />
            </div>
            <div className="grid grid-cols-6 gap-2.5 mb-6">
              {COLOR_CHOICES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEditing({ ...editing, color })}
                  className="pressable w-full aspect-square rounded-full"
                  style={{
                    background: color,
                    outline: editing.color === color ? `3px solid ${color}` : 'none',
                    outlineOffset: 2,
                    opacity: editing.color === color ? 1 : 0.55,
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className={`pressable w-full py-3 rounded-m text-sm font-semibold ${
                canSave ? 'bg-primary text-on-primary' : 'bg-bg text-text-3'
              }`}
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* ── 删除确认弹窗（带迁移）── */}
      {deleting && (
        <div
          className="modal-fixed overlay-fade top-0 bottom-0 z-[90] flex items-end justify-center"
          style={{ background: 'var(--color-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleting(null)
          }}
        >
          <div
            className="sheet-slide-up w-full bg-card rounded-t-[20px] px-5 pt-6"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="text-center text-lg font-semibold text-text-1 mb-1">
              删除「{deleting.name}」？
            </div>
            {deleteCount > 0 ? (
              <>
                <p className="text-center text-xs text-text-3 mb-4">
                  这个分类下还有 {deleteCount} 条记录，删除前要给它们找个新家
                </p>
                <div className="text-xs text-text-3 mb-2">迁移到：</div>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {categories
                    .filter((c) => c.id !== deleting.id)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setMigrateTo(c.id)}
                        className={`pressable py-2 rounded-m text-[13px] border-2 ${
                          migrateTo === c.id
                            ? 'border-primary text-primary bg-primary-bg font-semibold'
                            : 'border-border text-text-2'
                        }`}
                      >
                        {c.emoji} {c.name}
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <p className="text-center text-xs text-text-3 mb-5">这个分类下没有记录，可以放心删除</p>
            )}
            <button
              type="button"
              disabled={!canDelete}
              onClick={handleDelete}
              className={`pressable w-full py-3 rounded-m text-sm font-semibold ${
                canDelete ? 'bg-danger text-white' : 'bg-bg text-text-3'
              }`}
            >
              {deleteCount > 0 ? `迁移并删除` : '确认删除'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
