/* 月亮唱盘 —— 首页 Hero 播放器(站歌《橙月》)
   白天是黑胶唱机;入夜唱片化作月,水面垂星。内核与 docs/demos/site-moon-vinyl.html 同源。
   主题跟随站点 .dark 切换(MutationObserver);点击落针播放,再点抬针。 */

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── 盘面几何(单一真相源)────────────────────────────────
   白天是唱片、入夜是月亮,两者必须是同一个圆,切换才能无缝。
   R = 0.40W、cx = 0.44W:盘面左侧留 4%、右侧留 16% 余量,
   不会被画布边缘切掉(之前 cx=0.4W + R=0.438W 会把左边切掉一条)。
   盘心 y 用「画布中线再上提 0.0404 画布宽」表示 —— 这样无论画布多高,
   月盘在页面上的绝对位置都不变(画布加高只加水面,不挪月亮)。 */
/* 水线相对月盘下缘的下沉量(÷ 画布宽);0.0385 ≈ 20px @520 宽 */
const WATER_DROP = 0.0385;

const DISC_R = 0.4;
const DISC_CX = 0.46; /* 0.44→0.46:给月晕腾左侧空间(左缘到盘心 1.15R),
                          播放器整体左移 2% 补偿,月盘页面位置不变 */
const DISC_CY = 0.5;
const DISC_UP = 0.0404;
function discGeom(W: number, H: number) {
  return { R: W * DISC_R, cx: W * DISC_CX, cy: H * DISC_CY - W * DISC_UP };
}

/* 月面素材契约:public/moon-disc.webp 是透明底正方形、纯月盘无光晕,
   月面半径 = 图像半宽 × MOON_DISC_FRAC(见 scripts/_tmp/moon-asset.cjs)。
   月晕由 canvas 自绘,与唱片同层,不存在两个渲染维度。
   素材重新生成时,DISC_FRAC 和 VER 必须一起改 —— 版本号挂在 URL 上,
   否则浏览器可能拿着旧图按新比例画,月面缩一圈,露出底下的纯色唱片盘。 */
const MOON_DISC_FRAC = 0.9819;
const MOON_ASSET_VER = 8;

/* 站内曲目(可选):public/music/ 下放了音频文件,唱片机就播放它;
   文件不在 → 自动回退到合成版《橙月》,站点行为不变。
   授权进度见 docs/demos/riot-permission-email-draft.md(工单 #139871488) */
const TRACK_URL = "/music/ever-fall.mp3";

/* 播放总开关。曲目《Ever Fall》授权已批(Riot 工单 #139871488,2026-10-25
   回复:准许个人网站使用,含广告变现;批复原文存 docs/demos/riot-permission-email-draft.md)。
   public/music/ever-fall.mp3 存在 → 播放该曲并显示署名行;不存在 → 合成版《橙月》。 */
const PLAYBACK_ENABLED = true;

/* 唱臂动作耗时(秒):落针 / 抬针。音乐起播与唱臂落盘对齐同一时刻,
   听感与画面才对得上;补间用显式时长,与帧率无关。 */
const ARM_LAND = 0.62;
const ARM_LIFT = 0.5;

/* ── 主题 token(站点变量 + 固定色板)───────────────────── */
type ThemeVars = {
  dark: boolean;
  bg: string;
  line: string;
  gold: string;
  deep: string;
  moon1: string;
  moon2: string;
  moon3: string;
  sheen: string;
  groove: string;
  chrome1: string;
  chrome2: string;
  edgeHi: string;
  edgeLo: string;
};
const rootEl = document.documentElement;
let V: ThemeVars = readVars();
/* 把 CSS 颜色(如 oklch())解析成 canvas fillStyle 一定认的 rgb():
   部分 canvas 实现不解析 oklch,赋值被静默忽略、沿用旧值 → 水面被填成米白 */
function resolveCssColor(raw: string): string {
  const probe = document.createElement("div");
  probe.style.display = "none";
  probe.style.color = raw;
  document.body.appendChild(probe);
  const out = getComputedStyle(probe).color;
  probe.remove();
  return out.startsWith("rgb") ? out : raw;
}
function readVars(): ThemeVars {
  const cs = getComputedStyle(rootEl);
  const dark = rootEl.classList.contains("dark");
  return {
    dark,
    bg: resolveCssColor(cs.getPropertyValue("--background").trim()),
    line: dark ? "#f2b04c" : "#b06d2c",
    gold: dark ? "#f8cc7d" : "#c8873a",
    deep: dark ? "#c8873a" : "#a4652a",
    moon1: dark ? "#f8e6b8" : "#f6cf87",
    moon2: dark ? "#f2b04c" : "#eda93f",
    moon3: dark ? "#a96f2d" : "#c8873a",
    sheen: dark ? "rgba(255,242,210,0.13)" : "rgba(255,250,235,0.45)",
    groove: dark ? "rgba(248,226,174,0.1)" : "rgba(120,72,20,0.14)",
    chrome1: dark ? "#c9ccd4" : "#f2efe6",
    chrome2: dark ? "#5a5e68" : "#8d887a",
    edgeHi: dark ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.6)",
    edgeLo: dark ? "rgba(0,0,0,0.5)" : "rgba(90,70,40,0.35)",
  };
}

/* ═══《橙月》总谱(与演示页同源)════════════════════════ */
const BPM = 66,
  SPB = 60 / BPM,
  BARS = 16,
  BEATS = BARS * 4;

interface ChordDef {
  root: number;
  notes: number[];
}
const CHORDS: ChordDef[] = [
  { root: 0, notes: [4, 7, 11, 16] }, // Cmaj7
  { root: 5, notes: [9, 12, 16, 21] }, // Fmaj7
  { root: 9, notes: [9, 12, 16, 19] }, // Am7
  { root: 7, notes: [7, 11, 14, 17] }, // G7
  { root: 5, notes: [9, 12, 16, 21] },
  { root: 0, notes: [4, 7, 11, 16] },
  { root: 2, notes: [5, 9, 12, 17] }, // Dm7
  { root: 7, notes: [7, 11, 14, 17] },
  { root: 9, notes: [9, 12, 16, 19] }, // B 段起
  { root: 4, notes: [4, 7, 11, 14] }, // Em7
  { root: 5, notes: [9, 12, 16, 21] },
  { root: 7, notes: [7, 11, 14, 17] },
  { root: 0, notes: [4, 7, 11, 16] }, // A' 段
  { root: 5, notes: [9, 12, 16, 21] },
  { root: 9, notes: [9, 12, 16, 19] },
  { root: 7, notes: [7, 11, 14, 17] }, // → 接回开头
];

