# CoinJudge · 硬币判官

> 记一笔，判一笔。
> 一个帮你记账、复盘消费值不值、管住冲动消费的个人记账 PWA。

## 这是什么

- 🏦 **金库**：总资产卡 / 预算卡 / 存钱卡三张"银行卡"，一眼看清钱的状况
- 💸 **流水**：3 秒记一笔——金额、分类、情绪（冲动😡/需要✅/奖励🎁）、审判（值/不值）
- ⚖️ **原则**：写下自己的消费原则，买后 N 天系统提醒你回顾"买的东西用到了吗"
- 📊 **统计**：每日消费趋势、分类占比、值得/不值得统计、情绪分布
- 🧾 **月底对账**：录入各账户期末余额，反推"看不见的日常支出"，生成分享卡
- 🌙 深色模式 / 📱 PWA（可添加到手机主屏幕，离线可用）/ 💾 本地存储 + JSON 备份导入导出

## 技术栈

Vite + React + TypeScript + Tailwind CSS + zustand（persist 本地持久化）+ vite-plugin-pwa

## 本地开发

```bash
npm install
npm run dev      # 开发预览
npm run build    # 打包到 dist/
```

## 验证脚本

```bash
node scripts/verify-formulas.mjs  # 22 项公式手算对照
node scripts/verify-store.mjs     # 18 项数据层行为
node scripts/verify-backup.mjs    # 11 项备份/清空
```

## 文档

- 《docs/设计规范.md》：全部视觉规则（色板/字号/圆角/组件/动效），做新页面照它取

数据存在浏览器本地（localStorage），不上传任何服务器；备份走 JSON 文件导出。
