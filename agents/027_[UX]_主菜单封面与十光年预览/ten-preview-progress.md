# 十光年预览进度

- 在 ten-preview worktree 构建并启动本地静态站点。
- 通过应用内 Browser 进入实际星图并保存截图候选。
- 生成 `games/ten-light-years/assets/preview.png`（1024×1024 PNG）。
- 已在 `index.html` 加入相对路径 `og:image`。
- 已加入根 `/test/ten-light-years-preview.test.mjs`，校验预览资产存在、PNG 签名、1024×1024 尺寸、非空及 build 输出元数据，并接入 `npm test`。
- `npm run build` 通过（24 个静态文件）；完整 `npm test` 通过。
- 使用 `view_image` 检查最终资产：纯实际星图星海、中心轨迹/HUD，画面无加载层、错误提示或浏览器框，菜单位于边缘。
- 待提交当前任务自有路径。