const MELODY: number[][] = [
  [0, 0, 1.5, 16],
  [0, 1.5, 0.5, 19],
  [0, 2, 2, 21],
  [1, 0, 1, 19],
  [1, 1, 1, 16],
  [1, 2, 2, 14],
  [2, 0, 1.5, 12],
  [2, 1.5, 0.5, 14],
  [2, 2, 1, 16],
  [2, 3, 1, 19],
  [3, 0, 2, 16],
  [3, 2, 1, 14],
  [3, 3, 1, 12],
  [4, 0, 1.5, 9],
  [4, 1.5, 0.5, 12],
  [4, 2, 1.5, 14],
  [4, 3.5, 0.5, 16],
  [5, 0, 3, 14],
  [5, 3.5, 0.5, 12],
  [6, 0, 1, 12],
  [6, 1, 1, 14],
  [6, 2, 1, 16],
  [6, 3, 1, 19],
  [7, 0, 2, 21],
  [7, 2, 1, 19],
  [7, 3, 1, 16],
  [8, 0, 1, 9],
  [8, 1, 1, 12],
  [8, 2, 2, 16],
  [9, 0, 1.5, 14],
  [9, 1.5, 0.5, 12],
  [9, 2, 2, 9],
  [10, 0, 1, 12],
  [10, 1, 0.5, 14],
  [10, 1.5, 0.5, 16],
  [10, 2, 1, 19],
  [10, 3, 1, 16],
  [11, 0, 3, 14],
  [11, 3, 1, 12],
  [12, 0, 1.5, 16],
  [12, 1.5, 0.5, 19],
  [12, 2, 2, 21],
  [13, 0, 1, 19],
  [13, 1, 1, 16],
  [13, 2, 2, 14],
  [14, 0, 1.5, 12],
  [14, 1.5, 0.5, 14],
  [14, 2, 1, 16],
  [14, 3, 1, 19],
  [15, 0, 3.5, 12],
];

interface ScoreEvent {
  t: number;
  semi?: number;
  len?: number;
  vel?: number;
  kind: string;
  notes?: number[];
}
const EVENTS: ScoreEvent[] = [];
for (const [bar, beat, len, semi] of MELODY as [number, number, number, number][]) {
  const t = bar * 4 + beat;
  EVENTS.push({ t, semi, len, vel: 1, kind: "mel" });
  if (bar >= 8 && bar < 12)
    // 卡农:高八度、迟两拍
    EVENTS.push({ t: t + 2, semi: semi + 12, len, vel: 0.34, kind: "canon" });
}
for (const [bar, beat, semi] of [
  [7, 3.5, 31],
  [11, 3.5, 33],
] as [number, number, number][])
  EVENTS.push({ t: bar * 4 + beat, semi, len: 2, vel: 0.3, kind: "spark" });
CHORDS.forEach((ch, bar) => {
  EVENTS.push({ t: bar * 4, kind: "pad", notes: ch.notes, len: 4, vel: 1 });
  EVENTS.push({ t: bar * 4, kind: "bass", semi: ch.root - 24, len: 3, vel: 1 });
  if (bar % 4 === 3)
    EVENTS.push({ t: bar * 4 + 2.5, kind: "bass", semi: ch.root + 7 - 24, len: 1.2, vel: 0.6 });
});
EVENTS.sort((a, b) => a.t - b.t);

