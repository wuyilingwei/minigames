# 调研记录

- [身份与权限] -> `gh auth status` 与 `wrangler whoami` -> GitHub 已登录个人账户，Cloudflare OAuth 令牌包含 Pages 写入权限；个人 Cloudflare 目标账户选用 `My`。
- [项目命名] -> 查询 `wuyilingwei/minigames` -> GitHub 仓库尚不存在，可按用户要求创建为公开仓库。
- [部署方式] -> 用户选择 Wrangler 部署 -> 将创建 Pages 直传项目并以 Wrangler 发布 `dist/`；日后更新可运行 `npm run deploy`，若需自动发布可另配 GitHub Actions。
- [控制台登录] -> Cloudflare 的浏览器会话未登录，且没有可用的 Chrome 会话 -> 已打开 Cloudflare 经 GitHub 登录页面，需用户完成自己的交互式认证后继续；CLI OAuth 会话不能替代浏览器的 Git 集成授权。
- [首次发布] -> 使用 Cloudflare 个人 `My` 账户创建 Pages 项目并上传 `dist/` -> 18 个文件发布到生产环境；主页、卡桑德里入口和十光年星图二进制资源均取得 HTTP 200。
- [自定义域名] -> 查询 `game.wuyilingwei.com` 的 DNS -> 发现已有 A 记录指向 `82.165.213.180`，且 HTTPS 主机名不匹配；为避免中断现有服务，未擅自改写该记录或绑定新 Pages 项目，等待用户确认。
