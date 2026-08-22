# 调研记录

- [身份与权限] -> `gh auth status` 与 `wrangler whoami` -> GitHub 已登录个人账户，Cloudflare OAuth 令牌包含 Pages 写入权限；个人 Cloudflare 目标账户选用 `My`。
- [项目命名] -> 查询 `wuyilingwei/minigames` -> GitHub 仓库尚不存在，可按用户要求创建为公开仓库。
- [部署方式] -> 采用 Cloudflare Pages Git 集成 -> 主分支推送后由 Pages 自动构建；不使用不可迁移至 Git 集成的直传项目。

