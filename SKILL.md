---
name: heybox-universe
description: 复刻并继续开发「小黑盒 · 三世界宇宙旅程」(heybox-universe) —— Three.js 无构建静态站：igloo.inc 式月面砖块黑盒开场、一滑一段的分段滚动、三个可玩小游戏（纸板横版射击 / 第一人称设施 / 玩具公园驾驶）、展台光环传送门进出游戏、结尾朋友客厅。用于：从快照 100% 恢复项目、在其上继续迭代（journey-44+）、按用户既定偏好改动、做 3D 素材替换、跑回归、部署 GitHub Pages。触发词：小黑盒、heybox、heybox-universe、三个世界、开屏/黑盒/展台/传送门、journey-4x。
---

# 小黑盒 · 三世界宇宙旅程（heybox-universe）

一个**非官方、非商用课程概念 Demo**：滚动驱动的 3D 宇宙旅程，可以进入三个小游戏，最后走进朋友家客厅。当前版本 **journey-43c**（git `a4028a4`）。线上（停在 journey-41）：https://xtbreak.github.io/heybox-universe/

## 一、100% 复刻：从快照恢复（首选）
本 skill 带了项目在 journey-43c 时的**逐字节快照**（git archive，包括 dist/、blender/ 和全部文档，16MB）：
```bash
bash ~/.claude/skills/heybox-universe/scripts/restore.sh <目标目录>
cd <目标目录> && python3 启动预览.py --port 8017
# 打开 http://127.0.0.1:8017/sample.html?rev=journey-43c
```
`restore.sh` 会先验证快照的 SHA-256，解压后再逐个文件按 `文件清单.sha256` 校验，检查 sample.html 和 index.html 是否一致，最后用 git 初始化成首个提交。恢复出来的 `dist/` 和 `blender/` 与原项目做过 `diff -rq`，完全相同。

恢复后跑一遍回归，确认环境正常（需要 Edge 或 Chrome，可以用 `BROWSER=` 指定路径）：
```bash
node --experimental-vm-modules ~/.claude/skills/heybox-universe/scripts/final-check.mjs   # 在项目根目录运行
node ~/.claude/skills/heybox-universe/scripts/regress.mjs http://127.0.0.1:8017/sample.html /tmp/heybox-regress   # 应为 22/22 通过
```

如果本机已经有原项目（带完整 git 历史的 `heybox/` 目录），直接在那里继续开发，不需要恢复。

## 二、开始任何改动前要读的
按需读取，不必一次读完：
- `reference/user-preferences.md` —— **必读**。用户的沟通习惯、审美红线、交互手感要求、走过的误解。
- `reference/spec.md` —— 现状规格：章节表、颜色、开场时间线、滚动参数、镜头航点、传送门参数、游戏、授权、版本号规则。
- `reference/history.md` —— journey-21 到 43c 每一步「用户要什么 → 做成什么 → 为什么」，以及**下一步计划**。
- `reference/architecture.md` —— 模块调用关系、接口、宿主状态机、资源清单、写法约定。
- `reference/workflow.md` —— 每次改动的固定流程、测试坑、文档更新、GitHub Pages 部署命令。

## 三、铁律（违反过，用户纠正过）
1. **全程中文**。用户的话有两种以上理解时，**先用 AskUserQuestion 问**，不要自己挑一种直接做。
2. 炫技优先、**几乎零文案**、元素要少。删掉的东西不要加回来：章节号、角标、滚动提示、鼠标拖尾、信标、3D 文字。
3. 滚动是**一滑一段、自动到位、中途不停、三个游戏页必停、下一次滑动立即继续、跟手、不能慢启动**。不要改成自由滚动加吸附，也不要改成硬停。
4. 开屏：线框和扫描保留，其余直接到位（约 4 秒）。
5. 进出游戏只能走「展台光环传送门」，不能有不相干的中间画面、黑屏或卡顿。
6. **不要自动降低特效**；游戏按需加载、退出即释放；不用 CDN、npm 或构建步骤；声音默认开、没有开关。
7. `sample.html` 必须和 `index.html` 逐字节一致；改了 JS 或 CSS 就把全部 `?v=journey-NN` 统一升级。
8. 预览只用 `启动预览.py`（`python -m http.server` 会让页面掉进静态模式）。Claude 应用里的预览窗口是隐藏的，动画不会跑，要用 `scripts/cdp.mjs` 启动 headless 浏览器测试。
9. 每完成一个阶段：回归测试 → 前后截图发给用户 → 更新 `修改记录.txt`、README、`打包检查.json`、`文件清单.sha256` → git 提交。**部署要等用户点头**（当前约定：第 5 条做完再一起部署）。
10. 保留 credits.html 和全部授权文件，新素材只用 CC0。

## 四、当前进度与下一步
- 原始反馈第 1、2、3、4、6 条已完成，第 5 条已做完第一步（盘点，见 `3D素材盘点.md`）。另外已完成：清理未用文件、传送门衔接、滚动跟手、删除小字、修复展台条纹。
- **下一步**：第 5 条第二步——用 CC0 素材（Kenney / Quaternius / Poly Pizza，每套只用同一个系列）在同一个镜头下做 2–3 套风格对比（建议：低多边形卡通 / 柔和黏土 / 写实硬表面，附上黑盒 logo 是否跟着改的样子），让用户选。
- 选定后按 深空救援 → 设施突入 → 玩具公园 → 开场 → 客厅 的顺序逐个世界替换。滚动页面和游戏内部都要换；**展台星舰要换，吉普保留**。每个世界做完都要截图确认、git 提交、更新 credits。全部完成后再部署。

## 五、脚本
| 脚本 | 用途 |
|---|---|
| `scripts/restore.sh [dir]` | 从快照恢复项目，并校验每个文件 |
| `scripts/final-check.mjs` | 打包检查：语法、import 能否解析、裸包依赖、sample/index 是否一致（在项目根目录用 `node --experimental-vm-modules` 运行） |
| `scripts/regress.mjs [url] [out]` | 浏览器回归 22 项：3D 是否启动、一滑一段、触控板惯性、滚动响应、无小字、三个游戏进出、Esc 中途返回、手机，并生成逐帧拼图 |
| `scripts/cdp.mjs` | 启动 headless Edge/Chrome 的 CDP 小工具：`launch({w,h,mobile})` → `{ev, shot, wheel, send, logs, close}` |
| `scripts/sheet.mjs dir prefix out [cols]` | 把多张截图拼成一张对比图 |

## 六、没有快照时如何从零重建
按 `reference/history.md` 的版本顺序推进，每一步都对照 `reference/spec.md` 里的确切数值（章节进度、颜色、INTRO 时间线、滚动曲线、镜头航点、光环半径、传送门节奏、HUD 网格）实现。架构按 `reference/architecture.md` 拆分模块。三个游戏和客厅的玩法细节以 `修改记录.txt` 第五～七节和二十一～三十六节为准。只有从快照恢复能保证完全一致；从零重建只能做到行为和外观一致。
