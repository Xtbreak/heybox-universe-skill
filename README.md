# heybox-universe · Claude Code skill

用于复刻并继续开发「小黑盒 · 三世界宇宙旅程」（非官方、非商用课程概念 Demo）的 Claude Code skill。线上 Demo：https://xtbreak.github.io/heybox-universe/

## 安装
```bash
git clone https://github.com/Xtbreak/heybox-universe-skill ~/.claude/skills/heybox-universe
```
安装后，在 Claude Code 里提到「小黑盒 / heybox」时会自动加载；也可以直接说「用 heybox-universe skill」。

## 恢复项目（逐字节复刻 journey-43c）
```bash
bash ~/.claude/skills/heybox-universe/scripts/restore.sh ~/Code/heybox
cd ~/Code/heybox && python3 启动预览.py --port 8017
# 打开 http://127.0.0.1:8017/sample.html?rev=journey-43c
```

## 内容
- `SKILL.md`：入口说明、铁律、当前进度与下一步
- `reference/`：用户偏好、现状规格、版本演进、代码架构、工作流程
- `scripts/`：恢复、打包检查、浏览器回归（22 项）、截图拼图
- `assets/heybox-journey-43c.tar.gz`：项目快照（含 dist/、blender/、文档），校验值见 `assets/SHA256SUMS`

素材授权见快照内的 `dist/credits.html` 与各授权文件。
