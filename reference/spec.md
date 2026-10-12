# 小黑盒 · 三世界宇宙旅程（heybox-universe）现状规格 · journey-43c

这份文档描述项目在 journey-43c（git a4028a4）时**确切是什么样**。数值都摘自源码，修改时以源码为准。

## 1. 项目是什么
- 小黑盒（Heybox）的**非官方、非商用课程概念 Demo**。页面是一段滚动驱动的 3D 宇宙旅程：月面开场 → 三个可玩的小游戏世界 → 结尾走进朋友家客厅。
- 纯静态站点，`dist/` 就是源码。没有 npm、没有构建。Three.js r186 放在本地 `dist/vendor/`，不用 CDN。
- 线上地址：https://xtbreak.github.io/heybox-universe/ ，部署仓库是 https://github.com/Xtbreak/heybox-universe （main 分支根目录，带 `.nojekyll`）。线上目前停在 journey-41，journey-42 及之后的版本**还没部署**。用户已经定了：等第 5 条（3D 素材）做完再一起部署。
- 所有交流用中文。

## 2. 目录
```
heybox/
  dist/                 网站本体（≈9.3MB）
  blender/              原版黑盒精修工程（.blend / GLB / 重建脚本），主页面已不再加载 GLB
  启动预览.py           多线程本地服务器，用它预览，不要用 python -m http.server
  README-先读我.txt     用户向说明（含每个版本的一句话摘要）
  修改记录.txt          每个版本的详细记录（三十二～三十六节是 42–43c）
  打包检查.json         打包检查结果（version 字段 = 当前版本）
  文件清单.sha256       所有交付文件的 SHA-256
  3D素材盘点.md         第 5 条的盘点结果
  output/               （gitignore）备份、QA 截图、github-pages 部署仓库
```

## 3. 页面结构（dist/sample.html，index.html 必须逐字节相同）
| section id | class | data-p → data-end | 内容 |
|---|---|---|---|
| start | frame launch | 0 → .07 | 月面开场，黑盒 |
| manifest | frame manifest | .07 → .12 | 对齐（logo 对齐闪光） |
| dive | frame cinematic | .12 → .23 | 解体 |
| warp | frame cinematic warp-frame | .23 → .34 | 跃迁（已无隧道） |
| equipment | frame landing | .34 → .45 | **游戏 1 深空救援**（data-action=helmet） |
| drift | frame cinematic | .45 → .54 | 重组（石环门裂开） |
| companion | frame landing | .54 → .66 | **游戏 2 设施突入**（robot） |
| time-rift | frame cinematic warp-frame | .66 → .77 | 加速（穿闸门） |
| drive | frame landing | .77 → .90 | **游戏 3 玩具公园**（car） |
| together | frame finale plaza | .90 → 1 | 客厅结尾 |

- 每个 section 里有 `.copy > h2.tag`，格式为 `<i>04</i> — 深空救援 / RESCUE`。**非游戏章节的 .copy 用 CSS `display:none` 隐藏**（用户要求删掉左下角章节名）。DOM 保留，因为脚本要读。
- 三个游戏章节的 `.copy` 是模型正下方居中的深色信息条：
  - 深空救援：「救起 5 名漂流的宇航员，击退三波敌机，护送曙光号入港。」`<small>横版射击 · 约 4 分钟</small>`
  - 设施突入：「潜入设施取回信号核心，摧毁干扰装置后撤离。」`<small>第一人称 · 约 6 分钟</small>`
  - 玩具公园：「开着玩具车在公园里自由驾驶，冲坡、漂移，撞翻一切。」`<small>自由驾驶 · 不限时</small>`
  - 按钮：`<button class="enter-btn" data-action="helmet|robot|car"><span>[</span> 进入 <b>↗</b> <span>]</span></button>`
- 页眉左上只有 `[ 小黑盒 / HEYBOX ]`。**右侧章节号 `.side-nav` 已从 HTML 删除**。
- 结尾 `#together` 只有一个读屏用的「欢迎回来」，右下角 `[ CREDITS ]` 链接到 credits.html。
- 载入页：一行等宽进度字符 `HEYBOX / GRAINS [■■■···] 48% 2314 / 4800`（#load-line）。

