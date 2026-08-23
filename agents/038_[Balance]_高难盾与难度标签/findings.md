# Findings

- 基线 `93b2d9a` 已包含四次应急盾模型，但值固定为 100/75/50/25；`triggerEmergencyShield`、`emergencyShieldValue`、HUD 推荐与难度说明各自重复该数组。
- 难度面板当前为三段长文本，HTML 没有 `details/summary`；需要改成可折叠且默认关闭的累计规则列表。
- 高难槽当前 ID 为 `accessory`、名称为“附加”；应改名不改 ID，以保留旧存档部位兼容。
- 应急盾实际值统一为 `floor(base * 1.18^difficulty)`，剩余次数仍只由 `emergencyCharges` 表示；难度小于 6 时即使旧档残留装备也不触发。
- 回血档位为 0–2: 100%，3–10: 95/90/85/75/70/65/55/50%，每次先取当前损失生命再按比例向下取整。
- `npm run check`（含新增行为测试）与 `git diff --check` 已通过。
