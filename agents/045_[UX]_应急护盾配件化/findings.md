# 调研记录

- `getEquipmentSlotsFor()` 原第五槽名称为“高难”，但其接受类型已经是 `accessory`/`outerwear`；仅需改用户可见槽名为“配件”，保留双类型兼容。
- `normalizeEquipment()` 统一是旧存档入口。按稳定 id `emergencyShield` 先于旧部位判断，强制迁移名称为“应急护盾”、部位为 `accessory`，因此旧名称与 `outerwear` 都能恢复为新语义。
- 用户可见残留集中在 HUD/日志、推荐无槽提示、难度 6 标签与详情、难度锁定提示、商城购买槽说明；已改为普通“配件”语义。`高难` 的其他正常难度语义未机械处理。
- 旧斗篷等普通 `outerwear` 仍保持附加部位，配件槽仍接受两种部位，确保斗篷可与护甲共存。