## 4. 视觉风格
- 石墨黑 + 唯一强调色冰蓝：`--graphite:#0b0c0e; --accent:#8fdcff; --ink:#c9d3da; --dim:#5d666d`。
- 界面文字都用等宽字体：`--mono:'JetBrains Mono','SFMono-Regular',Menlo,Consolas,'PingFang SC',monospace`。标签方括号包裹，字距 .16–.2em。
- **几乎零文案**：不要标语、不要大标题、不要说明段落。用户原话：「我只需要炫技，绚丽的特效，炫酷的效果，华丽的动画」。
- 信息条：深色玻璃 `#0b0c0ed9` + `backdrop-filter:blur(12px)`，1px 描边 `#c9d3da1a`，左上角一段 24px 冰蓝短线。
  - 桌面：`top:calc(100svh - 112px)`，水平居中，宽度按内容，最大 `min(760px,92vw)`。用 grid 布局，左边是标签和说明，右边是按钮。
  - 手机：贴底，`top:calc(100svh - 206px)`，左右各 16px。
  - 为了让信息条不被下一段顶起，游戏章节要加高：桌面 `min-height:max(1420px,158svh)`，手机 `min-height:1260px`。
- 按钮：直角、透明底、1px 描边，等宽 12px，字距 .2em，`↗` 用冰蓝。悬停时描边变冰蓝、底色 `#8fdcff14`，箭头往右上移 2px。
- 第一关 HUD（`.toy-space` / `.roaming`）：
  - 四边留白 28px（手机 16px）。
  - 分数、任务、技能三块和右上菜单按钮统一 28px 高、5px 圆角、间距 8px。
  - 奶油色玩具皮肤 `--toy-ink:#593724; --toy-paper:#fff0d6`。

## 5. 开场（brick-hero.js / brick-blueprint.js / lunar-opening.js / voxel-heybox.js）
- 学的是 igloo.inc 的出场方式。读条结束后约 4 秒落位，一个镜头不切：
  `INTRO = { draw:[.25,2.1], net:[.45,2.4,3,3.6], scan:[2,3.4], ground:[2.9,3.7], camera:[.1,3.5], shed:3.6 }`（单位：秒）
  1. 取景框：三层冰蓝圆角框往里收拢，1.2s，从 .3s 开始，每层间隔 .1s。
  2. 线框：从盒顶开始，每块砖的棱线像花瓣一样逐笔画出，笔尖有跑动的亮点；四周同时画一张稀疏的三角线网。
  3. 扫描：一块发光截面从上往下沉，扫过的地方从线框变成实体砖，刚成形时发白，随后冷却成石墨色。
  4. 月面从盒底向外长出，边缘是发光的锯齿像素边；然后星空、星云、地球淡入。镜头从俯视降到正面。
  5. 外壳砖从正面中心开始一块块飘离，边转边烧成冰蓝光点散去，只留下立体 logo 继续呼吸。
- 黑盒外壳是错缝砌的大砖：6 层墙砖，转角咬合，顶和底各一层压顶砖。砖有圆倒角，表面是石墨石材，带云母闪点。只有砖缝里朝内的面透冰蓝光。logo 部分用小砖。
- 砖缝火星 `SPARKS = 550`（原来 1100）。
- 用户的硬性要求：开屏「线框和扫描保留，后面要快，直接到位，不要缓慢干预」。

## 6. 滚动（idle-world-snap.js）——用户反复强调，最重要
- **一滑一段，自动到位**。分 5 站：开场 → 深空救援 → 设施突入 → 玩具公园 → 结尾。
- 一次手势只走一段，过渡中途不能停在某一帧。一次手势包括：滚轮一格或一甩、触控板滑一下连同惯性、↓/↑/PageDown/PageUp/空格、手机上下滑一次。
- 三个游戏页**必停**；停下后，**下一次新的滚动立即出发**，不用等。
- 每站的停留位置是 `poses = { equipment:.395, companion:.600, drive:.835 }`，开场停在顶部，结尾停在可滚到的最底部。
- 过渡时长按走过的屏数算：`clamp(1200 + 屏数*600, 1600, 3800)` ms。游戏之间约 2.9s，开场到第一个游戏约 3.8s。
- 曲线：前 `ramp = min(.1, 120/duration)` 是加速段（约 0.12s），然后匀速，最后 45% 的时间是二次减速。**不要用余弦/缓入曲线**，用户觉得「有延迟、不跟手」。
- 手势识别：
  - 输入间隔 ≥180ms 才算新手势。
  - 只有「逐渐变弱」的输入算触控板惯性：`magnitude < previous - .5`，或者 `≤previous 且 <40`。鼠标一格一格拨（每格大小相同）永远算新输入。
  - 到站后 450ms 内，同一串持续转动的滚轮不出发（dwell）。
  - 过渡中同方向的输入不排队；反方向立即掉头。
