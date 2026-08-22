# 操作记录

- 2026-08-22：依据用户提出的静态 Worker 方向，检索 Cloudflare 最新 Workers Static Assets 文档、最佳实践、Workers 类型与 Wrangler schema；开始切换部署配置。
- 2026-08-22：完成 Wrangler 配置迁移：移除 `pages_build_output_dir`，启用 `nodejs_compat`、Workers Static Assets（`./dist`、`404-page`）与 observability；发布脚本改为 `wrangler deploy`，删除 Pages 预览脚本。仅执行 `npm run check` 与 `npx wrangler deploy --dry-run`，未触碰 Cloudflare 账户或 DNS。
