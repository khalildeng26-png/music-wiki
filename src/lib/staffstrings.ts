/* 可拨五线谱 —— StaffLines.astro 的交互内核
   划过谱线即拨响(G 谱表 E4-G4-B4-D5-F5),拨弦位置决定音色(Karplus-Strong)。
   无障碍:聚焦后按 1-5 对应五条线;reduce-motion / 老内核 / 无 JS 不初始化,保持静态装饰。 */

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const PITCHES = [
  { name: "E4", f: 329.63 },
  { name: "G4", f: 392.0 },
  { name: "B4", f: 493.88 },
  { name: "D5", f: 587.33 },
  { name: "F5", f: 698.46 },
];

/* 与原静态版同款音符点缀:bottom 对齐谱线,符头「坐」在线上 */
const GLYPHS = [
  { frac: 0.08, line: 0, txt: "♪", size: 12, op: 1 },
  { frac: 0.36, line: 1, txt: "♫", size: 10, op: 0.8 },
  { frac: 0.62, line: 2, txt: "♩", size: 14, op: 0.9 },
];

const modeAmp = (k: number, p: number) => Math.sin(k * Math.PI * p) / Math.pow(k, 1.5);

interface StringState {
  amp: number;
  born: number; // 秒(与 performance.now()/1000 同时钟)
  pos: number; // 拨弦位置 0..1
  phases: number[];
}

interface StaffInstance {
  root: HTMLElement;
  cv: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  dpr: number;
  strings: StringState[];
  lastPY: number | null;
  /** 横向扫弦状态:上次指针 x、累计扫程(0..1 宽度)、扫动方向 */
  lastPX: number | null;
  sweepAcc: number;
  sweepDir: number;
  lineC: string;
  sigC: string;
  fontFamily: string;
  resize: () => void;
  redraw: (now: number) => void;
  refreshColors: () => void;
}

const instances: StaffInstance[] = [];
let rafOn = false;

function ensureLoop() {
  if (!rafOn) {
    rafOn = true;
    requestAnimationFrame(loop);
  }
}
function loop(ms: number) {
  const now = ms / 1000;
  let vibrating = false;
  for (const st of instances) {
    st.redraw(now);
    for (const s of st.strings) if (now - s.born < 2.4) vibrating = true;
  }
  if (vibrating) requestAnimationFrame(loop);
  else {
    rafOn = false;
    for (const st of instances) st.redraw(now); // 收尾:画回静态帧
  }
}

/* ── Karplus-Strong 物理建模拨弦 ─────────────────────────── */
let actx: AudioContext | null = null;
let master: GainNode | null = null;
function ensureAudio() {
  if (!actx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = 0.8;
    const limiter = actx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    master.connect(limiter);
    limiter.connect(actx.destination);
  }
  if (actx.state === "suspended") void actx.resume();
}

const ksCache = new Map<string, AudioBuffer>();
function ksPlay(freq: number, pos: number, vel: number) {
  ensureAudio();
  if (!actx || !master) return;
  const pq = (Math.round(pos * 8) / 8).toFixed(3); // 位置量化:防缓存无限膨胀
  const key = `${freq.toFixed(2)}|${pq}`;
  let buf = ksCache.get(key);
  if (!buf) {
    const sr = actx.sampleRate;
    const N = Math.max(2, Math.round(sr / freq));
    buf = actx.createBuffer(1, Math.floor(sr * 1.8), sr);
    const out = buf.getChannelData(0);
    const ring = new Float32Array(N);
    for (let i = 0; i < N; i++)
      ring[i] =
        (Math.random() * 2 - 1) *
        (0.55 + 0.45 * Math.sin((Math.PI * i) / N)) *
        (0.5 + 0.5 * Math.sin(Math.PI * +pq));
    const damp = clamp(0.9985 - freq / 90000, 0.994, 0.9985);
    let idx = 0;
    for (let i = 0; i < out.length; i++) {
      const a = ring[idx];
      const b = ring[(idx + 1) % N];
      out[i] = a;
      ring[idx] = damp * 0.5 * (a + b);
      idx = (idx + 1) % N;
    }
    ksCache.set(key, buf);
  }
  const src = actx.createBufferSource();
  src.buffer = buf;
  const gn = actx.createGain();
  gn.gain.value = 0.3 * clamp(vel, 0.3, 1.2);
  src.connect(gn);
  gn.connect(master);
  src.start();
}

