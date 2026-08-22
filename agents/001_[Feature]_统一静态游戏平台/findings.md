# 调研记录

- [资源边界] -> 检查 `/Users/user/development/10lightyears/web` -> 该目录是约 8.6 MB 的完整纯静态三维星图，包含 `index.html`、`main.js`、Three.js、数据与音频；可作为独立发布目录直接复制。
- [资源边界] -> 检查 `/Users/user/development/cassandri-legend` -> 该项目是约 2.8 MB 的纯静态单页游戏，入口为根目录 `index.html`，并依赖同目录字体；可作为独立发布目录直接复制。
- [整合策略] -> 不把两套运行时代码打包进门户 -> 保持独立入口和相对路径，可避免全屏、键盘事件、样式与 localStorage 键的跨游戏干扰。
- [仓库初始化] -> 执行常规 `git add` -> 用户全局 Git 忽略规则排除了 `.gitignore`、`/agents` 与 `/test`；此仓库需要版本化这些项目级文件，后续将对这些明确路径使用 `git add -f`。
- [十光年运行时] -> 浏览器加载后在 `main.js:808` 报二进制数组长度错误 -> `web/data/` 中 `stars.bin`、`edges.bin`、`edge_weights.bin` 被来源仓库忽略，未随 Git archive 导入；它们仍是该静态站必需发布物，已从用户提供的本地发布目录显式纳入，并由构建测试保护。
- [发布验收] -> 使用本地静态服务器和浏览器打开 `dist/` -> 门户渲染 2 张卡片，卡桑德里标题与像素字体正常；十光年创建 3 个 Canvas，二进制资源补齐后没有控制台错误。
