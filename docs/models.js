// 模型展台：滚动到附近才加载 Three.js；每个模型首次选中时下载并缓存
// 交互：拖动旋转（带惯性），松手后恢复缓慢自转；切换时旧模型收起、新模型弹出
const MODELS = [
  {name: '小黑盒', file: 'heybox-original-refined.glb', tris: '27.1k', size: '2.3 MB', by: '原创精修', lic: '项目自有'},
  {name: '曙光号', file: 'dawn-ship.glb', tris: '8.3k', size: '1.0 MB', by: 'Viktor Hahn · 改涂装', lic: 'CC BY 4.0', float: true},
  {name: '希波克拉底', file: 'flight-ship-v8.glb', tris: '12.4k', size: '0.7 MB', by: 'Viktor Hahn · 改涂装', lic: 'CC BY 4.0', float: true},
  {name: '破损头盔', file: 'DamagedHelmet.glb', tris: '15.5k', size: '3.8 MB', by: 'theblueturtle_ · ctxwing', lic: 'CC BY-NC 4.0', float: true},
  {name: '机器人', file: 'RobotExpressive.glb', tris: '3.2k', size: '0.5 MB', by: 'Tomás Laulhé', lic: 'CC0', anim: 'Idle'},
  {name: '玩具车', file: 'ToyCar.glb', tris: '108.9k', size: '5.4 MB', by: 'Guido Odendahl · Eric Chadwick', lic: 'CC0'},
  {name: '勤务手枪', file: 'fps-pistol.glb', tris: '9.5k', size: '0.5 MB', by: 'Mateusz Sadek · Poly Haven', lic: 'CC0', float: true},
  {name: '小人', file: 'players/character-male-a.glb', tris: '0.7k', size: '0.2 MB', by: 'Kenney', lic: 'CC0', anim: 'idle'}
];
const FIT = 3.2;       // 模型最长边统一缩放到的尺寸
const LIFT = 1.3;      // 悬浮模型的中心高度
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = s => document.querySelector(s);
const section = $('#models'), view = $('.md-view'), canvas = $('#md-gl');
const ui = {name: $('#md-name'), load: $('.md-load'), pct: $('#md-pct')};
const buttons = [...document.querySelectorAll('.md-list button')];

let T, loader, renderer, scene, camera, pivot, holder, ring, clock;
let started = false, visible = false, raf = 0;
let current = null, pending = null, phase = 'idle', k = 0, tIn = 0, token = 0, active = 0;
let yaw = .6, pitch = .12, yawVel = 0, dragging = false, lastX = 0, lastY = 0, lastT = 0;
const cache = new Map();

// ---------- 文字信息 ----------
function paintCaption(i) {
  const m = MODELS[i];
  ui.name.textContent = m.name;
  buttons.forEach((b, j) => b.classList.toggle('on', j === i));
  const cap = view.querySelector('.md-cap');
  cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
}

// ---------- 初始化（懒加载） ----------
async function init() {
  if (started) return; started = true;
  const [three, {GLTFLoader}, {RoomEnvironment}, {MeshoptDecoder}] = await Promise.all([
    import('./vendor/three.module.js'), import('./vendor/GLTFLoader.js'),
    import('./vendor/RoomEnvironment.js'), import('./vendor/meshopt_decoder.module.js')
  ]);
  T = three;
  loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

  renderer = new T.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .9;
  const key = new T.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 5); scene.add(key);
  const rim = new T.DirectionalLight(0x8fdcff, 2.4); rim.position.set(-5, 3, -4); scene.add(rim);

  camera = new T.PerspectiveCamera(30, 1, .1, 100);

  // 地面：柔和接触阴影 + 两道冰蓝光环
  const sh = document.createElement('canvas'); sh.width = sh.height = 128;
  const g = sh.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,.6)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const shadow = new T.Mesh(new T.PlaneGeometry(4.6, 4.6), new T.MeshBasicMaterial({map: new T.CanvasTexture(sh), transparent: true, depthWrite: false}));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
  ring = new T.Group();
  const ringMat = o => new T.MeshBasicMaterial({color: 0x8fdcff, transparent: true, opacity: o, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending});
  const r1 = new T.Mesh(new T.RingGeometry(2.05, 2.08, 160), ringMat(.75));
  const r2 = new T.Mesh(new T.RingGeometry(2.42, 2.43, 160), ringMat(.22));
  ring.add(r1, r2); ring.rotation.x = -Math.PI / 2; ring.position.y = .003; scene.add(ring);

  pivot = new T.Group(); holder = new T.Group();
  pivot.add(holder); scene.add(pivot);
  clock = new T.Clock();

  new ResizeObserver(resize).observe(view); resize();
  bindDrag();
  select(active, true);
  if (visible) loop();
}

