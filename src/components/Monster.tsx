/**
 * 像素小怪兽（品牌 IP，docs/设计规范.md 第 5 节）
 * 纯 <rect> 像素画 + crispEdges 硬边；白身黑眼是定死造型，禁止改色改形。
 * 造型参数与 public/icon.svg 完全一致（96×72 身体、20×20 方眼、12×12 手臂、28×16 腿）。
 * variant:
 *  - plain  正常（圆睁方眼）
 *  - happy  眯眼笑（眼睛半高，底部对齐）——用于"全部完成"的空状态
 */
interface Props {
  variant?: 'plain' | 'happy'
  width?: number
  className?: string
}

export default function Monster({ variant = 'plain', width = 96, className }: Props) {
  const eyeH = variant === 'happy' ? 12 : 20
  const eyeY = variant === 'happy' ? 28 : 20 // 底部对齐，眯眼像笑
  return (
    <svg
      viewBox="0 0 136 96"
      width={width}
      height={(width * 96) / 136}
      shape-rendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {/* 身体 */}
      <rect x="20" y="4" width="96" height="72" fill="#FFFFFF" />
      <rect x="20" y="4" width="96" height="8" fill="#F0F4FF" />
      <rect x="108" y="12" width="8" height="64" fill="#DDE4F0" />
      <rect x="20" y="68" width="96" height="8" fill="#DDE4F0" />
      {/* 眼睛 */}
      <rect x="36" y={eyeY} width="20" height={eyeH} fill="#1A1A1A" />
      <rect x="76" y={eyeY} width="20" height={eyeH} fill="#1A1A1A" />
      {/* 手臂 */}
      <rect x="8" y="28" width="12" height="12" fill="#FFFFFF" />
      <rect x="116" y="28" width="12" height="12" fill="#FFFFFF" />
      {/* 腿（顶部 6px 是身体投下的阴影） */}
      <rect x="28" y="76" width="28" height="16" fill="#FFFFFF" />
      <rect x="28" y="76" width="28" height="6" fill="#DDE4F0" />
      <rect x="80" y="76" width="28" height="16" fill="#FFFFFF" />
      <rect x="80" y="76" width="28" height="6" fill="#DDE4F0" />
    </svg>
  )
}
