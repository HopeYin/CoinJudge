/**
 * 深色数字键盘（沿用旧版 Numpad.vue：4×4 布局，深蓝灰底，保存键主题蓝）
 * 键盘在任何主题下都保持深色——这是旧版的标志性手感。
 * 按键事件往上抛：keypress / save / saveMore
 */
import { IconBackspace } from './icons'

type Key = string

const ROWS: Key[][] = [
  ['7', '8', '9', '⌫'],
  ['4', '5', '6', '.'],
  ['1', '2', '3', '00'],
  ['再记', '0', '.', '保存'],
]

interface Props {
  onKeypress: (key: string) => void
  onSave: () => void
  onSaveMore: () => void
}

export default function Numpad({ onKeypress, onSave, onSaveMore }: Props) {
  const onKey = (key: Key) => {
    if (key === '保存') onSave()
    else if (key === '再记') onSaveMore()
    else onKeypress(key)
  }

  const keyClass = (key: Key): string => {
    const baseCls =
      'flex-1 h-[52px] rounded-m text-xl text-white flex items-center justify-center transition-transform active:scale-95'
    if (key === '保存') return `${baseCls} bg-primary !text-on-primary text-[15px] font-semibold`
    if (key === '再记' || key === '⌫') return `${baseCls} bg-numpad-key-hi !text-numpad-dim text-[13px]`
    return `${baseCls} bg-numpad-key`
  }

  return (
    <div className="bg-numpad-bg rounded-l p-2.5 flex flex-col gap-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-2">
          {row.map((key) => (
            <button key={key} type="button" className={keyClass(key)} onClick={() => onKey(key)}>
              {key === '⌫' ? <IconBackspace width={20} height={20} /> : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
