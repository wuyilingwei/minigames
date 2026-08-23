# Findings

- 当前 `equipmentSlots` 只有 5 个槽，旧 `slot5Unlocked` 同时代表难度/商城第五槽，需要拆成难度附加槽与商城购买槽。
- `applyEquipStats` 负责职业、祝福、装备汇总；职业护符应只乘职业本体效果，不能简单乘最终总数，否则会放大祝福。
- `normalizeEquipmentSlots` 已支持动态 slotCount，但需要扩展 purchase 部位与旧存档迁移。
- 盾牌已有临时盾 `shields.temp` 和 `absorbDamage`，高难应急护盾可用临时盾并添加衰减次数状态。

- 根据主任务澄清，应急护盾属于高难附加装备，不属于购买槽；本分支已移除商城应急护盾，仅保留购买槽职业护符。
- 职业护符只放大职业本体效果（战士吸血/成长、天使增伤/成长、勇者反伤、隐士溢出闪避/成长），未放大 jobData 基础数值或祝福。
