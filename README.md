# Game Archive

一个纯静态游戏与互动资源门户。构建后，`dist/` 可以直接部署到任意静态托管服务。

## 开发

```bash
npm run build
npm run test
```

发布入口为 `dist/index.html`；每个独立资源发布至 `dist/games/<slug>/`。新增资源时，把可发布的静态文件放入 `games/<slug>/`，并在 `apps/portal/games.json` 添加一项。
