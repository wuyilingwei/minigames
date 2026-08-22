# 调研记录

- [资源边界] -> 检查 `/Users/user/development/10lightyears/web` -> 该目录是约 8.6 MB 的完整纯静态三维星图，包含 `index.html`、`main.js`、Three.js、数据与音频；可作为独立发布目录直接复制。
- [资源边界] -> 检查 `/Users/user/development/cassandri-legend` -> 该项目是约 2.8 MB 的纯静态单页游戏，入口为根目录 `index.html`，并依赖同目录字体；可作为独立发布目录直接复制。
- [整合策略] -> 不把两套运行时代码打包进门户 -> 保持独立入口和相对路径，可避免全屏、键盘事件、样式与 localStorage 键的跨游戏干扰。
- [仓库初始化] -> 执行常规 `git add` -> 用户全局 Git 忽略规则排除了 `.gitignore`、`/agents` 与 `/test`；此仓库需要版本化这些项目级文件，后续将对这些明确路径使用 `git add -f`。
