# game.wuyilingwei.com 项目索引

> 最后更新：2026-08-23

## 项目目标

以一个统一的纯静态门户提供小游戏与互动资源；首批收录《十光年的距离》和《卡桑德里传说》。一次构建产出可直接部署到 `game.wuyilingwei.com` 的 `dist/` 目录。

## 技术栈

- Node.js 内置脚本：清理、复制、校验及构建静态发布物
- HTML / CSS / JavaScript：门户页与每个游戏自身的独立运行时
- 无业务服务端、无运行时依赖：通过 Cloudflare Workers Static Assets 提供统一静态发布

## 模块结构

```text
apps/portal/             门户页源文件与游戏目录清单
games/                   原样纳入、可独立运行的小游戏源文件
scripts/build.mjs        将门户与游戏汇总至 dist/
test/                    构建产物的隔离验证
agents/                  项目审计与任务记录
```

## 架构原则

- 每个游戏保留自己的入口与相对资源路径，避免彼此的样式、脚本和本地存档冲突。
- 门户只负责发现、分类和跳转；发布时各游戏位于 `/games/<slug>/`。
- 新资源通过清单加入，构建脚本统一复制并校验入口文件。
- Cloudflare 发布使用 Wrangler Workers Static Assets；`wrangler.jsonc` 的 `assets.directory` 指向构建后的 `dist/`，不再使用 Pages 配置。
- 《卡桑德里传说》的完整档案由永久成长、自动档和三个手动槽组成；迁移文件必须带可识别格式版本，并在覆盖本地数据前完成兼容校验。
