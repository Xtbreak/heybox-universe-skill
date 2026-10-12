# heybox-universe skill 展示页

介绍「小黑盒 · 三世界宇宙旅程」Claude Code skill 的静态网站，由 GitHub Pages 从本仓库 `main` 分支的 `docs/` 发布。

- 在线页面：https://xtbreak.github.io/heybox-universe-skill/
- 宇宙旅程演示：https://xtbreak.github.io/heybox-universe/

## 本地预览

不需要安装依赖或构建。在仓库根目录运行：

```sh
python3 -m http.server 8031 --bind 127.0.0.1 --directory docs
```

打开 http://127.0.0.1:8031/。

`tools/qa.mjs` 是本地截图检查脚本，依赖本仓库的 `scripts/cdp.mjs`，不参与页面运行。
