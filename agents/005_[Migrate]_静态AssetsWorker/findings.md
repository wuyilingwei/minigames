# 调研记录

- [平台方向] -> Cloudflare 当前 Workers Best Practices（2026-08-20） -> Workers Static Assets 是新静态站、SPA 与全栈应用的推荐部署方式；Pages 仍可运行，但新功能与优化集中于 Workers。
- [配置模型] -> 对照最新 Wrangler 4.125.0 配置 schema -> 纯静态站只需 `name`、最新 `compatibility_date` 与 `assets.directory`，不需要用户 Worker 脚本；本站使用 `404-page`，避免把未知路径错误重写为门户首页。
- [迁移安全] -> 当前 Pages 生产服务仍存在，且 `game.wuyilingwei.com` 指向外部 A 记录 -> 在 Worker 完整验收前保留 Pages 与 DNS，不执行删除或域名覆盖。

