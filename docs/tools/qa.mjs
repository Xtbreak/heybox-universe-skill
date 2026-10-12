// 落地页自检：按滚动位置逐段截图，并收集控制台错误
// 用法：node tools/qa.mjs [地址] [输出目录] [宽] [高]
import {launch} from '../../scripts/cdp.mjs';
import fs from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:8031/';
const out = process.argv[3] || '/tmp/hb-site-qa';
const w = +(process.argv[4] || 1440), h = +(process.argv[5] || 900);
fs.mkdirSync(out, {recursive: true});
const sleep = ms => new Promise(r => setTimeout(r, ms));

const b = await launch({w, h, mobile: w < 600});
await b.send('Page.navigate', {url});
await sleep(500);
await b.shot(`${out}/00-loader.png`);
await sleep(1500);
await b.shot(`${out}/01-intro-draw.png`);
await sleep(900);
await b.shot(`${out}/02-intro-scan.png`);
await sleep(2400);
await b.shot(`${out}/03-hero.png`);

// 以元素为锚点，滚到各段的指定进度
const at = async (sel, p, name, wait = 900) => {
  await b.ev(`(()=>{const el=document.querySelector('${sel}');const top=el.getBoundingClientRect().top+scrollY;const span=Math.max(0,el.offsetHeight-innerHeight);scrollTo(0,top+span*${p})})()`);
  await sleep(wait);
  await b.shot(`${out}/${name}.png`);
};
await at('.numbers', 0, '06-numbers', 2000);
await at('.models', 0, '09-models-head', 1400);
await at('.md-view', 0, '10-models-0', 6000);
for (const i of [1, 3, 4, 5, 7]) {
  await b.ev(`document.querySelectorAll('.md-list button')[${i}].click()`);
  await sleep(i === 5 ? 9000 : 4500);
  await b.shot(`${out}/10-models-${i}.png`);
}
await at('.rules', 0, '11-rules', 1400);
await at('.flow', 0, '12-flow', 9000);
await at('#timeline', .1, '13-timeline-a', 600);
await at('#timeline', .9, '13-timeline-b', 600);
await at('.anatomy', 0, '14-anatomy', 1400);
await at('.finale', 0, '15-finale', 1400);
console.log(b.logs.filter(l => /EXC|error|NETFAIL|HTTP/i.test(l)).join('\n') || 'console clean');
b.close();
