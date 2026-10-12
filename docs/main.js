// 落地页交互：载入、滚动驱动（首屏 / 时间线）、终端打字、数字解码、结构树
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 载入 ----------
const bar = $('#load-bar'), pct = $('#load-pct');
let shown = 0, target = 0, ready = false;
function paintLoader() {
  shown += (target - shown) * .18;
  const v = Math.round(shown * 100), n = Math.round(shown * 10);
  bar.textContent = '[' + '■'.repeat(n) + '·'.repeat(10 - n) + ']';
  pct.textContent = v + '%';
  if (ready && shown > .995) return finishLoad();
  requestAnimationFrame(paintLoader);
}
requestAnimationFrame(paintLoader);
const markReady = () => { target = 1; ready = true; };
// 字体就绪后进入页面；兜底：最多等 4 秒
Promise.all([document.fonts?.ready, new Promise(r => setTimeout(r, 900))]).then(markReady);
setTimeout(markReady, 4000);
// 资源载入时给进度一点自然的推进
const tick = setInterval(() => { if (target < .85) target += .04; else clearInterval(tick); }, 120);

let loaded = false;
function finishLoad() {
  if (loaded) return; loaded = true;
  document.body.classList.remove('is-loading');
  document.body.classList.add('intro');
  dispatchEvent(new Event('hb:start'));
  setTimeout(() => document.body.classList.add('intro-done'), reduce ? 0 : 2600);
}

// ---------- 进入视口时显现 ----------
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  e.target.dispatchEvent(new Event('inview'));
  io.unobserve(e.target);
}), {threshold: .35});
$$('.reveal, .strike, .numbers, .term').forEach(el => io.observe(el));

// ---------- 提示词跑马灯：复制一份，平移 -50% 时无缝衔接 ----------
$$('.q-row').forEach(row => [...row.children].forEach(li => {
  const c = li.cloneNode(true);
  c.setAttribute('aria-hidden', 'true');
  row.appendChild(c);
}));

// ---------- 数字解码 ----------
$('.numbers').addEventListener('inview', () => {
  $$('.num').forEach((el, i) => {
    const to = +el.dataset.to, len = String(to).length, t0 = performance.now() + i * 140, dur = 1400;
    (function f(now) {
      const t = clamp((now - t0) / dur);
      if (t < 1) {
        // 先乱码跳动，再逐渐收敛到真实数值
        const settle = Math.round(to * (1 - Math.pow(1 - t, 3)));
        el.textContent = t < .55 ? String(Math.floor(Math.random() * Math.pow(10, len))).padStart(len, '0') : settle;
        requestAnimationFrame(f);
      } else el.textContent = to;
    })(performance.now());
  });
});

// ---------- 滚动驱动 ----------
const heroCopy = $('.hero-copy'), heroMeta = $('.hero-meta'), heroMark = $('.hero-mark');
const progress = $('.progress');
const tl = $('#timeline'), track = $('.tl-track');
let vw = innerWidth, vh = innerHeight;

function sectionP(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - vh));
}

function layoutTimeline() {
  const extra = Math.max(0, track.scrollWidth - vw);
  tl.style.height = (vh + extra * 1.1) + 'px';
  tl.dataset.extra = extra;
}

function onScroll() {
  const doc = document.documentElement;
  progress.style.setProperty('--p', clamp(scrollY / Math.max(1, doc.scrollHeight - vh)).toFixed(4));

  // 首屏：标题上浮淡出，标志以更慢的速度后退，形成视差
  if (document.body.classList.contains('intro-done')) {
    const hp = clamp(scrollY / vh);
    const out = smooth(.05, .7, hp);
    heroCopy.style.opacity = 1 - out;
    heroCopy.style.transform = `translateY(${-out * 60}px)`;
    heroMeta.style.opacity = 1 - out;
    heroMark.style.setProperty('--py', (hp * 18).toFixed(2) + 'vh');
    heroMark.style.setProperty('--pa', (1 - smooth(.2, .95, hp) * .85).toFixed(3));
  }

  // 时间线：竖向滚动换算成横向平移
  const tp = sectionP(tl);
  track.style.setProperty('--tx', (-tp * (+tl.dataset.extra || 0)).toFixed(1) + 'px');
}

let raf = 0;
addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, {passive: true});
addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; layoutTimeline(); onScroll(); });
addEventListener('hb:start', onScroll);
addEventListener('load', () => { layoutTimeline(); onScroll(); });
layoutTimeline(); onScroll();
// intro-done 之后首屏样式才开始接管
new MutationObserver(onScroll).observe(document.body, {attributes: true, attributeFilter: ['class']});

