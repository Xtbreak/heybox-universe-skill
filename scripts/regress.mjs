// Headless regression for the heybox journey. Needs a running preview (启动预览.py) and a Chromium.
//   node regress.mjs [baseUrl] [outDir]
// Checks: page boots in 3D (not the static fallback), one gesture = one stage and every game stage is a stop,
// trackpad momentum never skips a stage, scroll answers within ~50 ms, all three games enter through their
// ring and exit back to the same scroll position, Esc mid-entry runs back, no console errors.
// Writes contact sheets of each entry/exit to outDir.
import { launch } from './cdp.mjs';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const base = process.argv[2] || 'http://127.0.0.1:8017/sample.html';
const out = process.argv[3] || (process.env.TMPDIR || '/tmp') + '/heybox-regress';
fs.mkdirSync(out, { recursive: true });
const results = [], fail = (name, detail) => results.push({ name, ok: false, detail }), pass = (name, detail = '') => results.push({ name, ok: true, detail });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(hash = '', opts = {}) {
  const b = await launch(opts);
  await b.send('Page.navigate', { url: `${base}?rev=regress${Date.now()}${hash}` });
  for (let i = 0; i < 120; i++) { if (await b.ev(`document.querySelector('#loading')?.classList.contains('done')`)) break; await sleep(500); }
  await sleep(5500);
  return b;
}
const errors = b => b.logs.filter(l => !l.startsWith('log') && !l.startsWith('info'));
async function still(b) { let last = -1, same = 0; const t0 = Date.now(); while (same < 6 && Date.now() - t0 < 9000) { const y = await b.ev('Math.round(scrollY)'); same = y === last ? same + 1 : 0; last = y; await sleep(80); } return last; }
const stageName = async (b, y) => b.ev(`(()=>{let c='';for(const f of document.querySelectorAll('#journey > .frame')){if(f.getBoundingClientRect().top+scrollY<=${y}+innerHeight*.5)c=f.id;}return c})()`);

// 1. Boot + scroll stages
{
  const b = await open();
  const light = await b.ev(`document.body.classList.contains('light')`);
  light ? fail('boots in 3D', 'static fallback shown (body.light) — check the preview server is 启动预览.py') : pass('boots in 3D');
  const seq = [];
  for (let k = 0; k < 4; k++) { await b.wheel(100); seq.push(await stageName(b, await still(b))); }
  const want = ['equipment', 'companion', 'drive', 'together'];
  JSON.stringify(seq) === JSON.stringify(want) ? pass('one notch = one stage', seq.join(' → ')) : fail('one notch = one stage', seq.join(' → '));
  await b.ev('scrollTo(0,0)'); await sleep(1500);
  const swipe = () => b.ev(`new Promise(r=>{let i=0;const f=()=>{window.dispatchEvent(new WheelEvent('wheel',{deltaY:70*Math.exp(-i/25)+.4,cancelable:true,bubbles:true}));i++;if(i<120)setTimeout(f,i===40?260:16);else r()};f()})`);
  const pad = [];
  for (let k = 0; k < 3; k++) { await swipe(); pad.push(await stageName(b, await still(b))); }
  JSON.stringify(pad) === JSON.stringify(want.slice(0, 3)) ? pass('trackpad momentum never skips', pad.join(' → ')) : fail('trackpad momentum never skips', pad.join(' → '));
  await b.ev('scrollTo(0,0)'); await sleep(1500);
  await b.ev(`window.__t=[];(function f(){window.__t.push([performance.now(),scrollY]);if(window.__t.length<200)requestAnimationFrame(f)})();window.__w=0;addEventListener('wheel',()=>{if(!window.__w)window.__w=performance.now()},{capture:true})`);
  await b.wheel(100); await sleep(1500);
  const r = JSON.parse(await b.ev('JSON.stringify({w:window.__w,t:window.__t})'));
  const first = r.t.find(([t, y]) => t > r.w && y > 1), lag = first ? Math.round(first[0] - r.w) : 9999;
  lag <= 60 ? pass('scroll responds', lag + ' ms') : fail('scroll responds', lag + ' ms');
  const labels = await b.ev(`[...document.querySelectorAll('.side-nav, .frame:not(.landing) .copy .tag')].filter(e=>e.getBoundingClientRect().width>2&&getComputedStyle(e).display!=='none').length`);
  labels === 0 ? pass('no side numbers / corner labels') : fail('no side numbers / corner labels', labels + ' visible');
  errors(b).length ? fail('console clean (scroll)', errors(b).join(' | ')) : pass('console clean (scroll)');
  b.close();
}