/* ═══ 音频引擎 ═══════════════════════════════════════════ */
let actx: AudioContext | null = null;
let master: GainNode | null = null;
let songBus: GainNode | null = null;
let conv: ConvolverNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let analyser: AnalyserNode | null = null;
let spec: Uint8Array | null = null;
/* 曲目(外置音频)链:MediaElementSource → 分析器(视觉用)+ 终端 */
let trackAnalyser: AnalyserNode | null = null;
let trackSpec: Uint8Array | null = null;
const nowA = () => (actx ? actx.currentTime : 0);
function ensureAudio() {
  if (!actx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = 0.9;
    const limiter = actx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.55;
    spec = new Uint8Array(analyser.frequencyBinCount);
    master.connect(analyser);
    analyser.connect(limiter);
    limiter.connect(actx.destination);
    conv = actx.createConvolver();
    const irLen = Math.floor(actx.sampleRate * 1.8);
    const ir = actx.createBuffer(2, irLen, actx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
    }
    conv.buffer = ir;
    const wet = actx.createGain();
    wet.gain.value = 0.24;
    conv.connect(wet);
    wet.connect(master);
    const nLen = Math.floor(actx.sampleRate * 0.25);
    noiseBuf = actx.createBuffer(1, nLen, actx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
  }
  if (actx.state === "suspended") void actx.resume();
}
const F = (semi: number) => 261.63 * Math.pow(2, semi / 12);
function busConnect(node: AudioNode) {
  if (!songBus || !conv) return;
  node.connect(songBus);
  node.connect(conv);
}
function bellPlay(semi: number, at: number, vel: number, dur: number) {
  if (!actx) return;
  const f = F(semi);
  for (const [mul, amp] of [
    [1, 1],
    [2, 0.34],
    [3, 0.14],
  ] as [number, number][]) {
    const o = actx.createOscillator();
    o.type = "sine";
    o.frequency.value = f * mul;
    if (mul === 2) o.detune.value = 4;
    const gn = actx.createGain();
    gn.gain.setValueAtTime(0.0001, at);
    gn.gain.exponentialRampToValueAtTime(0.16 * vel * amp, at + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, at + Math.min(dur * SPB + 1.1, 3.2));
    busConnect(gn);
    o.connect(gn);
    o.start(at);
    o.stop(at + Math.min(dur * SPB + 1.2, 3.3));
  }
}
function padPlay(notes: number[], at: number, vel: number) {
  if (!actx) return;
  for (const semi of notes) {
    const f = F(semi);
    for (const [type, det, amp] of [
      ["sine", 0, 1],
      ["triangle", 6, 0.32],
    ] as [OscillatorType, number, number][]) {
      const o = actx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = det;
      const gn = actx.createGain();
      gn.gain.setValueAtTime(0.0001, at);
      gn.gain.linearRampToValueAtTime(0.028 * vel * amp, at + 0.9);
      gn.gain.setValueAtTime(0.028 * vel * amp, at + 3.4 * SPB - 0.4);
      gn.gain.linearRampToValueAtTime(0.0001, at + 4 * SPB + 0.6);
      busConnect(gn);
      o.connect(gn);
      o.start(at);
      o.stop(at + 4 * SPB + 0.7);
    }
  }
}
function bassPlay(semi: number, at: number, vel: number) {
  if (!actx) return;
  const o = actx.createOscillator();
  o.type = "sine";
  o.frequency.value = F(semi);
  const o2 = actx.createOscillator();
  o2.type = "triangle";
  o2.frequency.value = F(semi) * 2;
  const g2 = actx.createGain();
  g2.gain.value = 0.18;
  const gn = actx.createGain();
  gn.gain.setValueAtTime(0.0001, at);
  gn.gain.linearRampToValueAtTime(0.13 * vel, at + 0.06);
  gn.gain.exponentialRampToValueAtTime(0.0001, at + 3 * SPB);
  busConnect(gn);
  o.connect(gn);
  o2.connect(g2);
  g2.connect(gn);
  o.start(at);
  o.stop(at + 3 * SPB + 0.1);
  o2.start(at);
  o2.stop(at + 3 * SPB + 0.1);
}
function crackle(at: number, big: boolean) {
  if (!actx || !noiseBuf || !songBus) return;
  const src = actx.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = big ? 0.5 : 0.7 + Math.random() * 0.6;
  const hp = actx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = big ? 300 : 1400;
  const gn = actx.createGain();
  gn.gain.setValueAtTime(big ? 0.03 : 0.004 + Math.random() * 0.009, at);
  gn.gain.exponentialRampToValueAtTime(0.0001, at + (big ? 0.05 : 0.02));
  src.connect(hp);
  hp.connect(gn);
  gn.connect(songBus);
  src.start(at);
  src.stop(at + 0.08);
}
function needleThunk(at: number) {
  if (!actx || !songBus) return;
  crackle(at, true);
  const o = actx.createOscillator();
  o.type = "sine";
  o.frequency.value = 68;
  const gn = actx.createGain();
  gn.gain.setValueAtTime(0.12, at);
  gn.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
  o.connect(gn);
  gn.connect(songBus);
  o.start(at);
  o.stop(at + 0.2);
}

/* ═══ 组件初始化 ═════════════════════════════════════════ */
interface NoteItem {
  x: number;
  y: number;
  vy: number;
  amp: number;
  sf: number;
  ph: number;
  size: number;
  glyph: string;
  col: string;
  age: number;
  life: number;
}
interface RippleItem {
  born: number;
  x: number;
  y: number;
  small: boolean;
}
interface WaterRipple {
  x: number;
  born: number;
}

export function initVinylPlayer(canvas: HTMLCanvasElement): () => void {
  const g = canvas.getContext("2d");
  if (!g) return () => {};
  const statusEl = canvas.parentElement?.querySelector<HTMLElement>(".vinyl-status") ?? null;

  /* 月面素材:直接画进 canvas,和唱盘圆严丝合缝 —— 昼夜切换即「唱片化月」。
     先缓存到离屏画布,避免每帧重解码一张 900×900 的 webp。 */
  const moonImg = new Image();
  moonImg.decoding = "async";
  moonImg.src = `/moon-disc.webp?v=${MOON_ASSET_VER}`;
  let moonLayer: HTMLCanvasElement | null = null;
  let moonLayerSide = 0;
  function moonFor(side: number): HTMLCanvasElement | null {
    if (!moonImg.complete || !moonImg.naturalWidth) return null;
    if (!moonLayer) moonLayer = document.createElement("canvas");
    if (moonLayerSide !== side || moonLayer.width !== side) {
      moonLayer.width = side;
      moonLayer.height = side;
      const c = moonLayer.getContext("2d");
      if (c) c.drawImage(moonImg, 0, 0, side, side);
      moonLayerSide = side;
    }
    return moonLayer;
  }

  /* 可选外置曲目:文件加载成功才启用,加载失败静默回退到合成曲 */
  const trackAudio = new Audio();
  trackAudio.loop = true;
  trackAudio.preload = "auto";
  let trackSrcNode: MediaElementAudioSourceNode | null = null;
  let trackReady = false;
  let trackFade: number | null = null;
  trackAudio.addEventListener("canplaythrough", () => {
    trackReady = true;
    /* 文件就位后,播放器下方亮出署名行 */
    canvas.parentElement?.querySelector<HTMLElement>(".vinyl-credit")?.removeAttribute("hidden");
  }, { once: true });
  if (PLAYBACK_ENABLED) {
    fetch(TRACK_URL, { method: "HEAD" })
      .then((r) => {
        if (r.ok) trackAudio.src = TRACK_URL;
      })
      .catch(() => {});
  }

  const vinyl = {
    armK: 0,
    armFrom: 0,
    armTo: 0,
    armT0: -1,
    armDur: 1,
    lastProg: 0,
    nrS: 0.56,
    rpm: 0.02,
    angle: 0,
    lastT: 0,
    dt: 0.016,
    burst: false,
    nx: 0,
    ny: 0,
    nightK: 0,
    noteQ: [] as { at: number; kind: string; vel: number; len: number }[],
    ripples: [] as RippleItem[],
    eS: 0,
    noteAt: 0,
    lastBeat: -1,
    waterRipples: [] as WaterRipple[],
    _wLast: 0,
    _wInt: 2.5,
  };
  const notes: NoteItem[] = [];
  const transport = {
    playing: false,
    loopStart: 0,
    evIdx: 0,
    timer: 0,
    hiss: null as AudioBufferSourceNode | null,
    trackMode: false,
  };

  function spawnNote(delay: number, kind = "mel", vel = 1, len = 1) {
    const s = canvas.width / 640;
    const canon = kind === "canon";
    const size =
      (kind === "spark" ? 9 : 12 + len * 4.5 + vel * 5) * (canon ? 0.72 : 1) * s +
      Math.random() * 6 * s;
    notes.push({
      x: vinyl.nx + (Math.random() - 0.5) * 12 * s,
      y: vinyl.ny - 8 * s,
      vy: (26 + Math.random() * 18) * s,
      amp: (7 + Math.random() * 9) * s,
      sf: 1 + Math.random() * 1.2,
      ph: Math.random() * TAU,
      size,
      glyph: ["♪", "♫", "♬", "♩"][(Math.random() * 4) | 0],
      col: canon
        ? V.dark
          ? "#f2b04c"
          : "#8d5a20"
        : Math.random() < 0.8
          ? V.dark
            ? "#f8cc7d"
            : "#b06d2c"
          : V.dark
            ? "#f2b04c"
            : "#8d5a20",
      age: -delay,
      life: (canon ? 2.6 : 3) + Math.random() * 1.4,
    });
  }

  function chromeDot(x: number, y: number, r: number) {
    const cg = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    cg.addColorStop(0, V.chrome1);
    cg.addColorStop(1, V.chrome2);
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fillStyle = cg;
    g.fill();
    g.strokeStyle = V.edgeLo;
    g.lineWidth = 0.8;
    g.stroke();
  }

  /* ── 走带 ──────────────────────────────────────────────── */
  function scheduleWindow() {
    if (!actx) return;
    const horizon = actx.currentTime + 0.4;
    while (true) {
      const ev = EVENTS[transport.evIdx];
      const at = transport.loopStart + ev.t * SPB;
      if (at > horizon) break;
      if (at >= actx.currentTime - 0.05) {
        if (ev.kind === "mel" || ev.kind === "canon") {
          bellPlay(ev.semi ?? 0, at, ev.vel ?? 1, ev.len ?? 1);
          vinyl.noteQ.push({ at, kind: ev.kind, vel: ev.vel ?? 1, len: ev.len ?? 1 });
        } else if (ev.kind === "spark") {
          bellPlay(ev.semi ?? 0, at, (ev.vel ?? 1) * 0.5, ev.len ?? 1);
          vinyl.noteQ.push({ at, kind: "spark", vel: ev.vel ?? 1, len: ev.len ?? 1 });
        } else if (ev.kind === "pad") padPlay(ev.notes ?? [], at, ev.vel ?? 1);
        else if (ev.kind === "bass") bassPlay(ev.semi ?? 0, at, ev.vel ?? 1);
      }
      transport.evIdx++;
      if (transport.evIdx >= EVENTS.length) {
        transport.evIdx = 0;
        transport.loopStart += BEATS * SPB;
      }
    }
    let cAt = actx.currentTime;
    while (cAt < horizon) {
      if (Math.random() < 0.8) crackle(cAt + Math.random() * 0.2, false);
      cAt += 0.12 + Math.random() * 0.3;
    }
  }
  function startSong() {
    ensureAudio();
    if (!actx || !master) return;
    songBus = actx.createGain();
    songBus.gain.value = 1;
    songBus.connect(master);
    const t = actx.currentTime;
    transport.playing = true;
    transport.trackMode = trackReady;
    /* 唱臂落盘与音乐起播同一时刻:起播 = 落针耗时之后 */
    transport.loopStart = t + ARM_LAND;
    transport.evIdx = 0;
    needleThunk(t + ARM_LAND - 0.05);
    /* 唱臂补间:0 → 1,耗时 ARM_LAND */
    vinyl.armFrom = vinyl.armK;
    vinyl.armTo = 1;
    vinyl.armT0 = performance.now() / 1000;
    vinyl.armDur = ARM_LAND;
    if (trackFade !== null) {
      /* 上一次抬针的渐出还没走完就再次落针:终止渐出,音量复位 */
      window.clearInterval(trackFade);
      trackFade = null;
      trackAudio.volume = 1;
    }
    const hiss = actx.createBufferSource();
    hiss.buffer = noiseBuf;
    hiss.loop = true;
    const lp = actx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    const hg = actx.createGain();
    hg.gain.value = 0.004;
    hiss.connect(lp);
    lp.connect(hg);
    hg.connect(songBus);
    hiss.start(t + ARM_LAND); /* 唱针落到盘面,底噪随之而起 */
    transport.hiss = hiss;
    if (transport.trackMode) {
      /* 站内曲目模式:落针到位 → 音频从头播放;不放合成音。
         同时把音频接进分析器 —— 音符/盘缘辉光跟真实音乐的能量走。 */
      try {
        if (!trackSrcNode && actx) {
          trackSrcNode = actx.createMediaElementSource(trackAudio);
          trackAnalyser = actx.createAnalyser();
          trackAnalyser.fftSize = 2048;
          trackAnalyser.smoothingTimeConstant = 0.55;
          trackSpec = new Uint8Array(trackAnalyser.frequencyBinCount);
          trackSrcNode.connect(actx.destination);
          trackSrcNode.connect(trackAnalyser);
        }
      } catch {
        /* 接不进音频图就退化为无能量反馈 */
      }
      window.setTimeout(() => {
        if (!transport.playing) return;
        trackAudio.currentTime = 0;
        trackAudio.play().catch(() => {});
      }, ARM_LAND * 1000);
    } else {
      transport.timer = window.setInterval(scheduleWindow, 90);
      scheduleWindow();
    }
  }
  function stopSong() {
    if (!transport.playing || !actx) return;
    transport.playing = false;
    window.clearInterval(transport.timer);
    const t = actx.currentTime;
    if (songBus) {
      songBus.gain.setValueAtTime(songBus.gain.value, t);
      songBus.gain.linearRampToValueAtTime(0, t + ARM_LIFT);
    }
    const hiss = transport.hiss;
    window.setTimeout(() => {
      try {
        hiss?.stop();
      } catch {
        /* 已停 */
      }
    }, ARM_LIFT * 1000 + 120);
    if (transport.trackMode && !trackAudio.paused) {
      /* 曲目音量渐出后暂停;期间再次落针由 trackFade 守卫复位 */
      trackFade = window.setInterval(() => {
        trackAudio.volume = Math.max(0, trackAudio.volume - 0.08);
        if (trackAudio.volume <= 0.001) {
          window.clearInterval(trackFade);
          trackFade = null;
          trackAudio.pause();
          trackAudio.currentTime = 0;
          trackAudio.volume = 1;
        }
      }, 60);
    }
    needleThunk(t + 0.04);
    /* 唱臂抬起:1 → 0,耗时 ARM_LIFT */
    vinyl.armFrom = vinyl.armK;
    vinyl.armTo = 0;
    vinyl.armT0 = performance.now() / 1000;
    vinyl.armDur = ARM_LIFT;
  }

  /* ── 绘制 ──────────────────────────────────────────────── */
  function drawDisc(t: number) {
    const W = canvas.width,
      H = canvas.height;
    if (!W) return;
    const playing = transport.playing;
    const nk = vinyl.nightK;
    const { R, cx, cy } = discGeom(W, H);
    g.clearRect(0, 0, W, H);
    const spinA = vinyl.angle;
    let prog = 0;
    if (playing && actx) {
      const ph = (actx.currentTime - transport.loopStart) / (BEATS * SPB);
      prog = ph >= 0 ? ph % 1 : 0;
      vinyl.lastProg = prog;
    }
    let beatPh = 0;
    if (playing && actx) {
      const b = (actx.currentTime - transport.loopStart) / SPB;
      if (b >= 0) beatPh = b % 1;
    }
    const pulse = playing ? Math.pow(1 - beatPh, 1.6) : 0;

    /* 盘体 + 唱纹 + 高光:白天画唱片,入夜交叉淡化成月。
       唱片随 nk 淡出、月面随 nk 淡入 —— 若唱片保持全不透明,
       过渡时素材外缘的淡色会透出底下的纯色唱片盘,
       看起来就像月亮背后套着一圈更大的平面黄月亮。 */
    if (nk < 0.999) {
      g.globalAlpha = 1 - nk;
      /* 盘体 */
      const disc = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
      disc.addColorStop(0, V.dark ? "#f8cc7d" : "#fbd68f");
      disc.addColorStop(0.55, V.dark ? "#e0a544" : "#ecb25a");
      disc.addColorStop(0.85, V.dark ? "#9a6a24" : "#d09136");
      disc.addColorStop(1, V.dark ? "#6b4718" : "#c8873a");
      g.beginPath();
      g.arc(cx, cy, R, 0, TAU);
      g.fillStyle = disc;
      g.fill();

      g.save();
      g.beginPath();
      g.arc(cx, cy, R, 0, TAU);
      g.clip();
      const grooveFade = 1 - nk * 0.85;
      for (let rr = R * 0.42; rr < R * 0.965; rr += 2) {
        const a = (0.12 + 0.04 * Math.sin(rr * 0.55)) * grooveFade;
        if (a < 0.008) break;
        g.beginPath();
        g.arc(cx, cy, rr, 0, TAU);
        g.strokeStyle = V.dark ? `rgba(248,226,174,${a})` : `rgba(120,72,20,${a * 1.4})`;
        g.lineWidth = 1;
        g.stroke();
        g.beginPath();
        g.arc(cx, cy, rr + 1, 0, TAU);
        g.strokeStyle = V.dark ? `rgba(22,14,6,${a * 0.3})` : `rgba(60,36,10,${a * 0.35})`;
        g.lineWidth = 1;
        g.stroke();
        g.globalAlpha = 1;
      }
      for (const k of [0.56, 0.73, 0.89]) {
        for (const [off, al] of [
          [0, 0.2],
          [2.6, 0.13],
        ] as [number, number][]) {
          g.beginPath();
          g.arc(cx, cy, R * k + off, 0, TAU);
          g.strokeStyle = V.dark ? `rgba(248,226,174,${al})` : `rgba(110,66,18,${al})`;
          g.lineWidth = 1.2;
          g.stroke();
        }
      }
      const hl = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      hl.addColorStop(0, "transparent");
      hl.addColorStop(0.16, "transparent");
      hl.addColorStop(0.3, V.dark ? "rgba(255,244,214,0.13)" : "rgba(255,250,232,0.26)");
      hl.addColorStop(0.46, "transparent");
      hl.addColorStop(0.6, "transparent");
      hl.addColorStop(0.74, V.dark ? "rgba(255,244,214,0.13)" : "rgba(255,250,232,0.26)");
      hl.addColorStop(0.88, "transparent");
      g.fillStyle = hl;
      g.fillRect(cx - R, cy - R, R * 2, R * 2);
      if (g.createConicGradient) {
        const cg = g.createConicGradient(spinA, cx, cy);
        cg.addColorStop(0, "transparent");
        cg.addColorStop(0.12, V.sheen);
        cg.addColorStop(0.25, "transparent");
        cg.addColorStop(0.55, "transparent");
        cg.addColorStop(0.67, V.sheen);
        cg.addColorStop(0.8, "transparent");
        g.fillStyle = cg;
        g.fillRect(cx - R, cy - R, R * 2, R * 2);
        g.restore();
      }

      /* 盘缘(随唱片一同淡出) */
      g.globalAlpha = 1 - nk;
      g.beginPath();
      g.arc(cx, cy, R, 0, TAU);
      g.strokeStyle = V.line;
      g.lineWidth = 1.4;
      g.stroke();
      g.globalAlpha = 1;
      if (playing && vinyl.eS > 0.02) {
        g.beginPath();
        g.arc(cx, cy, R + 4, 0, TAU);
        g.strokeStyle = `rgba(248,204,125,${(0.08 + vinyl.eS * 0.4) * (1 - nk)})`;
        g.lineWidth = 1.5 + vinyl.eS * 2.5;
        g.stroke();
      }
    } /* 结束:盘体+唱纹+高光 块 */

    /* 入夜:月晕 + 月面。月晕 canvas 自绘、衬在月面之下,与唱片同层。
       峰值透明度刻意压到 0.13 —— 上一版 0.3 会被看成"黄壳子";
       外缘收在 1.08R(画布左缘在 1.1R),不会被切出硬边。 */
    if (nk > 0.001) {
      const glow = g.createRadialGradient(cx, cy, R * 0.995, cx, cy, R * 1.14);
      glow.addColorStop(0, `rgba(255,200,112,${0.3 * nk})`);
      glow.addColorStop(0.4, `rgba(250,172,80,${0.14 * nk})`);
      glow.addColorStop(1, "rgba(240,150,40,0)");
      g.fillStyle = glow;
      g.beginPath();
      g.arc(cx, cy, R * 1.14, 0, TAU);
      g.fill();

      const side = Math.ceil((2 * R) / MOON_DISC_FRAC);
      const layer = moonFor(side);
      if (layer) {
        g.globalAlpha = nk;
        g.drawImage(layer, cx - side / 2, cy - side / 2, side, side);
        g.globalAlpha = 1;
      }
    }

    /* 标签:无字净面(入夜随月亮显影而完全隐去,只留一条极淡轮廓) */
    const labFade = 1 - nk;
    g.globalAlpha = labFade;
    const LR = R * 0.3;
    const lab = g.createRadialGradient(cx - LR * 0.3, cy - LR * 0.3, 2, cx, cy, LR);
    lab.addColorStop(0, V.moon1);
    lab.addColorStop(1, V.moon2);
    g.beginPath();
    g.arc(cx, cy, LR, 0, TAU);
    g.fillStyle = lab;
    g.fill();
    g.strokeStyle = V.deep;
    g.lineWidth = 1.2;
    g.stroke();
    g.beginPath();
    g.arc(cx + Math.cos(spinA) * LR * 0.82, cy + Math.sin(spinA) * LR * 0.82, 2.6, 0, TAU);
    g.fillStyle = "#5a3c12";
    g.fill();
    g.beginPath();
    g.arc(cx, cy, LR * 0.66, 0, TAU);
    g.strokeStyle = "rgba(90,60,18,0.4)";
    g.lineWidth = 1;
    g.stroke();
    /* 夜里:留一道极淡的唱片轮廓残影,标记"这曾是唱片" */
    if (nk > 0.001) {
      g.globalAlpha = nk * 0.1;
      g.beginPath();
      g.arc(cx, cy, R * 0.3, 0, TAU);
      g.strokeStyle = V.moon1;
      g.lineWidth = 1;
      g.stroke();
    }
    /* 主轴孔:随标签一起淡出(残影块把 alpha 改成了 nk*0.1,
       之前忘了恢复 → 夜里它以 10% 透明度画在月心,就是"月亮中心的小孔") */
    g.globalAlpha = labFade;
    g.beginPath();
    g.arc(cx, cy, 4, 0, TAU);
    g.fillStyle = V.bg;
    g.fill();
    g.beginPath();
    g.arc(cx - 1, cy - 1, 4, -2.4, 0.4);
    g.strokeStyle = "rgba(0,0,0,0.35)";
    g.lineWidth = 1;
    g.stroke();
    g.globalAlpha = 1;

    /* 入夜:月落水面。
       水不是一片黑 —— 要有「状态」:
         ① 水线处被月光擦亮、向下渐暗的底色
         ② 铺满全宽的横向断口波纹(近水线密、远处疏,随时间缓慢横移)
         ③ 月盘落水处的辉光与高光
         ④ 月下的竖直倒影光路
    */
    if (nk > 0.001) {
      /* 水线:月盘下缘再下沉 WATER_DROP —— 月与海之间留一段夜空 */
      const hz = cy + R + W * WATER_DROP;
      const wH = H - hz; /* 水面高度 */
      if (wH > 3) {
        /* ⓪ 铺不透明夜色:全站星野垫在这块画布底下,水面若是半透明,
           星星会"透"进河面 —— 海面以下不该看得见星空。
           用站点背景色铺满水面,与天空无缝衔接,星星到水线为止。 */
        g.save();
        g.globalAlpha = nk;
        g.fillStyle = V.bg;
        g.fillRect(0, hz, W, wH);
        g.restore();
        /* ① 底色:月光擦过水面,越远越暗。
           横向也必须淡出到 0 —— 否则整块水面在画布左右缘会被切出硬边矩形。
           做法:竖向切若干条,每条用一条横向渐变(两侧透明、中间亮)。 */
        const SLICES = 26;
        for (let i = 0; i < SLICES; i++) {
          const k = i / (SLICES - 1);
          const ya = hz + k * wH;
          const yb = hz + ((i + 1) / (SLICES - 1)) * wH;
          const av = (0.2 * (1 - k) + 0.015) * nk; /* 近水线亮,向下渐暗 */
          const hg = g.createLinearGradient(0, 0, W, 0);
          hg.addColorStop(0, "rgba(126,100,66,0)");
          hg.addColorStop(0.2, `rgba(140,110,72,${av * 0.75})`);
          hg.addColorStop(DISC_CX, `rgba(186,146,92,${av * 1.3})`);
          hg.addColorStop(0.74, `rgba(140,110,72,${av * 0.7})`);
          hg.addColorStop(1, "rgba(126,100,66,0)");
          g.fillStyle = hg;
          g.fillRect(0, ya, W, yb - ya + 0.6);
        }

        /* ② 横向波纹:每一行是若干断口,越靠水线越密,整体缓慢横移。
           密度要克制 —— 太密就成了噪点,不是水。 */
        const rows = 20;
        for (let i = 0; i < rows; i++) {
          const k = i / (rows - 1);
          const y = hz + Math.pow(k, 1.75) * wH; /* 透视:水线附近最密 */
          const drift = Math.sin(t * (0.16 + k * 0.3) + i * 1.7) * (4 + k * 26);
          const th = Math.max(1, wH * 0.016 * (0.5 + k * 1.6));
          const lum = 0.5 + 0.5 * Math.sin(t * 0.45 + i * 0.8);
          const segs = 2 + Math.floor(k * 3);
          for (let s = 0; s < segs; s++) {
            const u = (s + 0.5) / segs;
            const j = Math.abs(Math.sin((i * 7 + s * 13) * 12.9898) * 43758.5453) % 1;
            const len = W * (0.1 + 0.2 * j);
            const x = drift + u * W * 1.3 - W * 0.15 + (j - 0.5) * W * 0.26;
            /* 离月越远越暗 */
            const d = Math.abs(x + len / 2 - cx) / (R * 1.45);
            const a = (0.06 + 0.13 * lum) * Math.max(0, 1 - d) * (1 - k * 0.25) * nk;
            if (a < 0.004) continue;
            const lg = g.createLinearGradient(x, 0, x + len, 0);
            lg.addColorStop(0, "rgba(255,214,150,0)");
            lg.addColorStop(0.5, `rgba(255,224,166,${a})`);
            lg.addColorStop(1, "rgba(255,214,150,0)");
            g.fillStyle = lg;
            g.fillRect(x, y, len, th);
          }
        }

        /* ③ 月盘落水处:压扁的径向辉光 + 一道水线高光
           (渐变必须与椭圆同形,否则竖直方向不衰减,会留下一块硬边暗斑) */
        g.save();
        g.translate(cx, hz);
        g.scale(1, 0.16);
        const contact = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.9);
        contact.addColorStop(0, `rgba(255,228,172,${0.34 * nk})`);
        contact.addColorStop(0.35, `rgba(250,190,90,${0.13 * nk})`);
        contact.addColorStop(1, "rgba(240,160,50,0)");
        g.fillStyle = contact;
        g.beginPath();
        g.arc(0, 0, R * 0.9, 0, TAU);
        g.fill();
        g.restore();
        g.save();
        g.translate(cx, hz);
        g.scale(1, 0.035);
        const glint = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.55);
        glint.addColorStop(0, `rgba(255,244,214,${0.5 * nk})`);
        glint.addColorStop(0.5, `rgba(255,214,140,${0.16 * nk})`);
        glint.addColorStop(1, "rgba(255,200,120,0)");
        g.fillStyle = glint;
        g.beginPath();
        g.arc(0, 0, R * 0.55, 0, TAU);
        g.fill();
        g.restore();

        /* ④ 倒影:一列横向水纹带,组成一条自月下垂落的竖直光路(用户认可的原版) */
        const BANDS = 15;
        const reflH = wH;
        for (let i = 0; i < BANDS; i++) {
          const k = i / (BANDS - 1);
          const y = hz + 3 + Math.pow(k, 1.22) * (reflH - 4);
          const wave =
            Math.sin(t * 0.55 + k * 2.6) * 0.6 + Math.sin(t * 0.21 - k * 1.3) * 0.4;
          const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
          const h2 = Math.abs(Math.sin(i * 78.233) * 24634.6345) % 1;
          const spread = R * (0.03 + 0.09 * k);
          const x = cx + wave * spread + (h1 - 0.5) * R * 0.05;
          /* 倒影锥度:下窄、往上(近月)逐渐变宽 —— 近月 ≈ 整轮月宽,向下收窄 */
          const w =
            R *
            (1.95 - 0.75 * k) *
            (0.8 + h2 * 0.4) *
            (0.92 + 0.14 * Math.sin(t * 0.8 + i * 1.9));
          const th = Math.max(1.2, (reflH / BANDS) * (0.75 + k * 1.4));
          const shimmer = 0.6 + 0.4 * Math.sin(t * (0.9 + i * 0.11) + i * 1.7);
          const a = (0.46 * (1 - k * 0.72) + 0.26) * shimmer * nk;
          g.save();
          g.translate(x, y);
          g.scale(1, th / (w / 2));
          const grad = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
          grad.addColorStop(0, `rgba(255,238,198,${a})`);
          grad.addColorStop(0.4, `rgba(250,196,102,${a * 0.5})`);
          grad.addColorStop(1, "rgba(238,146,40,0)");
          g.fillStyle = grad;
          g.beginPath();
          g.arc(0, 0, w / 2, 0, TAU);
          g.fill();
          g.restore();
        }
      }
    }

    /* 唱臂:S 形弯臂。
       入夜随 nightK 整体渐隐 —— 夜里这轮月是「画中的月」,
       机械臂杵在月面上反而出戏;音符与涟漪保留,作为播放反馈。 */
    const px = cx + R * 0.98,
      py = cy - R * 0.86;
    const ease = vinyl.armK * vinyl.armK * (3 - 2 * vinyl.armK);
    const nrT = 0.56 - 0.1 * (playing ? prog : vinyl.lastProg);
    vinyl.nrS += (nrT - vinyl.nrS) * clamp((playing ? 3.2 : 1.2) * (vinyl.dt || 0.016), 0, 1);
    const nr = R * vinyl.nrS;
    const tx = cx + Math.cos(0.44) * nr;
    const ty = cy + Math.sin(0.44) * nr - (1 - ease) * R * 0.3;
    const armA = Math.atan2(ty - py, tx - px);
    const ux = Math.cos(armA),
      uy = Math.sin(armA);
    const qx = (px + tx) / 2 - (ty - py) * 0.15;
    const qy = (py + ty) / 2 + (tx - px) * 0.15;

    g.globalAlpha = 1 - nk; /* 唱臂随入夜渐隐 */
    g.lineCap = "round";
    for (const [w2, al] of [
      [11, 0.09],
      [8.5, 0.1],
      [6, 0.12],
    ] as [number, number][]) {
      g.strokeStyle = V.dark ? `rgba(0,0,0,${al})` : `rgba(70,50,20,${al * 0.6})`;
      g.lineWidth = w2;
      g.beginPath();
      g.moveTo(px + 4, py + 8);
      g.quadraticCurveTo(qx + 4, qy + 8, tx + 4, ty + 8);
      g.stroke();
    }
    g.lineCap = "butt";

    g.save();
    g.translate(px - ux * 38, py - uy * 38);
    g.rotate(armA);
    const wg2 = g.createLinearGradient(0, -11, 0, 11);
    wg2.addColorStop(0, V.chrome1);
    wg2.addColorStop(0.45, V.chrome2);
    wg2.addColorStop(0.55, V.chrome2);
    wg2.addColorStop(1, V.chrome1);
    g.beginPath();
    g.ellipse(0, 0, 15, 10.5, 0, 0, TAU);
    g.fillStyle = wg2;
    g.fill();
    g.strokeStyle = V.edgeLo;
    g.lineWidth = 0.9;
    g.stroke();
    g.beginPath();
    g.ellipse(-11.5, 0, 2.8, 7.5, 0, 0, TAU);
    g.fillStyle = V.dark ? "#191c22" : "#7c766a";
    g.fill();
    g.beginPath();
    g.arc(10, 0, 3, 0, TAU);
    g.strokeStyle = V.edgeLo;
    g.lineWidth = 0.9;
    g.stroke();
    g.restore();

    const tgd = g.createLinearGradient(px - uy * 5.5, py + ux * 5.5, px + uy * 5.5, py - ux * 5.5);
    tgd.addColorStop(0, V.dark ? "#20232a" : "#6f6a5e");
    tgd.addColorStop(0.3, V.dark ? "#8f939d" : "#d9d3c3");
    tgd.addColorStop(0.45, V.dark ? "#d9dce3" : "#f5f1e4");
    tgd.addColorStop(0.62, V.dark ? "#6a6e78" : "#b7b1a1");
    tgd.addColorStop(1, V.dark ? "#20232a" : "#6f6a5e");
    g.strokeStyle = tgd;
    g.lineWidth = 7;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(px, py);
    g.quadraticCurveTo(qx, qy, tx, ty);
    g.stroke();
    g.lineCap = "butt";

    g.save();
    g.translate(px, py);
    g.rotate(armA);
    const bx2 = g.createLinearGradient(0, -12, 0, 12);
    bx2.addColorStop(0, V.dark ? "#3c404a" : "#d3ccba");
    bx2.addColorStop(0.5, V.dark ? "#24272e" : "#b0a894");
    bx2.addColorStop(1, V.dark ? "#171a20" : "#978f7c");
    g.fillStyle = bx2;
    g.beginPath();
    g.ellipse(0, -4, 9.5, 11.5, 0, 0, TAU);
    g.fill();
    g.strokeStyle = V.edgeLo;
    g.lineWidth = 0.8;
    g.stroke();
    g.beginPath();
    g.ellipse(0, -6.5, 9, 8.5, 0, 0, TAU);
    g.fillStyle = V.dark ? "#2e323b" : "#c9c2b0";
    g.fill();
    g.stroke();
    g.restore();
    chromeDot(px - ux * 2, py - uy * 2 - 5, 4);

    g.save();
    g.translate(tx, ty);
    g.rotate(armA + 0.5);
    const hsg = g.createLinearGradient(0, -4.5, 0, 4.5);
    hsg.addColorStop(0, V.dark ? "#565a64" : "#cdc6b4");
    hsg.addColorStop(0.5, V.dark ? "#33373f" : "#a59d8a");
    hsg.addColorStop(1, V.dark ? "#1e2127" : "#8b8472");
    g.beginPath();
    if (g.roundRect) g.roundRect(-9, -4.5, 19, 9, 2.4);
    else g.rect(-9, -4.5, 19, 9);
    g.fillStyle = hsg;
    g.fill();
    g.strokeStyle = V.edgeLo;
    g.lineWidth = 0.7;
    g.stroke();
    g.fillStyle = V.dark ? "#171a20" : "#7e7767";
    g.beginPath();
    if (g.roundRect) g.roundRect(4, -3, 6.5, 6, 1.2);
    else g.rect(4, -3, 6.5, 6);
    g.fill();
    g.beginPath();
    g.arc(-4, 0, 1.5, 0, TAU);
    g.fillStyle = V.gold;
    g.fill();
    g.strokeStyle = playing ? `rgba(248,204,125,${0.55 + 0.35 * Math.sin(t * 5)})` : V.chrome2;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(10.5, 3);
    g.lineTo(12, 6.5);
    g.stroke();
    g.restore();
    g.globalAlpha = 1; /* 唱臂渐隐到此为止,涟漪与音符不受影响 */

    vinyl.nx = tx;
    vinyl.ny = ty;

    /* 针尖涟漪 + 辉光:随入夜整体淡出 —— 夜里月面上不该有机械反馈 */
    const playFade = 1 - nk;
    const nowS = performance.now() / 1000;
    if (playFade > 0.01) {
      for (let i = vinyl.ripples.length - 1; i >= 0; i--) {
        const rp = vinyl.ripples[i];
        const age = nowS - rp.born;
        if (age > 0.6) {
          vinyl.ripples.splice(i, 1); /* 顺手清掉过期项,数组不再无限增长 */
          continue;
        }
        if (age < 0) continue;
        const rx = rp.x ?? vinyl.nx,
          ry = rp.y ?? vinyl.ny;
        g.beginPath();
        g.arc(rx, ry, (rp.small ? 4 : 7) + age * (rp.small ? 24 : 40), 0, TAU);
        g.strokeStyle = `rgba(248,204,125,${(1 - age / 0.6) * (rp.small ? 0.28 : 0.42) * playFade})`;
        g.lineWidth = 1.2;
        g.stroke();
      }
      if (playing && ease > 0.95) {
        g.beginPath();
        g.arc(tx, ty, 10 + pulse * 3.5, 0, TAU);
        g.strokeStyle = `rgba(248,204,125,${(0.22 + pulse * 0.3) * playFade})`;
        g.lineWidth = 1.2 + pulse;
        g.stroke();
      }
    }

    /* 音符:同样随入夜淡出 */
    for (let i = notes.length - 1; i >= 0; i--) {
      const nt = notes[i];
      if (nt.age < 0) continue;
      if (nt.age > nt.life) {
        notes.splice(i, 1);
        continue;
      }
      const aIn = Math.min(1, nt.age * 2.2);
      const aOut = Math.min(1, (nt.life - nt.age) / 0.9);
      const x = nt.x + Math.sin(nt.age * nt.sf + nt.ph) * nt.amp;
      const y = nt.y - nt.vy * nt.age;
      g.save();
      g.translate(x, y);
      g.rotate(Math.sin(nt.age * 1.3 + nt.ph) * 0.12);
      g.font = `${nt.size}px "LXGW WenKai Lite", serif`;
      g.textAlign = "center";
      g.fillStyle = nt.col;
      g.globalAlpha = 0.72 * aIn * aOut * playFade;
      if (V.dark) {
        g.shadowColor = "rgba(248,204,125,.45)";
        g.shadowBlur = 6;
      }
      g.fillText(nt.glyph, 0, 0);
      g.restore();
    }
    g.globalAlpha = 1;

    if (statusEl) {
      if (!PLAYBACK_ENABLED) {
        statusEl.textContent = "";
      } else if (playing && transport.trackMode) {
        statusEl.textContent = `♪ Now playing — "Ever Fall" · League of Legends Music & Toyko · Courtesy of Riot Games`;
      } else if (playing && actx) {
        const beat = Math.max(0, actx.currentTime - transport.loopStart) / SPB;
        const bar = (((Math.floor(beat / 4) % BARS) + BARS) % BARS) + 1;
        const phase = bar <= 8 ? "A" : bar <= 12 ? "B(卡农)" : "A′";
        statusEl.textContent = `◉ 落针 · 第 ${bar} / ${BARS} 小节(${phase})· 循环中`;
      } else if (vinyl.armK > 0.02) {
        statusEl.textContent = "唱针抬起 —— 余韵散去。";
      } else {
        statusEl.textContent = transport.trackMode
          ? "点击唱片,落针播放。"
          : "点击唱片,落针播放《橙月》。";
      }
    }
  }

  /* ── 尺寸 / 事件 / 主循环 ──────────────────────────────── */
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
  }
  /* 命中判定:是否落在唱片圆内(与绘制共用同一套几何) */
  const onDisc = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const { R, cx, cy } = discGeom(canvas.width, canvas.height);
    return Math.hypot(x - cx, y - cy) <= R * 1.02;
  };
  const onDown = (e: PointerEvent) => {
    if (!PLAYBACK_ENABLED) return; /* 曲目授权待批,点击暂不播放 */
    if (!onDisc(e)) return; /* 只在唱片圆内响应点击 */
    if (transport.playing) stopSong();
    else startSong();
  };
  /* 光标跟随命中:在唱片上才显示 pointer */
  const onMove = (e: PointerEvent) => {
    canvas.style.cursor = PLAYBACK_ENABLED && onDisc(e) ? "pointer" : "default";
  };
  const onLeave = () => {
    canvas.style.cursor = "default";
  };
  const onKey = (e: KeyboardEvent) => {
    if (!PLAYBACK_ENABLED) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (transport.playing) stopSong();
      else startSong();
    }
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("keydown", onKey);

  const themeObs = new MutationObserver(() => {
    V = readVars();
  });
  themeObs.observe(rootEl, { attributes: true, attributeFilter: ["class"] });

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  try {
    ensureAudio();
  } catch {
    /* 预建失败则点击时再建 */
  }

  let rafId = 0;
  function loop(ms: number) {
    const t = ms / 1000;
    const dt = clamp(t - vinyl.lastT || 0.016, 0.001, 0.05);
    vinyl.lastT = t;
    vinyl.dt = dt;
    const targetRps = transport.playing ? 33.33 / 120 : 0.02;
    vinyl.rpm += (targetRps - vinyl.rpm) * Math.min(1, dt * (transport.playing ? 2.6 : 1.5));
    vinyl.angle += vinyl.rpm * dt * TAU;
    /* 唱臂:显式补间(与帧率无关),落点与音乐起播严格对齐 */
    const armP = clamp((t - vinyl.armT0) / vinyl.armDur, 0, 1);
    vinyl.armK = vinyl.armFrom + (vinyl.armTo - vinyl.armFrom) * armP;
    const nightT = rootEl.classList.contains("dark") ? 1 : 0;
    vinyl.nightK += (nightT - vinyl.nightK) * Math.min(1, dt * 1.8);

    if (transport.playing && vinyl.armK > 0.9 && !reduceMotion) {
      if (!vinyl.burst) {
        vinyl.burst = true;
        for (let i = 0; i < 3; i++) spawnNote(0.1 + i * 0.26);
        vinyl.ripples.push({
          born: performance.now() / 1000,
          x: vinyl.nx,
          y: vinyl.ny,
          small: false,
        });
        vinyl.ripples.push({
          born: performance.now() / 1000 + 0.14,
          x: vinyl.nx,
          y: vinyl.ny,
          small: false,
        });
      }
      while (vinyl.noteQ.length && vinyl.noteQ[0].at <= nowA() + 0.02) {
        const q = vinyl.noteQ.shift();
        /* 标签页挂后台时 rAF 停转、队列积压;回来后过期的音符直接丢弃,
           不然一分钟的后台会攒出几十个音符同帧迸发 */
        if (q && q.at >= nowA() - 0.2) spawnNote(0, q.kind, q.vel, q.len);
      }
      if (transport.trackMode) {
        /* 曲目模式:音符跟真实音乐的能量走 —— 能量越过了阈值、
           且距上个音符留了随机间隔,就冒一个(不会满屏都是) */
        if (vinyl.eS > 0.14 && t - vinyl.noteAt > 0.34 + Math.random() * 0.42) {
          vinyl.noteAt = t;
          spawnNote(0, Math.random() < 0.3 ? "spark" : "mel", 0.85);
        }
      }
      const b = (nowA() - transport.loopStart) / SPB;
      const bi = Math.floor(b);
      if (b >= 0 && bi !== vinyl.lastBeat) {
        vinyl.lastBeat = bi;
        vinyl.ripples.push({
          born: performance.now() / 1000,
          x: vinyl.nx,
          y: vinyl.ny,
          small: true,
        });
      }
    } else if (!transport.playing) {
      vinyl.burst = false;
      vinyl.lastBeat = -1;
    }
    for (let i = vinyl.ripples.length - 1; i >= 0; i--)
      if (performance.now() / 1000 - vinyl.ripples[i].born > 0.7) vinyl.ripples.splice(i, 1);
    /* 能量来源:曲目模式读曲目分析器(真实音乐),否则读合成器分析器 */
    const an = transport.playing && transport.trackMode && trackAnalyser && trackSpec
      ? { node: trackAnalyser, buf: trackSpec }
      : analyser && spec
        ? { node: analyser, buf: spec }
        : null;
    if (an) {
      an.node.getByteFrequencyData(an.buf);
      let e = 0;
      for (let k = 2; k < 160; k++) e += an.buf[k];
      vinyl.eS += (e / 158 / 255 - vinyl.eS) * Math.min(1, dt * 6);
    } else vinyl.eS *= 0.95;
    for (const nt of notes) nt.age += dt;

    drawDisc(t);
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    stopSong();
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("keydown", onKey);
    themeObs.disconnect();
    ro.disconnect();
  };
}
