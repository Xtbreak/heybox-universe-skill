import {launch} from './cdp.mjs';import fs from 'node:fs';
// node sheet.mjs <dir> <prefix> <out.png> [cols] — tiles screenshots into one contact sheet.
const [dir,prefix,out,cols]=[process.argv[2],process.argv[3],process.argv[4],+process.argv[5]||4];
const files=fs.readdirSync(dir).filter(f=>f.startsWith(prefix)&&f.endsWith('.png')).sort();
const imgs=files.map(f=>'data:image/png;base64,'+fs.readFileSync(dir+'/'+f).toString('base64'));
const W=360,H=225,rows=Math.ceil(imgs.length/cols);
const b=await launch({w:W*cols,h:(H+18)*rows});
const html=`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${W}px);font:12px monospace;color:#fff">${imgs.map((s,i)=>`<div><img src="${s}" style="width:${W}px;height:${H}px;display:block"><div style="height:18px">${files[i].replace('.png','')}</div></div>`).join('')}</body>`;
const page=dir+'/.sheet.html';fs.writeFileSync(page,html);
await b.send('Page.navigate',{url:'file://'+page});await b.sleep(1500);
await b.shot(out);b.close();