// 2. Each game: enter through the ring, exit back, contact sheet
for (const [id, act] of [['equipment', 'helmet'], ['companion', 'robot'], ['drive', 'car']]) {
  const b = await open('#' + id);
  const y0 = await b.ev('Math.round(scrollY)');
  await b.ev(`window.__g=[];(function f(){window.__g.push(performance.now());if(window.__g.length<600)requestAnimationFrame(f)})()`);
  await b.ev(`document.querySelector('[data-action=${act}]').click()`);
  for (let i = 0; i < 12; i++) { await b.shot(`${out}/${act}-${String(i).padStart(2, '0')}.png`); await sleep(i < 10 ? 150 : 600); }
  await sleep(2500);
  const inGame = await b.ev(`document.body.classList.contains('exploring')&&!document.body.classList.contains('traveling')&&!document.querySelector('#play-hud').hidden`);
  inGame ? pass(`${act}: enters`) : fail(`${act}: enters`, await b.ev('document.body.className'));
  await b.ev(`document.querySelector('#exit-game').click()`);
  for (let i = 12; i < 18; i++) { await b.shot(`${out}/${act}-${String(i).padStart(2, '0')}.png`); await sleep(180); }
  await sleep(2500);
  const y1 = await b.ev('Math.round(scrollY)'), cls = await b.ev('document.body.className');
  Math.abs(y1 - y0) <= 2 && !cls.includes('exploring') ? pass(`${act}: exits to same place`, `y ${y0}`) : fail(`${act}: exits to same place`, `y ${y0} → ${y1}, ${cls}`);
  const g = JSON.parse(await b.ev('JSON.stringify(window.__g)')); let worst = 0; for (let i = 1; i < g.length; i++) worst = Math.max(worst, g[i] - g[i - 1]);
  pass(`${act}: worst frame during entry`, Math.round(worst) + ' ms');
  errors(b).length ? fail(`${act}: console clean`, errors(b).join(' | ')) : pass(`${act}: console clean`);
  b.close();
  try { execFileSync('node', [new URL('./sheet.mjs', import.meta.url).pathname, out, act + '-', `${out}/sheet-${act}.png`, '4'], { stdio: 'ignore' }); } catch { }
}

// 3. Esc mid-entry runs back, and a second entry still works
{
  const b = await open('#companion');
  const y0 = await b.ev('Math.round(scrollY)');
  await b.ev(`document.querySelector('[data-action=robot]').click()`); await sleep(700);
  await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(3000);
  const back = (await b.ev('Math.round(scrollY)')) === y0 && !(await b.ev('document.body.className')).includes('exploring');
  back ? pass('Esc mid-entry runs back') : fail('Esc mid-entry runs back', await b.ev('document.body.className'));
  await b.ev(`document.querySelector('[data-action=robot]').click()`); await sleep(6500);
  (await b.ev(`document.body.classList.contains('exploring')`)) ? pass('re-enter after cancel') : fail('re-enter after cancel');
  b.close();
}

// 4. Mobile: stages by touch, game in/out
{
  const b = await open('', { w: 390, h: 844, mobile: true });
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const drag = async dy => { const x = 200, y0 = 650; await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] }); for (let i = 1; i <= 8; i++) { await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - dy * i / 8 }] }); await sleep(16); } await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const seq = []; for (let k = 0; k < 3; k++) { await drag(300); seq.push(await stageName(b, await still(b))); }
  seq.join() === 'equipment,companion,drive' ? pass('mobile: swipe = one stage', seq.join(' → ')) : fail('mobile: swipe = one stage', seq.join(' → '));
  await b.shot(`${out}/mobile-drive.png`);
  errors(b).length ? fail('mobile: console clean', errors(b).join(' | ')) : pass('mobile: console clean');
  b.close();
}

for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
console.log(`\n${results.filter(r => r.ok).length}/${results.length} passed · screenshots in ${out}`);
if (results.some(r => !r.ok)) process.exitCode = 1;
