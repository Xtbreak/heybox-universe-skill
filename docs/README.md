# heybox-universe skill 落地页

介绍「小黑盒 · 三世界宇宙旅程」Claude Code skill 的静态网站。

- 在线页面：https://xtbreak.github.io/heybox-skill-site/
- Skill 仓库：https://github.com/Xtbreak/heybox-universe-skill
- 宇宙旅程演示：https://xtbreak.github.io/heybox-universe/

## 本地预览

无需安装依赖或构建。在项目目录运行：

```sh
python3 -m http.server 8031 --bind 127.0.0.1
```

打开 http://127.0.0.1:8031/。

## 部署

GitHub Pages 从 `main` 分支根目录发布，推送修改后自动更新。

`tools/qa.mjs` 是作者本地截图检查脚本，依赖本机安装的 heybox-universe skill，不参与页面运行或部署。
