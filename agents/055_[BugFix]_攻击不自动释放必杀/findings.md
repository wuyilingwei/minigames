# Findings

- [问题现象] -> `doAttackRound()` 在手动模式下会以 `player.energy>=100` 调用 `burstAttack()`，自动模式也会接受 `autoBattleDecide()` 返回的 `burst` -> 普通攻击和自动战斗都可能绕过玩家选择直接释放必杀。
- [结论] -> 删除自动战斗的 `burst` 决策，并让 `doAttackRound()` 除防御决策外始终执行 `playerAttack()`；`battleLoop()` 中能量满后的“必杀技”按钮保持为唯一入口。