- Home/End 飞到首/尾。触摸滑动阈值 40px。原生滚动（拖滚动条、页内查找）停下 220ms 后吸到最近的一站。
- 3D 镜头跟随滚动：`progress = damp(progress, target, 40, dt)`。不要再加一层慢阻尼，否则会「平滑两次」，显得迟钝。
- 历史教训（试过、被否掉的方案）：
  - 自由滚动加「停下后吸附」：快滑会直接滑到底，三个游戏页不再必停 → 否。
  - 「往下滚时硬停 + 0.4s 解锁」：手感卡顿 → 否。
  - 慢启动缓动：显得延迟 → 否。

## 7. 镜头（cosmic-journey.js）
- 镜头轨道由航点 `nodes` 组成，每个航点是 `[p, camX,camY,camZ, lookX,lookY,lookZ, fov]`。航点之间用**单调三次 Hermite 样条**插值（Fritsch–Carlson 切线），速度连续，不会过冲。试过分段直线，每个航点处速度突变显得卡顿，已改回。
- 展台位置：`modelLocations = { helmet:[2,.15,-108], robot:[2,0,-204], car:[2,-.25,-338] }`。光环半径：helmet 2.55、robot 2.7、car 2.65。
- 世界只在镜头最后几米才在四周淡入：`ARRIVE = [[.326,.35],[.529,.552],[.756,.78]]`。
- 已去掉的东西：超空间隧道、镜头滚转、FOV 拉伸、转场闪白。
- 玩具公园展台比其他两个高 `lift = .035`，吉普的 y 偏移是 `.565`。否则展台台面和马路会互相遮挡出现条纹（z-fighting）。

## 8. 三个展示场景（showcase-scenes.js）——目前全部是代码拼的低多边形
- 深空救援：空间站（转轮、太阳能板、信标）、救援母舰用牵引光束收逃生舱、两架小飞机缠斗、18 块残骸、120 颗小行星、背景大行星。
- 设施突入：后墙、黄黑警示闸门、管道阀门、走廊楼梯、吊架吊灯、木箱油桶、巡逻机器人、无人机、探照灯、蒸汽。
- 玩具公园：草地马路、小房子、46 棵树、摩天轮、HEYBOX PARK 招牌、路灯、漂移的吉普撞积木塔。
- 展台：黑色圆台、冰蓝光环、全息线框圆柱、上升的尘埃、接触阴影。
- **过场方块不跟鼠标互动**（用户明确要求）。

## 9. 进入 / 退出游戏（world-portal.js + open-adventure.js）——「展台光环变成传送门」
- 触发方式：点「[ 进入 ↗ ]」、悬停模型 1s（model-hover-entry.js 里 `duration=1000`）、手机轻触模型、在游戏章节按 Enter。
- 悬停时，光环里的光幕随进度亮起（uOpen 最高 .55）。
- 进入：
  1. 主角转身走进光环：飞船朝 -Z 飞进去；机器人朝 +Z 走进去，保持高度，播 Walking 动画；吉普朝 -Z 开进去，保持高度。
  2. 游戏用**独立的 gameCamera** 在后台建好，并用 `renderer.compileAsync` 预编译着色器。机器人会被游戏借用，所以要等它走进光环后才建游戏。
  3. 建好后，光环窗口里显示真实的、正在运行的游戏画面（屏幕空间采样，以光环中心对齐）。
  4. 镜头沿直线推进，光环正好铺满屏幕时（距离 = `r*.94/(tan(fov/2)*sqrt(1+aspect²))`）就交给游戏。
  5. 镜头推进途中，页面后期效果（bloom、色差等）按 `handover` 逐渐退出，交接瞬间颜色和亮度不跳。窗口增益 `1/.95`，用来补页面曝光 .95 和游戏曝光 1 之间的差。
