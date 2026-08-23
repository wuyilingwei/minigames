# 测试进度

- 已更新 `test/checkbox-animation.test.mjs`：为 CRT、减少动画、事件收起和自动战斗设置项增加 `toggle pixel-switch` 标签契约，并要求 `settingsLootAutoSelect` 不再出现在 HTML。
- 已运行 `node test/checkbox-animation.test.mjs`。
- 结果：失败（预期）。当前生产 HTML 尚未同步：`crtToggle` 仍位于普通 `toggle` 标签中，测试在首个像素开关契约处停止；同时当前 HTML 仍包含 `settingsLootAutoSelect`。
