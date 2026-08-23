# game.wuyilingwei.com 任务追踪

> 准则版本: v0.2.2

## 任务列表

| 编号 | 任务名称 | 任务描述 | 变更动机 | 状态 |
| :--: | :------: | :------: | :------: | :--: |
| 001 | [Feature] 统一静态游戏平台 | 建立 monorepo、纳入首批互动资源并产出统一静态站 | 为 game.wuyilingwei.com 提供可扩展的游戏与资源入口 | ✅ 已完成 |
| 002 | [Feature] 导入十光年 | 将 10lightyears `web/` HEAD 内容纳入 `games/ten-light-years/` | 首批游戏需要保持独立入口与相对资源路径 | ✅ 已完成 |
| 003 | [Import] 导入卡桑德里传说 | 导入可发布入口与运行时字体至 `games/cassandri-legend/` | 纳入首批小游戏资源并保持独立相对路径 | ✅ 已完成 |
| 004 | [Deploy] GitHub 与 Cloudflare Pages | 创建公开代码仓库并以 Wrangler 直传发布初版静态站 | 建立代码发布物并验证 Pages 初版 | ✅ 已完成 |
| 005 | [Migrate] 静态 Assets Worker | 将静态发布从 Pages 迁至 Cloudflare Workers Static Assets | 新项目的推荐静态托管路径，预留统一边缘能力 | ✅ 已完成 |
| 006 | [Feature] 门户收敛与作者退出 | 收敛首页表现、补充作品署名并为游戏加入返回入口 | 让站点更贴合小游戏站定位且保留清晰创作信息 | ✅ 已完成 |
| 007 | [Feature] 双游戏退出入口 | 为两个独立游戏添加固定的返回门户入口 | 让访客可随时安全退出游戏而不依赖浏览器关闭行为 | ✅ 已完成 |