// ---------- 终端打字 ----------
const HOME = '~';
const SCRIPT = [
  {step: 0, cmd: 'git clone https://github.com/Xtbreak/heybox-universe-skill ~/.claude/skills/heybox-universe',
    out: [['d', "Cloning into '" + HOME + "/.claude/skills/heybox-universe'... done."]]},
  {step: 1, cmd: 'bash ~/.claude/skills/heybox-universe/scripts/restore.sh ~/Code/heybox',
    out: [['ok', '已恢复到 ' + HOME + '/Code/heybox  ·  104 个文件  ·  journey-43c'],
          ['d', '预览：python3 启动预览.py --port 8017  然后打开 http://127.0.0.1:8017/sample.html?rev=journey-43c']]},
  {step: 2, cmd: 'cd ~/Code/heybox && python3 启动预览.py --port 8017 &',
    out: [['', '本地预览：http://127.0.0.1:8017/sample.html'], ['d', '按 Ctrl+C 停止。仅绑定本机，不对局域网公开。']]},
  {step: 3, cmd: 'node ~/.claude/skills/heybox-universe/scripts/regress.mjs http://127.0.0.1:8017/sample.html /tmp/heybox-regress',
    out: [['ok', 'PASS  boots in 3D'],
          ['ok', 'PASS  one notch = one stage  — equipment → companion → drive → together'],
          ['ok', 'PASS  trackpad momentum never skips'],
          ['ok', 'PASS  no side numbers / corner labels'],
          ['ok', 'PASS  helmet: enters · exits to same place'],
          ['ok', 'PASS  robot: enters · exits to same place'],
          ['ok', 'PASS  car: enters · exits to same place'],
          ['d', '…'],
          ['c', '22/22 passed · screenshots in /tmp/heybox-regress']]}
];
const term = $('#term'), steps = $$('.steps li');
const esc = s => s.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));
let typed = false;
$('.term').addEventListener('inview', async () => {
  if (typed) return; typed = true;
  const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  let html = '';
  const paint = cur => { term.innerHTML = html + (cur ? '<span class="cur"></span>' : ''); };
  for (const block of SCRIPT) {
    steps.forEach((li, i) => li.classList.toggle('on', i === block.step));
    html += '<span class="p">❯ </span>';
    for (let i = 0; i < block.cmd.length; i += 2) {
      term.innerHTML = html + '<span class="c">' + esc(block.cmd.slice(0, i)) + '</span><span class="cur"></span>';
      await sleep(14);
    }
    html += '<span class="c">' + esc(block.cmd) + '</span>\n';
    paint(true); await sleep(380);
    for (const [cls, line] of block.out) { html += `<span class="${cls}">${esc(line)}</span>\n`; paint(true); await sleep(block.step === 3 ? 140 : 220); }
    html += '\n'; paint(true); await sleep(520);
  }
  steps.forEach(li => li.classList.add('on'));
  html += '<span class="p">❯ </span>'; paint(true);
});

// ---------- 复制命令 ----------
$$('.copy').forEach(btn => btn.addEventListener('click', async () => {
  const label = btn.textContent;
  try { await navigator.clipboard.writeText(btn.dataset.copy); btn.textContent = '[ 已复制 ✓ ]'; }
  catch { btn.textContent = '[ 请手动复制 ]'; }
  btn.classList.add('done');
  setTimeout(() => { btn.textContent = label; btn.classList.remove('done'); }, 1800);
}));

// ---------- 结构树 ----------
const DOC = {
  skill: ['SKILL.md', '入口说明：怎么恢复、开工前读什么、十条铁律、当前进度与下一步。提到「小黑盒」「heybox」「传送门」「journey-4x」时自动加载。'],
  pref: ['reference/user-preferences.md', '必读。沟通习惯、审美红线、交互手感，以及每一次被纠正的误解，全部附上用户原话，方便判断边界。'],
  spec: ['reference/spec.md', '现状规格：章节表、颜色、开场时间线、滚动曲线、镜头航点、传送门参数。数值全部摘自源码。'],
  hist: ['reference/history.md', 'journey-21 到 43c 的每一步：用户要什么，做成了什么，为什么这样做，以及下一步的计划。'],
  arch: ['reference/architecture.md', '模块之间的调用关系、接口、宿主状态机、资源清单，以及写代码时的约定。'],
  work: ['reference/workflow.md', '每次改动的固定流程、测试里踩过的坑、文档怎么更新、GitHub Pages 怎么部署。'],
  restore: ['scripts/restore.sh', '校验快照 SHA-256，解压，按文件清单逐个比对，确认 sample 与 index 一致，最后初始化成首个 git 提交。'],
  regress: ['scripts/regress.mjs', 'headless 浏览器跑 22 项：3D 启动、一滑一段、触控板惯性、滚动响应、三个游戏进出、Esc 中途返回、手机，并生成逐帧拼图。'],
  check: ['scripts/final-check.mjs', '打包检查：语法、import 能否解析、有没有裸包依赖、sample.html 与 index.html 是否逐字节一致。'],
  cdp: ['scripts/cdp.mjs · sheet.mjs', '启动 headless Edge / Chrome 的 CDP 小工具，以及把多张截图拼成对比图的脚本。'],
  snap: ['assets/heybox-journey-43c.tar.gz', 'journey-43c 的逐字节快照，含 dist/、blender/ 与全部文档。恢复出来的结果与原项目 diff -rq 完全相同。']
};
const anPath = $('#an-path'), anText = $('#an-text');
let anKey = 'skill', anTimer = 0;
$$('.tree li[data-k]').forEach(li => {
  const pick = () => {
    if (li.dataset.k === anKey) return;
    anKey = li.dataset.k;
    $$('.tree li.on').forEach(x => x.classList.remove('on'));
    li.classList.add('on');
    anText.classList.add('swap');
    clearTimeout(anTimer);
    anTimer = setTimeout(() => { [anPath.textContent, anText.textContent] = DOC[anKey]; anText.classList.remove('swap'); }, 180);
  };
  li.addEventListener('mouseenter', pick);
  li.addEventListener('click', pick);
});
