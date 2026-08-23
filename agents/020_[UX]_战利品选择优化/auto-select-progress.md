# 自动选择装备进度

- 调研：战利品逻辑集中在 `games/cassandri-legend/index.html`；`getEquipmentComparisons(item)[0].score` 是现有推荐算法的槽位评分，满槽时 `equipToSlot` 会进入 `renderReplacementChoices`。
- 设计：增加仅存于当前弹窗 DOM 的默认关闭复选框；勾选后按秒更新 3 秒倒计时，到期调用现有 `chooseLoot`，因此满槽仍经过已有替换确认流程。
- 边界：使用统一取消函数和计时 token，覆盖手动选择、暂时收起、放弃、确认/反悔、重新渲染、下一次掉落及隐藏弹窗，避免旧计时器跨状态触发。
- 完成代码：`preferences.autoLootSelect` 持久化且默认 false；战利品弹窗复选框显示 3 秒倒计时；计时 token 在手动/收起/放弃/替换/结算/重渲染/隐藏弹窗时取消。
- 完成隔离测试：新增 `test/loot-auto-select.test.mjs` 并接入 `npm test`。
- 完成验证：`node --check` 内联脚本通过；`npm run check` 通过（构建、3 项既有测试、自动选择契约测试均通过）。
- 补充边界：打开设置、商城、存档、难度或套装面板也会取消当前倒计时；持久偏好只在复选框操作时写入，不改变旧偏好数据结构的兼容行为。
- [x] 完成代码与隔离测试
- [x] 运行语法检查与 `npm run check`
- [ ] 提交分支并回报哈希
