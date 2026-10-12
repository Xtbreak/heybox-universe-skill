# 代码架构（dist/，journey-43c）

所有模块都是浏览器原生 ES Module，import 都带 `?v=journey-NN`。Three.js 是 r186，放在 vendor/。

## 调用关系
```
sample.html ─ sample.css
  └ sample.js（页面层：DOM、HUD、滚动进度映射、按钮、恢复）
      ├ idle-world-snap.js     分段滚动（一滑一段）→ onState 把滚动状态传给 world.setScrollState
      ├ scroll-fx.js           滚动速度驱动的 DOM 层（目前只剩很少的效果）
      ├ title-decode.js        章节标题乱码解码
      ├ game-audio.js          音乐、音效、引擎声
      ├ context-recovery.js    WebGL 上下文丢失后的恢复
      ├ game-session-ui.js     结算文案
      └ open-adventure.js  createWorld(canvas,{onReady,onError,onState,onFrame,audio,...})
          ├ cosmic-journey.js  滚动旅程：镜头轨道、展台、各章布景
          │   ├ brick-hero.js + brick-blueprint.js  开场砖块黑盒、线框、扫描（INTRO 时间线）
          │   ├ voxel-heybox.js   4800 颗小方块：logo 对齐 → 解体 → 重组成飞船、机器人、小车
          │   ├ lunar-opening.js  写实月面、地球、雾
          │   ├ space-backdrop.js 程序星云、视差星空
          │   ├ journey-particles.js  迁移粒子（从模型表面三角形按面积采样）
          │   ├ journey-ultra.js  极致画质附加效果（隧道已停用、悬停能量环、发光缝）
          │   ├ showcase-scenes.js 三个展示场景（代码拼的低多边形，第 5 条要换的主要对象）
          │   └ community-plaza.js 结尾客厅（Kenney 角色、藏起来的 logo、挂画）
          ├ world-portal.js    进入/退出游戏：光环窗口、主角走进去、镜头推进、交接
          ├ model-hover-entry.js 悬停 1s 进入的计时、模型投影外轮廓命中
          ├ cinematic-pass.js  后期：色差、暗角、颗粒、径向模糊、故障；uMix 控制交接
          ├ spatial-refraction.js 局部屏幕空间折射
          ├ texture-prewarm.js 预先上传贴图到 GPU
          ├ toy-ship.js        玩具飞船、敌机、母舰（展台模型和第一关共用）
          ├ miniature-car.js   红色遥控吉普（展台模型和第三关共用，保留）
          └ 按需 import()：
              flight-game.js   第一关：纸板横版射击
              sandbox-game.js  第二关：第一人称设施（借用 RobotExpressive 和 fps-pistol.glb）
              driving-game.js  第三关：玩具公园，引用 miniature-landscape / -playground-props / -driving-physics
```

## 关键接口
- `createWorld(canvas, opts)` 返回 api，主要方法：
  - `setProgress(p)`：0–1，sample.js 把滚动位置映射成进度后调用。
  - `setScrollState(s)`：传入滚动状态。
  - `action(name, payload)`：name 可以是 enter / exit / pause / resume / restart / takeControl / control / retry 等。
  - `setPaused`、`setQuality`、`dispose`、`getState`。
- 进度映射：sample.js 的 `update()` 用每个 `.frame` 的 data-p / data-end，加上它在视口里的位置，算出 0–1 的进度，然后 `world.setProgress(p)`。同时切换 `.lit` 类，以及 body 上的 `transit-mode`、`at-top` 类。
- 游戏模块统一接口：`createGame({THREE, scene, camera, model, playAnimation, emit, width, height, reduced, assets, difficulty, sound})`，返回对象包含：
  - `update(dt, input)`、`getState()`、`action(name)`、`setPaused(b)`、`resize(w, h)`
  - `snapshot()`、`restore(s)`、`dispose()`
  - 游戏拿到的 camera 是宿主的独立 `gameCamera`。
- `journey.getRing(name)` 返回 `{ group: 光环背板, radius: 光环半径 - .13, hide: [全息线框, 尘埃] }`，world-portal 用它定位窗口。
- 宿主的模式状态机（open-adventure.js）：
  - `mode`：showcase → travel（光环进入中）→ game（awaitingControl → active）→ travel（lifecycle=return 退出中）→ showcase。
  - `returnPhase`：'fade'（截下游戏最后一帧）→ 'portal'（倒回）；中途取消时是 'cancel'。
- `renderScene(target, view)`：页面场景用页面相机 `camera`，游戏场景用 `gameCamera`。根据 `handover`（world-portal 的推进进度）逐渐关掉 bloom、cinematic 和折射。

## 展台模型
- `entries[name]`：`group`（由 cosmic-journey 每帧设置位置、旋转、缩放）→ `normalized`（统一缩放，即 `entry.object`）→ `offset` → 模型本身。
- 飞船：toy-ship 程序生成，长 3.25。机器人：RobotExpressive.glb，高 3.45，带 AnimationMixer。吉普：miniature-car 程序生成。
- 展台每帧的姿态写在 cosmic-journey.js 的 update 循环里（漂浮、helmet 慢慢摆动、car 的 y 偏移 .565）。

## 资源清单（dist/models）
- `RobotExpressive.glb`（CC0，Tomás Laulhé / Don McCurdy），有 14 段动画：Idle / Walking / Running / Wave …
- `fps-pistol.glb`（Poly Haven Service Pistol，CC0，已用 meshopt + webp 压缩）。
- `players/character-{female-b,c,f,male-a,b,f}.glb` 和 `Textures/colormap.png`（Kenney Mini Characters，CC0）。
- `audio/journey.m4a`、`audio/play.m4a`（CC0）；`audio/engine-qubodup-loop.wav`（CC BY 3.0）。
- `vendor/`：three.module.js、three.core.js（r186）、GLTFLoader、EffectComposer 系列、UnrealBloomPass、OutputPass、RoomEnvironment、BufferGeometryUtils、SkeletonUtils、meshopt_decoder。
- `world.webp`：WebGL 起不来时的静态背景。

## 写法约定
- 现有代码是紧凑长行写法，改动时照样保持。新功能放进新文件。注释用英文，写的是「为什么」。
- 所有 GPU 资源都要能释放（用 keep/own 集合登记，在 dispose 里释放）。
- 每帧不能调用 matchMedia，不能做布局测量（缓存起来，在 resize 时再更新）。
