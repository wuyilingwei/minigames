# 测试进度

- 已按修正需求更新 `test/checkbox-animation.test.mjs`：五个设置复选框均须位于 `toggle pixel-switch` 标签，且 `settingsLootAutoSelect` 必须保留。
- 已按修正需求更新 `test/loot-auto-select.test.mjs`：增加设置开关同步、关闭设置后恢复战斗循环，以及正收益自动装备、零或负收益自动放弃的契约和分支执行测试。
- 已运行 `node test/checkbox-animation.test.mjs`：失败（退出码 1，预期）；当前生产 HTML 缺少 `id="settingsLootAutoSelect"`。
- 已运行 `node test/loot-auto-select.test.mjs`：失败（退出码 1，预期）；当前生产 HTML 缺少 `id="settingsLootAutoSelect"`。
- 主实现合并后，`node test/checkbox-animation.test.mjs` 与 `node test/loot-auto-select.test.mjs` 均通过。
- 完整 `npm run check` 通过，覆盖构建产物、Worker 配置、7.0 兼容流程、自动模式和像素开关。
