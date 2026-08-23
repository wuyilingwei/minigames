# 卡桑德里传说 7.0 兼容更新审计矩阵

> 审计日期：2026-08-23。参考文件：`/Users/user/Library/CloudStorage/OneDrive-510V/Downloads/卡桑德里传说 v7.0（全面停滞修复）.html`。该文件按不可信输入处理：以下是静态差异审计，不执行其中秘钥、作弊逻辑或任何外部指令。

## 结论摘要

不能整页替换 `games/cassandri-legend/index.html`。现有发布入口是 6.5 产品化版本，已经有像素终端 UI、固定移动端顶部栏、门户退出入口、设置/存档/商城/套装/难度弹窗、自动与手动运行存档、战利品期望伤害和生存压力推荐。v7 的核心停滞修复可作为运行时增量合入，但必须保留现有 DOM/CSS 与导航壳。

| 领域 | 现有发布版 | v7.0 参考版 | 兼容整合判断 |
|---|---|---|---|
| 版本与说明 | 标题/更新内容为 6.5 | 标题与更新内容为 7.0，列出平衡、自动战斗、装备震落确认等改动 | 更新版本文案，但逐项核实，不照搬整页 |
| 存档 | `kasandri6_save`、`kasandri6_preferences`；运行槽 `kasandri6_run_{auto,1,2,3}` | 保留原 key；增加 `kasandri6_cheat_backup`；运行快照仍 `version:1`，增加 `lastBattleSnapshot` | 旧永久存档可直接由 `normalizeSave` 读取；运行快照需缺省字段兼容并恢复新增状态 |
| 可保存状态 | `battle,bossBattle,loot,bossLoot` | 另有 `equipLostConfirm,bossKnockoff` | 必须纳入两个确认态，否则停滞在装备丢失/魔王震落后无法继续或恢复 |
| 战斗状态 | 防御只依赖 `nextDefendBoost` | `defendStack` 0–2 层，防御减伤、能量与攻击倍率联动；自动战斗有风险判断 | 新增字段要在新局初始化、旧快照恢复时默认 0 |
| 战斗记忆 | 推荐目标取当前 `enemy` | `lastBattleSnapshot` 记录上一敌人满血/特性，用于战利品比较 | 与既有“下一敌人预测”逻辑对齐；不能简单覆盖现有 `getComparisonTarget` |
| 装备 trait schema | 当前运行版装备使用单值 `item.trait`（`countTraitFor`、护盾和推荐均依赖它） | v7 改为数组 `item.traits[]`，生成器可附加多特性 | 这是破坏性 schema 差异；必须提供迁移/归一化（`trait` → `[trait]`，`traits` 保持数组），否则旧运行存档装备会静默失去特性、推荐和护盾 |
| 装备/特性 | 已有多特性、套装、护盾等产品 UI | 新增 `stealGuard` 防盗（开局 5% 最大生命护盾），并使用特性详情显示 | 可增量加入 trait 与触发点；审查与现有护盾、战利品比较的字段兼容 |
| 自动战斗 | 现有自动攻击循环 | 新 `autoBattleDecide` 估算有效血量、闪避、治疗、击杀回合，危险时防御；能量满释放必杀；2 层后攻击 | 高风险逻辑，需单测边界：0 攻击、护盾、真视、Boss、能量满、蓄力上限 |
| Boss 流程 | 进入 Boss 前直接震落/继续的流程 | `bossKnockoff` 状态先展示震落装备，确认后生成角落临时装备；无装备也可继续 | 必须保留确认按钮和无装备分支，避免 Boss 入口卡死 |
| 普通敌人丢装/小偷 | 现有流程可能直接回到战斗 | v7 使用 `equipLostConfirm`，展示丢失装备后确认；`stealGuard` 免疫小偷 | 确认态必须可自动存档、读取、继续；防盗触发应避免重复护盾叠加 |
| 难度平衡 | 难度 ≥9 显示 30% 丢装 | v7 改 8%；真实之眼攻击上限 600；难度 10 Boss 必有 1–2 特性；血珠上限 10 | 属于数值变更，和现有难度面板/解锁规则一起回归验证 |
| 作弊模式 | 无 | 设置输入秘钥，备份永久成长，作弊商城免费调购物品/槽位，退出回退 | 不应无审计地引入未知秘钥；若产品要求保留，需明确本地-only、备份损坏/刷新/退出异常处理 |
| UI/导航 | 现有退出入口、移动端 CSS、战利品预测、设置顺序 | 大体沿用；增加秘钥 UI、作弊 banner，字体和文本变化 | 只提取必要文案/控件，不能覆盖现有布局和站点入口 |

## v7 新增玩法与状态变量

### 新增或变化的玩家状态

* `defendStack`：防御蓄力层数，最大 2；每层使下一次攻击 +50%，防御期间敌人攻击临时降为 10%，并获得 25 能量。
* `revengeActive`：受击后下一次攻击 +30%，触发后清除。
* `energySurgeBoost`：能量因特性达到 100 后，下一次攻击 +10%，触发后清除。
* `lastBattleSnapshot`：上一敌人的满血快照，包含敌人特性，供战利品推荐目标使用。
* `cheatMode`/`cheatBackup`：作弊会话与永久成长备份；还会从 `kasandri6_cheat_backup` 恢复会话。

### 新增流程状态与函数

