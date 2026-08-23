# 调研记录

- [显示来源] -> `equipmentRecommendationHtml()` 将内部 `getNextEnemyForecast()` 目标直接拼入 `.trait-note` -> 只需调整渲染字符串；推荐分数仍可继续使用下一敌人强度，不改变玩法平衡。
- [保留信息] -> 同一行还包含套装与装备特性变化 -> 移除预测目标、攻击和生命值文案，保留套装及特性变化。
- [测试失败] -> 首次新增断言误用不存在的 `source` 变量，运行时报 `ReferenceError` -> 该测试文件的 HTML 变量名为 `html`，已改用现有变量。
