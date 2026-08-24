# Progress

- 2026-08-24：检查 `playerAttack()`、`burstAttack()`、`autoBattleDecide()`、`doAttackRound()` 与 `battleLoop()`，确认普通攻击和自动战斗都会在满能量时改为调用必杀。
- 2026-08-24：计划以隔离 VM 测试执行满能量的手动与自动攻击回合，验证两种情形调用普通攻击且不调用必杀，显式按钮仍保留。
- 2026-08-24：移除 `autoBattleDecide()` 的满能量必杀决策；`doAttackRound()` 在自动模式仅按防御决策分支，其他情况统一执行 `playerAttack()`。
- 2026-08-24：新增 `test/legend-manual-burst.test.mjs`，隔离执行满能量的手动与自动攻击回合；两者均调用普通攻击而不调用必杀，同时断言显式“必杀技”操作仍存在。
- 2026-08-24：`node test/legend-manual-burst.test.mjs` 与 `git diff --check` 通过。
- 2026-08-24：`npm run check` 通过：构建产出 2 个入口、26 个静态文件，完整回归集及新增满能量攻击测试均通过。
- 2026-08-24：复核暂存区仅包含本任务的两处战斗逻辑、独立回归测试、测试入口与 055 审计文件；小偷偷窃及任务索引改动保持未暂存。
