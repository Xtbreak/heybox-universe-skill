import {spawn} from 'node:child_process';import fs from 'node:fs';
// Any Chromium works. Override with BROWSER=/path/to/chrome.
const EDGE=process.env.BROWSER||['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
export async function launch({w=1440,h=900,mobile=false}={}){
  const port=9300+Math.floor(Math.random()*500);
  const p=spawn(EDGE,['--headless=new',`--remote-debugging-port=${port}`,'--user-data-dir='+(process.env.TMPDIR||'/tmp')+'/hbqa-prof'+port,`--window-size=${w},${h}`,'--enable-unsafe-swiftshader','--use-angle=metal','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required','about:blank'],{stdio:'ignore'});
  let ws;for(let i=0;i<60;i++){try{const l=await (await fetch(`http://127.0.0.1:${port}/json`)).json();const t=l.find(x=>x.type==='page');if(t){ws=t.webSocketDebuggerUrl;break}}catch{}await new Promise(r=>setTimeout(r,250))}
  const sock=new WebSocket(ws);await new Promise(r=>sock.onopen=r);let id=0;const pend=new Map(),logs=[],reqs=new Map();
  sock.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}else if(m.method==='Runtime.consoleAPICalled'){logs.push(m.params.type+': '+m.params.args.map(a=>a.value??a.description).join(' '))}else if(m.method==='Network.loadingFailed'){logs.push('NETFAIL '+m.params.requestId+' '+m.params.errorText+' '+(reqs.get(m.params.requestId)||''))}else if(m.method==='Network.requestWillBeSent'){reqs.set(m.params.requestId,m.params.request.url)}else if(m.method==='Network.responseReceived'&&m.params.response.status>=400){logs.push('HTTP '+m.params.response.status+' '+m.params.response.url)}else if(m.method==='Runtime.exceptionThrown'){logs.push('EXC: '+(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text))}};
  const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);sock.send(JSON.stringify({id:i,method,params}))});
  await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile});
  const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});if(r.result?.exceptionDetails)return 'ERR '+JSON.stringify(r.result.exceptionDetails.exception?.description);return r.result?.result?.value};
  const shot=async file=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(file,Buffer.from(r.result.data,'base64'));return file};
  const wheel=async(dy,x=w/2,y=h/2)=>send('Input.dispatchMouseEvent',{type:'mouseWheel',x,y,deltaX:0,deltaY:dy});
  const close=()=>{sock.close();p.kill()};
  return {send,ev,shot,wheel,close,logs,sleep:ms=>new Promise(r=>setTimeout(r,ms))};
}