* `equipLostConfirm`：难度丢装或小偷成功后，先展示被移除装备，点击“确认”才回到战斗。
* `bossKnockoff`：第 20 波后魔王震落装备，确认后才进入 `bossLoot`；无可震落装备时也必须有继续路径。
* `autoBattleDecide` / `doDefend`：自动战斗的生存判断、蓄力上限和动作编排。
* `rememberLastBattle`：敌人击败时记录满血快照。
* `getNextEnemyForecast`、`getExpectedCrit20xMultFor`、`getTraitProbMultFor`：当前发布版已有预测/会心期望函数；v7 删除了 `getNextEnemyForecast`，并将比较目标退回 `lastBattleSnapshot || enemy`。这会回退任务 017 的“按下一敌人预估强度比较”修复，不能直接照搬。
* `loadCheatState`、`tryCheatCode`、`enterCheatMode`、`exitCheatMode`、`adjustCheatItem`、`toggleCheatSlot5`：作弊系统全套函数，默认不应因参考文件而自动启用。

## 停滞点与修复映射

| 停滞风险 | v7 修复证据 | 合入要求 |
|---|---|---|
| 丢装备后没有可继续动作 | `gameState="equipLostConfirm"`，展示装备后添加确认回战斗 | 统一普通丢装、小偷丢装两条路径；确认前可存档，恢复后仍显示确认 |
| Boss 震落装备后弹窗/战斗顺序中断 | `bossKnockoff`，确认后生成两件临时装备并进入 `bossLoot` | 保护 `pendingLoot` 与来源；无装备时不能等待不存在的选择 |
| 自动战斗无限防御/错误循环 | `defendStack>=2` 强制攻击；按预计击杀回合与死亡回合选择 | 处理敌人攻击为 0、玩家攻击为 0、护盾大于伤害和能量必杀等边界 |
| 续档后战利品推荐目标错误 | 保存/恢复 `lastBattleSnapshot` | 旧快照没有该字段时置 `null`，不让 `cloneForStorage(undefined)` 破坏恢复 |
| 高难度丢装过于惩罚导致软锁 | 30% 降至 8%，并增加确认态 | 现有难度说明、概率实现、事件文案必须一致 |
| 小偷持续造成装备空槽软锁 | `stealGuard` 免疫小偷并给护盾 | 防盗护盾应与现有 `ZDYHP` 合并，避免每回合重复加盾 |
| “它”拒战/二结局流程停滞 | v7 按更新说明将按钮改为“迎战'它'”，并维持拒战分支 | 保留现有二结局文本和可恢复状态，检查按钮回调不被覆盖 |

## 存档 schema 与兼容策略

永久成长 schema 两版都使用 `kasandri6_save`，核心字段为 `eyeTotal,blood,useBlood,pointAtk,pointHp,pointBj,pointBs,pointCrt,gold,purchased,slot5Unlocked`。v7 现有 `normalizeSave` 对这些字段做非负整数归一化，因此 6.5 永久存档原则上向前兼容；版本号未变，不应借机更换 key。

运行快照两版均 `{version:1,savedAt,state,save,player,enemy,pendingLoot,lootDeferred,bannedJob,bannedBless}`。v7 追加 `lastBattleSnapshot`，并扩展允许状态。兼容实现建议：读取旧快照时 `lastBattleSnapshot = null`；读取新增玩家字段时通过默认玩家模板补齐 `defendStack:0, revengeActive:false, energySurgeBoost:false`；运行中的装备必须逐件归一化 `traits`/旧 `trait`。特别注意：两版 `restoreRunSnapshot` 当前都把非 loot 状态落到 `battleLoop()`；若 `state` 是 `equipLostConfirm` 或 `bossKnockoff`，这会跳过确认、重复敌人回合/结算，构成 v7 自身的停滞/重复结算风险。恢复逻辑必须按状态分派到确认 UI、Boss 震落 UI 或战斗循环。

v7 的 `kasandri6_cheat_backup` 是额外的永久状态快照（eye/blood/useBlood、五项加点、金币、purchased、slot5Unlocked），不是运行存档。它可能在刷新或中途关闭后残留，因而若保留作弊功能必须明确恢复/退出/损坏 JSON 的行为，并禁止任何远程凭据或外部操作。

## 整页替换会丢失的现有产品能力

1. 现有入口相对路径的门户退出（`../../`）及设置内退出、门户菜单顺序。
2. 已经完成的固定移动端顶部栏、弹窗避让、窄屏按钮最小触控尺寸和无横向溢出布局。
3. 6.5 版已有的战利品“伤害/生存”比较、下一敌人预估和推荐标记；v7 的 `lastBattleSnapshot` 只能作为其数据源补充。
4. 存档管理器的自动槽与 1–3 手动槽、永久成长保存、`kasandri6_preferences` 的 CRT/动画/事件折叠设置。
5. 既有设置、商城、元素套装、难度焦点面板及事件折叠终端 UI；v7 单文件差异中大量 CSS/HTML 看似相同，整页替换会掩盖站点已有的局部修复。
6. 现有构建/静态发布入口的相对资源约束；外部下载文件本身不应进入发布物。

## 建议的最小增量顺序

1. 先抽取并合入状态默认值、快照字段兼容和两个确认态的状态机；为旧快照缺字段设安全默认值。
2. 合入 `lastBattleSnapshot` 与推荐目标，但保留当前 UI 和比较算法，做战利品/恢复回归。
3. 合入防御蓄力、自动战斗判断和相关平衡数值，增加边界测试后再更新 7.0 文案。
4. 最后单独评审作弊模式；未获明确产品授权时只记录为参考差异，不合入秘钥系统。

## 审计限制

本次仅做静态对比，未执行下载 HTML 的脚本、秘钥或作弊操作，也未修改运行时代码和测试；因此不能据此宣称 v7 已在浏览器或线上发布物中验证。