/* ── 初始化:返回 dispose(React 包装可用;Astro 静态页忽略)── */
export function initStaffPlay(root: HTMLElement): () => void {
  /* reduce-motion / 老内核(与 BaseLayout 的 oklch 门槛一致)→ 保留静态装饰 */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const modern =
    typeof CSS !== "undefined" &&
    CSS.supports !== undefined &&
    CSS.supports("color", "oklch(0.7 0.1 200)");
  if (!modern) return () => {};

  const cv = document.createElement("canvas");
  const g = cv.getContext("2d");
  if (!g) return () => {};

  const st: StaffInstance = {
    root,
    cv,
    g,
    dpr: 1,
    strings: PITCHES.map(() => ({
      amp: 0,
      born: -9,
      pos: 0.5,
      phases: Array.from({ length: 6 }, () => Math.random() * TAU),
    })),
    lastPY: null,
    lastPX: null,
    sweepAcc: 0,
    sweepDir: 0,
    lineC: "",
    sigC: "",
    fontFamily: "",
    resize: () => {
      const r = root.getBoundingClientRect();
      st.dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(r.width * st.dpr));
      cv.height = Math.max(1, Math.round(r.height * st.dpr));
      st.redraw(performance.now() / 1000);
    },
    refreshColors: () => {
      const cs = getComputedStyle(root);
      st.lineC = cs.color; // 继承 text-signature/60 等调用方色彩与主题
      st.fontFamily = cs.fontFamily;
      const sig = getComputedStyle(document.documentElement).getPropertyValue("--signature").trim();
      st.sigC = sig || cs.color;
    },
    redraw: (now: number) => {
      const W = cv.width;
      const H = cv.height;
      if (!W || !H) return;
      g.clearRect(0, 0, W, H);
      const x0 = W * 0.01;
      const x1 = W * 0.99;
      const top = H * 0.1;
      const sp = (H * 0.8) / 4; // 五线:上下留 10%,中间均分
      for (let i = 0; i < 5; i++) {
        const s = st.strings[i];
        const age = now - s.born;
        const env = age < 0 ? 0 : Math.exp(-age * 1.7);
        const active = env > 0.02;
        const y = top + i * sp;
        const grad = g.createLinearGradient(x0, 0, x1, 0); // 左实右隐,同原静态版
        grad.addColorStop(0, active ? st.sigC : st.lineC);
        grad.addColorStop(1, "transparent");
        g.beginPath();
        const SEG = 56;
        for (let k = 0; k <= SEG; k++) {
          const xn = k / SEG;
          let yy = y;
          if (active)
            for (let m = 1; m <= 5; m++)
              yy +=
                s.amp *
                env *
                modeAmp(m, s.pos) *
                Math.sin(m * Math.PI * xn) *
                Math.cos(TAU * 1.15 * m * age + s.phases[m - 1]) *
                sp *
                0.34; // 振幅 ≤ 线距的 1/3:不越线
          const xx = x0 + (x1 - x0) * xn;
          if (k === 0) g.moveTo(xx, yy);
          else g.lineTo(xx, yy);
        }
        g.globalAlpha = active ? 0.5 + 0.5 * env : 1;
        g.lineWidth = (active ? 1.5 : 1) * st.dpr;
        g.strokeStyle = grad;
        g.stroke();
        if (active) {
          g.shadowColor = st.sigC;
          g.shadowBlur = 8 * env * st.dpr;
          g.stroke();
          g.shadowBlur = 0;
        }
        g.globalAlpha = 1;
      }
      /* 音符点缀:骑在谱线上,随线轻跳 */
      g.textAlign = "center";
      for (const gl of GLYPHS) {
        const s = st.strings[gl.line];
        const age = now - s.born;
        const env = age < 0 ? 0 : Math.exp(-age * 1.7);
        const y =
          top + gl.line * sp + 3.5 * st.dpr + (env > 0.02 ? Math.sin(age * 16) * env * 3 : 0);
        g.font = `${gl.size * st.dpr}px ${st.fontFamily}`;
        g.globalAlpha = gl.op * 0.9;
        g.fillStyle = st.lineC;
        g.fillText(gl.txt, x0 + (x1 - x0) * gl.frac, y);
        g.globalAlpha = 1;
      }
    },
  };

  const lineY = (i: number) => cv.height * 0.1 + (i * cv.height * 0.8) / 4;

  const pluck = (i: number, pos: number, vel: number) => {
    const s = st.strings[i];
    s.amp = clamp(0.5 + vel * 0.09, 0.5, 1.3);
    s.born = performance.now() / 1000;
    s.pos = clamp(pos, 0.06, 0.94);
    ksPlay(PITCHES[i].f, s.pos, 0.5 + vel * 0.07);
    ensureLoop();
  };

  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = ((e.clientY - r.top) / r.height) * cv.height;
    if (st.lastPY !== null && x > 0.01 && x < 0.99) {
      const dyN = (y - st.lastPY) / cv.height; // 归一化的纵向位移(每高度)
      // 纵向跨线:精确拨过线的那根(上下蹭)
      for (let i = 0; i < 5; i++) {
        const ly = lineY(i);
        if ((st.lastPY - ly) * (y - ly) < 0) pluck(i, x, Math.abs(y - st.lastPY));
      }
      // 横向扫弦:像拨片横掠,快扫慢扫都算——累计横程超过 1/3 宽度即触发一次,
      // 五根按扫动方向依次拨响;纵向为主的移动不计入(那是跨线拨弦的事)
      const dxN = x - (st.lastPX ?? x);
      if (Math.abs(dxN) > 0.0005 && Math.abs(dxN) > Math.abs(dyN) / 2) {
        const dir = Math.sign(dxN);
        if (dir === st.sweepDir) st.sweepAcc += Math.abs(dxN);
        else {
          st.sweepDir = dir;
          st.sweepAcc = Math.abs(dxN);
        }
        if (st.sweepAcc > 0.3) {
          const order = dir > 0 ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
          order.forEach((i, k) =>
            window.setTimeout(() => pluck(i, clamp(x, 0.06, 0.94), 8), k * 26),
          );
          st.sweepAcc = 0;
          st.sweepDir = 0;
        }
      }
    }
    st.lastPY = y;
    st.lastPX = x;
  };
  const onLeave = () => {
    st.lastPY = null;
    st.lastPX = null;
    st.sweepAcc = 0;
    st.sweepDir = 0;
  };
  const onDown = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = ((e.clientY - r.top) / r.height) * cv.height;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < 5; i++) {
      const d = Math.abs(y - lineY(i));
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    pluck(best, x, 8);
  };
  const onKey = (e: KeyboardEvent) => {
    const i = "12345".indexOf(e.key);
    if (i >= 0) {
      e.preventDefault();
      pluck(i, 0.3, 8);
    }
  };

  root.classList.add("staff-on");
  root.appendChild(cv);
  st.refreshColors();
  st.resize();
  instances.push(st);

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerdown", onDown);
  root.addEventListener("keydown", onKey);

  /* 主题切换:html.dark 变化时重读颜色 */
  const themeObs = new MutationObserver(() => {
    st.refreshColors();
    st.redraw(performance.now() / 1000);
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  const ro = new ResizeObserver(() => st.resize());
  ro.observe(root);

  st.redraw(performance.now() / 1000);

  return () => {
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    root.removeEventListener("pointerdown", onDown);
    root.removeEventListener("keydown", onKey);
    themeObs.disconnect();
    ro.disconnect();
    cv.remove();
    root.classList.remove("staff-on");
    const i = instances.indexOf(st);
    if (i >= 0) instances.splice(i, 1);
  };
}
