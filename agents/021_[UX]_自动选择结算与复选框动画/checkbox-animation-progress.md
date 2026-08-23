# 复选框动画子任务记录

- 2026-08-23：在 `games/cassandri-legend/index.html` 追加统一 `.toggle input[type="checkbox"]` 自绘像素复选框，覆盖勾选、取消、悬停、键盘 `focus-visible` 与按下反馈。
- 2026-08-23：为 `.reduce-motion` 和系统 `prefers-reduced-motion: reduce` 增加无动画回退；未触碰自动选择结算逻辑。
- 2026-08-23：新增 `test/checkbox-animation.test.mjs`，并将其接入 `npm run test` / `npm run check`。
- 2026-08-23：执行 `npm run check` 通过；构建产出 2 个入口与 20 个静态文件，全部测试通过。
