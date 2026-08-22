# 调研记录

- [来源边界] -> `/Users/user/development/10lightyears` HEAD `221864ec000c24c219f6651c4d0e98cb7366587b` -> `git ls-tree` 显示 `web/` 仅包含 `index.html`、`main.js`、`data/`、`audio/`、`icon.svg` 与 `vendor/three.module.js`，符合独立静态发布边界。
- [导入方式] -> `git archive HEAD:web | tar -x -C games/ten-light-years` -> 仅解包来源 HEAD 的 `web/` 内容，未修改来源仓库。
- [路径检查] -> 扫描 HTML/JS 引用 -> 入口、图标、数据、音频和模块脚本均使用 `./` 或相对路径，可挂载于 `/games/ten-light-years/`。
- [静态验证] -> Python `http.server` + `urllib` -> `index.html`、`main.js`、两个 JSON 数据文件和两个 M4A 音频均返回 HTTP 200；绝对根路径引用扫描无结果。
- [格式检查] -> `git diff --cached --check` -> 报告来源 `main.js` 文件尾空行及 vendor Three.js 的空格/Tab；为保持 Git archive 导入内容原样，未对来源文件做格式改写。
