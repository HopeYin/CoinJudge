/**
 * 每日消费趋势折线（手写 SVG，文档第 3 节：禁图表库）
 * - 虚线 = 预算日均基准，按真实数值定位（旧版固定在 y=50，超支时会错位，v2 修正）
 * - 今天的点加大加实，其余点半透明
 */
interface Props {
  values: number[] // 每日金额，index 0 = 当月 1 号
  baseline: number // 日均预算基准（虚线）
  todayIdx: number // 今天对应的 index（-1 表示不在本月）
}

const W = 320
const H = 100
const L = 30
const R = 10

export default function TrendLine({ values, baseline, todayIdx }: Props) {
  const n = values.length
  const maxVal = Math.max(baseline * 2, ...values, 1)
  const x = (i: number) => L + ((W - L - R) * i) / Math.max(n - 1, 1)
  const y = (v: number) => 8 + (1 - v / maxVal) * (H - 16)
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }))
  const baseY = y(baseline)
  const showLabel = (i: number) => i === 0 || i === n - 1 || (i + 1) % 5 === 0

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
      {/* 日均基准虚线 */}
      <line
        x1={L}
        y1={baseY}
        x2={W - R}
        y2={baseY}
        stroke="var(--color-text-3)"
        strokeOpacity={0.45}
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={2} y={baseY + 3} fill="var(--color-text-3)" fontSize={8} fontFamily="sans-serif">
        日均
      </text>
      {/* 折线 */}
      {n > 1 && (
        <polyline
          points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* 数据点（今天加粗） */}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === todayIdx ? 4 : 2}
          fill="var(--color-primary)"
          fillOpacity={i === todayIdx ? 1 : 0.35}
        />
      ))}
      {/* X 轴日期（1 号 / 每 5 天 / 月末） */}
      {pts.map(
        (p, i) =>
          showLabel(i) && (
            <text
              key={`t${i}`}
              x={p.x}
              y={H + 14}
              textAnchor="middle"
              fill="var(--color-text-3)"
              fontSize={7}
              fontFamily="sans-serif"
            >
              {i + 1}
            </text>
          ),
      )}
    </svg>
  )
}
