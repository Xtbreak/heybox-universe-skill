# 工作流程、检查与部署

## 每次改动的固定流程
1. **先弄清楚要改什么**：用户的话有两种以上理解时，先用 AskUserQuestion 问清楚。
2. 改 `dist/` 里的源码。新逻辑尽量放进新模块，现有文件都是紧凑的长行写法，照着这个风格写。
3. 版本号：把所有 `journey-<旧>` 换成新版本（sample.html、sample.js、各模块的 import 都要换），然后执行：
   ```bash
   cd dist && sed -i '' 's/journey-43c/journey-44/g' $(grep -l journey-43c *.js *.html) && cp sample.html index.html
   ```
4. 每个改过的 JS 都跑一遍 `node --check`。
5. 打包检查（在项目根目录运行）：
   ```bash
   node --experimental-vm-modules <skill>/scripts/final-check.mjs
   ```
   要求：没有语法错误、没有缺失的 import、没有裸包依赖、sample 和 index 完全相同。
6. 浏览器回归（预览服务器必须是 `启动预览.py`）：
   ```bash
   python3 启动预览.py --port 8017
   node <skill>/scripts/regress.mjs http://127.0.0.1:8017/sample.html /tmp/heybox-regress
   ```
   - 要求 22/22 通过。它会把三个游戏进出过程的逐帧拼图存成 `sheet-*.png`，看图确认没有出现中间场景。
7. 有视觉改动时，一定要截图对比修改前后，把图发给用户（SendUserFile）。
8. 更新文档：
   - `修改记录.txt` 追加一节，格式是「三十七、journey-44：……」，写清原因、怎么改的、验证了什么。
   - `README-先读我.txt` 第一行改版本号，并在版本列表里加一行。
   - `打包检查.json` 的 version 字段。
   - 重新生成 `文件清单.sha256`：
     ```bash
     python3 - <<'EOF'
     import hashlib,os
     L=open('文件清单.sha256',encoding='utf-8').read().splitlines()
     paths=[l.split('  ',1)[1] for l in L if os.path.exists(l.split('  ',1)[1])]
     for r,_,fs in os.walk('dist'):
         for f in fs:
             p=os.path.join(r,f)
             if p not in paths and not f.startswith('.'): paths.append(p)
     open('文件清单.sha256','w',encoding='utf-8').write('\n'.join(hashlib.sha256(open(p,'rb').read()).hexdigest()+'  '+p for p in sorted(paths))+'\n')
     EOF
     ```
9. git 提交，提交信息用英文，格式为 `journey-44: <摘要>`。
10. 用中文回复用户：做了什么、实测数据、给出预览地址 `http://127.0.0.1:8017/sample.html?rev=<版本>`。

## 测试时容易踩的坑
- **不要用 `python3 -m http.server`**：模块并发加载时会断开连接（ERR_CONNECTION_RESET），页面会掉进静态模式（body 上出现 `light` 类，显示「3D 资源仍在载入」）。要用多线程的 `启动预览.py`。
- **Claude 应用里的预览窗口通常是隐藏的**（visibilityState=hidden，requestAnimationFrame 不会运行），在里面测不了动画。改用 `scripts/cdp.mjs` 启动 headless Edge 或 Chrome，通过 CDP 截图和发送输入事件。
- 预览服务器可能被应用回收。用户说「打不开」时，先 `curl` 检查，再用 preview_start 重新启动。端口被占用时，告诉用户换 `--port 8001`。
- 浏览器会缓存模块，改完不换版本号就会读到旧代码。
- 进入游戏要等滚动稳定。headless 下用 `[data-action=helmet|robot|car].click()` 最稳。
- 截图前要等开场结束（loading 出现 done 后再等约 5.5 秒）。
- 模拟触控板：用页面内派发的、逐渐减弱的 WheelEvent；CDP 每次调用之间间隔太长，模拟不准。
- 手机测试：390×844，开启 `Emulation.setTouchEmulationEnabled`，再用 `Input.dispatchTouchEvent` 模拟拖动。

## 部署到 GitHub Pages（先征得用户同意）
部署仓库在 `output/github-pages/`（单独的 git，远程是 Xtbreak/heybox-universe）。推送前要先用 `gh auth login` 登录有写权限的账号；提交身份用本机 git 已配置好的 user.name / user.email。
```bash
cd <project>
rsync -a --delete --exclude .git --exclude .nojekyll --exclude .DS_Store dist/ output/github-pages/
cd output/github-pages && git add -A && git commit -qm "journey-44: ..." \
 && git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -q https://github.com/Xtbreak/heybox-universe.git HEAD:main
# 等 Pages 构建完成
for i in $(seq 1 16); do s=$(gh api repos/Xtbreak/heybox-universe/pages/builds/latest --jq '.status+" "+.commit'); case "$s" in built*$(git rev-parse --short HEAD)*) echo "$s"; break;; esac; sleep 15; done
# 逐个文件比对线上和本地是否一致
B=https://xtbreak.github.io/heybox-universe; cd ../../dist; bad=0
for f in $(find . -type f ! -name .DS_Store ! -name '*.glb' ! -name '*.m4a' ! -name '*.png' ! -name '*.jpg' | sed 's|^\./||'); do
  [ "$(shasum -a 256 "$f"|cut -c1-64)" = "$(curl -sf "$B/$f?cb=$RANDOM"|shasum -a 256|cut -c1-64)" ] || { bad=$((bad+1)); echo "DIFF $f"; }; done; echo bad=$bad
```
- `.nojekyll` 必须保留（rsync 时排除它，防止被 --delete 删掉）。
- credits.html 和所有授权文件必须一起发布。

## 预览服务器配置（.claude/launch.json）
```json
{"name":"heybox","runtimeExecutable":"python3","runtimeArgs":["<project>/启动预览.py","--port","8017"],"port":8017}
```
