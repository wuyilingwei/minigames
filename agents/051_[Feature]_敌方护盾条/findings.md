# 调研记录

- [敌盾只有文字] -> `refreshHpBar()` 仅在敌方 ATK 行追加“盾总值”，HTML 只有敌方生命条 -> 增加与我方对称的敌方护盾条，复用 `shieldTotal()` 与 `shieldSummary()`。
- [敌方还有动态编队卡] -> `createRosterCard()` 会在每次刷新时重建额外单位 -> 同步加入护盾摘要、按最大生命比例的护盾条，并保持零护盾隐藏。
