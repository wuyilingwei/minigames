# 调研与结论

- 现有 `unitKind` 仅区分 `caster`、`guardian`、`hero` 三类友军；`setCombatantSprite` 已按 ally/enemy 分流，敌人使用名称种子头像。
- `pixelSpriteMarkup` 已使用 16x16 viewBox 和 `role="img"`，需扩展职业语义而不改变敌人渲染。
- 多友军由 `rosterUnits`/`renderBattleRoster` 支持，友军卡片会将单位传给 `setCombatantSprite`，因此职业判断应只依赖单位 `kind/type/job/name` 文本。
- 测试当前只验证旧的 guardian/caster 颜色，需改为执行函数输出并断言四职业均有独立结构特征。

- 四职业分别使用战士头盔+大剑、天使光环+双翼+法杖、勇者披风+盾剑、隐士兜帽+法杖/挎包，输出均为 `viewBox="0 0 16 16"`。
- `unitKind` 仅在 `side === "ally"` 分支新增职业识别；敌人分支及名称种子头像未改动。
- 分类文本合并 `kind/type/job/name` 后再匹配，避免通用 `kind` 遮蔽单位职业或名称；未知友军仍回退勇者。
- 专项测试通过：6 tests / 6 pass。