function resize() {
  if (!renderer) return;
  const w = view.clientWidth, h = view.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // 窄屏时后退镜头，保证模型完整
  const back = 10 / Math.min(1, camera.aspect * 1.05);
  camera.position.set(0, 2.4, back);
  // 竖屏底部说明更高，视点下移让模型整体上移
  camera.lookAt(0, camera.aspect < 1 ? .85 : 1.45, 0);
  camera.updateProjectionMatrix();
}

// ---------- 加载与适配 ----------
function load(i) {
  if (cache.has(i)) return cache.get(i);
  const m = MODELS[i];
  const p = new Promise((res, rej) => loader.load('models/' + m.file, gltf => {
    const root = gltf.scene;
    root.traverse(o => { if (o.isMesh) { o.frustumCulled = false; } });
    // 统一尺寸，水平居中，底部贴地
    const box = new T.Box3().setFromObject(root), size = box.getSize(new T.Vector3());
    root.scale.multiplyScalar(FIT / Math.max(size.x, size.y, size.z));
    box.setFromObject(root);
    const c = box.getCenter(new T.Vector3()), hgt = box.max.y - box.min.y;
    root.position.sub(new T.Vector3(c.x, box.min.y, c.z));
    const wrap = new T.Group(); wrap.add(root);
    let mixer = null;
    if (m.anim && gltf.animations.length) {
      mixer = new T.AnimationMixer(root);
      const clip = gltf.animations.find(a => a.name === m.anim) || gltf.animations[0];
      mixer.clipAction(clip).play();
    }
    res({wrap, mixer, hgt, float: !!m.float});
  }, e => { if (i === active && e.total) ui.pct.textContent = Math.round(e.loaded / e.total * 100) + '%'; }, rej));
  cache.set(i, p);
  p.catch(() => cache.delete(i));
  return p;
}

function select(i, first = false) {
  active = i;
  paintCaption(i);
  if (!started) return;
  const my = ++token;
  ui.pct.textContent = '0%';
  const slow = setTimeout(() => my === token && ui.load.classList.add('on'), 120);
  load(i).then(obj => {
    if (my !== token) return;
    pending = obj;
    phase = 'out';
    if (first || !current) k = 0;
  }).catch(() => {
    if (my === token) ui.pct.textContent = '加载失败';
  }).finally(() => { clearTimeout(slow); if (my === token && ui.pct.textContent !== '加载失败') ui.load.classList.remove('on'); });
}

// ---------- 拖动旋转 ----------
function bindDrag() {
  canvas.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); yawVel = 0;
    canvas.setPointerCapture(e.pointerId); view.classList.add('grab');
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const now = performance.now(), dt = Math.max(1, now - lastT) / 1000;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    yaw += dx * .009;
    pitch = Math.min(.55, Math.max(-.3, pitch + dy * .005));
    yawVel = yawVel * .6 + (dx * .009 / dt) * .4;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
  const up = () => { dragging = false; view.classList.remove('grab'); };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
}

// ---------- 渲染循环 ----------
const easeOutBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function loop() {
  if (raf || !renderer) return;
  clock.getDelta();
  const frame = () => {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;

    // 切换：收起旧模型 → 换上新模型 → 带回弹地弹出
    if (phase === 'out') {
      k -= dt * 6;
      if (k <= 0) {
        k = 0;
        if (current) holder.remove(current.wrap);
        current = pending; pending = null;
        holder.add(current.wrap);
        phase = 'in'; tIn = 0;
      }
    } else if (phase === 'in') {
      tIn = Math.min(1, tIn + dt / .7);
      k = easeOutBack(tIn);
      if (tIn >= 1) phase = 'idle';
    }
    holder.scale.setScalar(Math.max(.0001, k));
    ring.scale.setScalar(1 + (1 - Math.min(1, k)) * .12);

    // 惯性衰减后并入自转；俯仰缓慢回正
    if (!dragging) {
      yawVel *= Math.exp(-dt * 3);
      yaw += (yawVel + (reduce ? 0 : .28)) * dt;
      pitch += (.12 - pitch) * Math.min(1, dt * 1.5);
    }
    if (current) {
      const h = current.hgt;
      const base = current.float ? LIFT : h / 2;
      pivot.position.y = base + (current.float && !reduce ? Math.sin(t * 1.3) * .07 : 0);
      current.wrap.position.y = -h / 2;
      current.mixer?.update(dt);
    }
    pivot.rotation.set(pitch, yaw, 0);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);
}

// ---------- 可见性：靠近时初始化，离开视口时暂停渲染 ----------
new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) init(); }, {rootMargin: '800px 0px'}).observe(section);
new IntersectionObserver(es => {
  visible = es.some(e => e.isIntersecting);
  if (visible) loop();
}).observe(view);

buttons.forEach((b, i) => b.addEventListener('click', () => { if (i !== active || !started) select(i); }));
