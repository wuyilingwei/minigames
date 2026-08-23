# v7 对抗性审计补充记录

- 2026-08-23：静态读取现有 `games/cassandri-legend/index.html`（1943 行）与下载 v7.0（2250 行），对比函数、状态、localStorage key、DOM 文案和差异 hunks；未执行参考 HTML。
- 2026-08-23：确认装备 schema 从现有 `item.trait` 单对象变为 v7 `item.traits[]` 数组；确认 v7 删除 `getNextEnemyForecast` 并可能回退任务 017 的下一敌人推荐。
- 2026-08-23：确认 v7 的 `restoreRunSnapshot` 对新增 `equipLostConfirm`/`bossKnockoff` 仍统一调用 `battleLoop()`，存在跳过确认或重复结算风险；结论已写入矩阵。
- 2026-08-23：按主 agent 要求不修改共享 findings/progress/task_plan；本补充记录与矩阵为本分支唯一审计产出。
