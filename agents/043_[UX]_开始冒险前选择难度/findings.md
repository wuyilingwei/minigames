# 调研记录

- 新冒险按钮原先直接隐藏欢迎页并调用 `startGame()`；而 `startGame()` 会在难度 3+ 随机生成职业与祝福禁用，因此必须将难度确认置于该调用之前。
- 现有难度面板同时服务局内查看与调整。新增 `difficultySelectionMode` 区分新冒险确认和普通局内模式：新冒险允许确认未变化难度，局内仍保持原有“未变化不可确认”和锁定规则。
- 取消/Escape 共用 `closeDifficultyPanel()`；新冒险入口不提前隐藏欢迎页，所以关闭后自然回到欢迎页，且不会改变 `gameState`、`bannedJob` 或 `bannedBless`。
- 专项测试曾误将 `startGame()` 定义位置当作调用边界，导致静态断言失败；已改为检查 `openNewGameDifficulty()` 函数体不含开局调用，记录该测试边界以避免重复误判。
