# 测试进度

- 已按修正需求更新 `test/checkbox-animation.test.mjs`：五个设置复选框均须位于 `toggle pixel-switch` 标签，且 `settingsLootAutoSelect` 必须保留。
- 已按修正需求更新 `test/loot-auto-select.test.mjs`：增加设置开关同步、关闭设置后恢复战斗循环，以及最佳 `comparison.score` 必须大于 0 才能自动启动/结算的静态契约。
- 已运行 `node test/checkbox-animation.test.mjs`：失败（退出码 1，预期）；当前生产 HTML 缺少 `id="settingsLootAutoSelect"`。
- 已运行 `node test/loot-auto-select.test.mjs`：失败（退出码 1，预期）；当前生产 HTML 缺少 `id="settingsLootAutoSelect"`。