- 节奏：光幕 .45s 打开；游戏画面 .25s 淡入；镜头 1.5s 推进（游戏画面出现前最多推到 50%）；模型走进去用时 `smooth(.02,.8)`。
- 光环颜色：helmet `0x8fdcff`，robot `0x9ff0d6`，car `0xffc27a`。
- 退出：游戏最后一帧留在光环里，镜头往后退（1.2s），主角走回展台。
- 进入途中按 Esc 或点「返回」：`worldPortal.reverse()` 原路倒回，倒回后能马上再进。
- 已删掉的东西：中间不相干的场景（portal-entry.js / destination-arrival.js 整个删了）、进入时的冲击闪白、悬停时绕模型转的能量环。
- 实测：进入时最长一帧约 69–84ms。

## 10. 三个游戏（按需加载，退出即释放）
- 只有悬停或点进入时才 `import()` 游戏代码和游戏专用模型；退出时销毁游戏实例、释放模型和音乐。三个展台模型常驻。
- **深空救援** flight-game.js：
  - 正侧面「纸板舞台」横版射击，桃橙天空、剪纸行星和云、木棍上插着星星，有一盏斜照阳光投影。
  - 流程：救 5 名宇航员 → 击退 3 波敌机 → 护送曙光号入港。3 颗心，三连发，Shift 冲刺，难度 1–3，每段开头有检查点。
  - 飞船、敌机、母舰都来自 toy-ship.js（代码拼的玩具低多边形）。
- **设施突入** sandbox-game.js：
  - 第一人称射击，指针锁定。WASD、右键或 Z 瞄准、R 换弹、E 互动、Q 投掷、Space 跳。
  - 有队友 A-01/A-02、医疗兵 H-01，三档难度。
  - 武器是 fps-pistol.glb（Poly Haven CC0）；机器人是 RobotExpressive.glb（CC0）。
  - 设施本体是灰色方块（盘点里列为最该换的一项）。
- **玩具公园** driving-game.js + miniature-*.js：
  - 橙色玩具场地自由驾驶，红色遥控吉普（miniature-car.js，**用户要求保留**）。
  - 场地里所有立着的东西都能撞散（153 个刚体），R 复位。
- 游戏内画质：不加 bloom，曝光 1。

## 11. 声音（game-audio.js）
- 背景音乐是两首 CC0 曲目：journey.m4a（旅程）、play.m4a（游戏内）。引擎声 engine-qubodup-loop.wav（CC BY 3.0）。
- **默认开、没有开关**，第一次交互时自动解锁。

## 12. 画质
- 桌面固定 ultra，触屏是 standard。**永远不自动降级**（用户明确要求：不要自动降低特效）。没有画质按钮，没有减少动态开关。
- 像素比上限：桌面 1.5，窄屏 1.25。曝光 .95（页面）/ 1（游戏）。

## 13. 结尾客厅（community-plaza.js）
- 小车开到朋友家门口，门打开，镜头第一人称走进客厅，停在客厅里。
- 6 位 Kenney Mini Characters（CC0）各玩各的设备（PC、Xbox 式手柄、PS 式手柄、掌机、手机），看到你后转头、挥手；坐垫上的人递出一个手柄。有一只猫。
- 茶几上有小黑盒模型，屋里藏了十几处小黑盒 logo（门牌、门垫、邮箱、阁楼窗、星座、霓虹灯、海报、抱枕、马克杯、地毯、电视、电脑）。
- 墙上挂画「欢迎回来」：米色宣纸底、楷体字、红色「盒」字印章。
- 只有一盏暖色顶灯投影。

## 14. 授权（必须保留）
- credits.html；models/ATTRIBUTION.txt；models/players/KENNEY-ATTRIBUTION.txt；audio/ENGINE-LICENSE.txt；audio/MUSIC-LICENSE.txt；vendor/THREE-LICENSE.txt；vendor/MESHOPT-LICENSE.txt。
- 「非官方、非商用课程概念」的声明要保留。新素材只用 CC0（或者至少可商用的授权），并写进 credits。

## 15. 缓存版本号
- 所有本地 import 都带 `?v=journey-NN`，出现在 sample.html、sample.js 和各模块的 import 语句里。
- 改了任何 JS 或 CSS，就把**所有** `journey-NN` 统一换成新版本号，然后 `cp sample.html index.html`。
- 历史上小改动用后缀字母：42 → 42a…42i、43 → 43b、43c。预览地址带 `?rev=<版本>`。
