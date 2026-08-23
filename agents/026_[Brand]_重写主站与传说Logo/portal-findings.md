# 主站 Logo 调研记录

- 门户入口为 `apps/portal/index.html`，构建脚本会整体复制 `apps/portal` 至 `dist/`，因此 SVG 放在门户源目录即可随构建发布。
- 当前 header 使用 `.wordmark` 纯文字；采用同一链接内的 SVG 图标与文字，保持低调灰白暗色视觉。
- Logo 约束：SVG 内恰好四个实心小方块，三枚轴对齐，一枚通过 `rotate()` 明显斜放；不改 `games.json` 或传说目录。
- 测试通过：四个 `<rect>`、唯一旋转变换、favicon 与 header 引用均由 `test/portal-logo.test.mjs` 校验。
