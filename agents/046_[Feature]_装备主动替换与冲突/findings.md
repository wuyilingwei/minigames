# 调研记录

- 现有 `buildEquipAction` 已统一裁决合法部位及武器冲突：双手武器只能进主手并清空副手；副手/第二把单手武器进副手时会卸下主手双手武器；头部、身体和附加装备仅按物理部位限制。
- 原 `equipToSlot` 在发现空合法槽位时直接写入 `player.slots` 并调用 `confirmEquip`，会替玩家决定放置位置；这违反“手动选择后必须进入合法位置选择”的边界。
- 自动选择使用 `autoEquipRecommendedLoot` 直接应用最佳比较动作，按需求保留；其动作记录 `previousSlots`，手动 `undoEquip` 和存档快照仍可恢复原 slots。
- 专项测试与自动选择回归已通过：`node test/legend-v8-equipment.test.mjs`、`node test/loot-auto-select.test.mjs`。
