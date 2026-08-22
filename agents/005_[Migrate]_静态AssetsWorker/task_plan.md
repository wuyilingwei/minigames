# 005 [Migrate] 静态 Assets Worker 计划

- [x] 核对 Cloudflare 当前静态站建议、Workers Static Assets 配置与最新 Wrangler 架构。
- [x] 把 Wrangler 配置由 Pages 直传切换为纯静态 Assets Worker，并保留可重复的发布命令。
- [x] 在不改动现有 Pages 服务和 DNS 的前提下执行 Workers 预检（仅 dry-run，不执行生产部署）。
- [x] 验证 Worker 的公开地址、门户和两项游戏资源，记录后续域名切换条件。
