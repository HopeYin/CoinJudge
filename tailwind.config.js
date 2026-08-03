/** @type {import('tailwindcss').Config} */
// Tailwind 只负责"映射"，所有色值都来自 index.css 里的 CSS 变量（文档第 9.1 节：全站禁止硬编码色值）
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // 深色模式用 .dark class 策略（文档第 3 节）
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-bg': 'var(--color-primary-bg)',
        success: 'var(--color-success)',
        'success-bg': 'var(--color-success-bg)',
        warning: 'var(--color-warning)',
        'warning-bg': 'var(--color-warning-bg)',
        danger: 'var(--color-danger)',
        'danger-bg': 'var(--color-danger-bg)',
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        'text-1': 'var(--color-text-1)',
        'text-2': 'var(--color-text-2)',
        'text-3': 'var(--color-text-3)',
        'numpad-bg': 'var(--color-numpad-bg)',
        'numpad-key': 'var(--color-numpad-key)',
        'numpad-key-hi': 'var(--color-numpad-key-hi)',
        'numpad-dim': 'var(--color-numpad-dim)',
        'on-primary': 'var(--color-on-primary)',
        'hint-bg': 'var(--color-hint-bg)',
        'hint-border': 'var(--color-hint-border)',
        overlay: 'var(--color-overlay)',
      },
      borderRadius: {
        s: 'var(--radius-s)',
        m: 'var(--radius-m)',
        l: 'var(--radius-l)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        nav: 'var(--shadow-nav)',
        float: 'var(--shadow-float)',
        'blue-card': 'var(--shadow-blue-card)',
      },
    },
  },
  plugins: [],
}
