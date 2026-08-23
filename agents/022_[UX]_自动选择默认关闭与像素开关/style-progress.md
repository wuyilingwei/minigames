# CSS 子任务操作记录

- 2026-08-23：读取并遵循 `agent-mode` 技能，确认测试隔离目录为仓库根 `/test`；未修改任务主记录中的 `tasks.md`、`task_plan.md`、`findings.md`、`progress.md`。
- 2026-08-23：检查 `games/cassandri-legend/index.html`，确认普通 `.toggle` 复选框与自动选择控件共用旧方形样式。
- 2026-08-23：新增 `.loot-auto-toggle input[type="checkbox"]` 像素滑动开关，覆盖轨道、方块滑块、checked 位移、hover/focus/active 与减少动画行为；普通设置复选框保持原样，设置页可复用 `loot-auto-toggle` 类。
- 2026-08-23：新增 `.loot-choice.auto-select-target` 单次 `autoSelectTargetPulse` 推荐边框闪烁，末帧保留强调；`.reduce-motion` 与系统减少动画偏好下禁用动画并保留静态强调。
- 2026-08-23：扩展 `test/checkbox-animation.test.mjs` CSS 契约，覆盖像素滑块、checked 位移、交互态、推荐目标动画与减少动画静态强调。
- 2026-08-23：按设置页新增自动战斗开关需求，将共享滑动开关选择器从 `.loot-auto-toggle` 泛化为 `.pixel-switch`，同步覆盖减少动画规则与 CSS 契约；未修改 HTML/JS。
