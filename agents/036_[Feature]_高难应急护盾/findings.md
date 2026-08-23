# 调研与发现

- 当前运行时将高难第五槽与商城购买槽共用 `slot5Unlocked`；本任务需要把高难附加槽和商城购买槽拆成独立槽位。
- 现有护盾由 `player.shields.temp`、`persistent`、`hits` 统一处理；应急护盾应仅使用 `temp`，不能改写次数盾/持续盾逻辑。
- 战斗入口为 `genEnemy()`（普通/Boss 均调用 `prepareBattleShields()`），因此应急触发应放在进战准备阶段。
- 掉落由 `genEquip()` 生成，商城由 `renderShop()` 及购买函数处理；特殊装备应走同一装备对象和推荐模型。
