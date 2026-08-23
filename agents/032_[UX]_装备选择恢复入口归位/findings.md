# 调研记录

- [现状] `refreshStatPanel()` 在 `pendingLoot` 存在时把“继续选择装备”渲染进右侧 `.hud-actions`。 -> [结论] 这是按钮出现在勇者面板的直接原因。
- [现状] `deferLootChoice()` 隐藏弹窗后只刷新勇者面板，底部 `#choices` 已由 `showLootChoice()` 清空。 -> [结论] 应在暂存后向操作对话区恢复唯一的继续入口。
- [兼容路径] 暂存状态会写入自动/手动存档，`restoreRunSnapshot()` 可恢复 `lootDeferred=true`。 -> [结论] 读档恢复也必须重建同一操作按钮，不能只改点击“暂时收起”的即时路径。
