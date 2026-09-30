// 音频引擎:Tone.js 动态加载(SSR 安全),按用户手势启动 AudioContext。
// 音色两类:
//  - 采样乐器(Tone.Sampler):钢琴(Salamander Grand,CC-BY)/吉他/小提琴/贝斯
//    (ISU MIS 音源)——真实录音,锚点音之间自动重采样;首次播放按需加载(每音色
//    一两百 KB),之后常驻内存。
//  - synth:振荡器合成,理论示范音色,"电子味"是刻意的。
// 统一走主链路(增益→限幅)防 boom,音量按音色分别校准。
type ToneModule = typeof import("tone");

// 音名移调(±5 半音采样舒适区,见 src/lib/transpose.ts)
import { transposeNotes } from "@/lib/transpose";

export type Timbre =
  | "piano"
  | "guitar"
  | "violin"
  | "bass"
  | "flute"
  | "clarinet"
  | "bassoon"
  | "horn"
  | "trumpet"
  | "trombone"
  | "tuba"
  | "eguitar"
  | "ukulele"
  | "oboe"
  | "erhu"
  | "dizi"
  | "guzheng"
  | "suona"
  | "harmonica"
  | "synth"
  | "chip"
  | "whistle"
  | "drums";

type Instrument = InstanceType<ToneModule["Sampler"]> | InstanceType<ToneModule["PolySynth"]>;

let ToneMod: ToneModule | null = null;
const instruments = new Map<Timbre, Instrument>();
const ready = new Map<Timbre, Promise<Instrument>>();
let masterInput: InstanceType<ToneModule["Gain"]> | null = null;

async function getTone(): Promise<ToneModule> {
  if (!ToneMod) ToneMod = await import("tone");
  return ToneMod;
}

/** 采样音色:锚点音 → 文件名(不含扩展名);音量相对主链路校准 */
const SAMPLES: Record<
  Exclude<Timbre, "synth" | "chip">,
  { files: Record<string, string>; volume: number; release: number; attack?: number }
> = {
  // 鼓组(Freesound CC0,BaDokick/blakengouda/Cringegaming64yt 上传):
  // 伪音名映射到五个单响——触发时打对应"音名"即为对应鼓件
  drums: {
    files: {
      C1: "kick",
      D1: "snare",
      E1: "hihat",
      F1: "openhat",
      G1: "ride",
      A1: "bodhran",
      B1: "msnare",
    },
    volume: -10,
    release: 0.2,
  },
  // 爱尔兰锡哨:Freesound CC0(neild101),单锚点 E5 持续音,旋律靠重采样移调
  whistle: {
    files: { E5: "E5" },
    volume: -12,
    release: 0.35,
  },
  piano: {
    files: {
      A1: "A1",
      "D#2": "Ds2",
      A2: "A2",
      "D#3": "Ds3",
      A3: "A3",
      "D#4": "Ds4",
      A4: "A4",
      A5: "A5",
    },
    // 2026-08-24:-10 → -2(经 -6 仍偏轻,与吉他/电吉他同档)
    volume: -2,
    release: 0.3,
  },
  guitar: {
    files: { E2: "E2", A2: "A2", D3: "D3", G3: "G3", B3: "B3", E4: "E4" },
    volume: -2,
    release: 0.4,
  },
  violin: {
    files: { A3: "A3", E4: "E4", A4: "A4", E5: "E5", A6: "A6" },
    volume: -8,
    release: 0.5,
  },
  bass: {
    files: { E1: "E1", "A#1": "As1", E2: "E2", "A#2": "As2", E3: "E3" },
    // 2026-08-21:-2 → -6。原值按独奏校准,StyleDemo 混编里低频压过钢琴/吉他
    volume: -6,
    release: 0.3,
  },
  flute: {
    files: { C4: "C4", A4: "A4", E5: "E5", A5: "A5", C6: "C6", E6: "E6" },
    volume: -8,
    release: 0.4,
  },
  clarinet: {
    files: { "A#3": "As3", D4: "D4", F4: "F4", "A#4": "As4", D5: "D5", F5: "F5" },
    volume: -8,
    release: 0.4,
  },
  bassoon: {
    files: { G2: "G2", C3: "C3", G3: "G3", C4: "C4", G4: "G4" },
    volume: -8,
    release: 0.4,
  },
  horn: {
    files: { C2: "C2", D3: "D3", A3: "A3", C4: "C4", D5: "D5", F5: "F5" },
    volume: -10,
    release: 0.4,
  },
  trumpet: {
    files: { A3: "A3", C4: "C4", F4: "F4", D5: "D5", A5: "A5" },
    volume: -10,
    release: 0.3,
  },
  trombone: {
    files: { "A#1": "As1", C3: "C3", F3: "F3", C4: "C4", F4: "F4" },
    volume: -8,
    release: 0.4,
  },
  tuba: {
    files: { F1: "F1", "A#1": "As1", F2: "F2", "A#2": "As2", D3: "D3", F3: "F3" },
    volume: -8,
    release: 0.4,
  },
  eguitar: {
    files: { E2: "E2", A2: "A2", "D#3": "Ds3", A3: "A3", "D#4": "Ds4", A4: "A4" },
    volume: -2,
    // ISU MIS 电吉他采样是持续音(无拨弦起音),短促重触发时切口会"咔嗒"——
    // 8ms 淡入 + 短释放把切口磨圆,听感变为干净的清音 swell
    attack: 0.008,
    release: 0.2,
  },
  ukulele: {
    files: { E4: "E4", A4: "A4", D5: "D5", G5: "G5" },
    volume: -4,
    release: 0.4,
  },
  oboe: {
    files: { F3: "F3", D4: "D4", F4: "F4", D5: "D5" },
    volume: -10,
    release: 0.4,
  },
  erhu: {
    files: { D3: "D3", F3: "F3", A3: "A3", D4: "D4", "F#4": "Fs4", A4: "A4" },
    volume: -6,
    release: 0.5,
  },
  dizi: {
    files: { F5: "F5", G5: "G5", A5: "A5", C6: "C6", D6: "D6" },
    volume: -8,
    release: 0.4,
  },
  guzheng: {
    files: { A3: "A3" },
    volume: -6,
    release: 0.6,
  },
  suona: {
    files: { E6: "E6" },
    volume: -14,
    release: 0.4,
  },
  harmonica: {
    files: { C3: "C3", A3: "A3", C4: "C4", "D#4": "Ds4", "F#4": "Fs4", A5: "A5" },
    volume: -8,
    release: 0.3,
  },
};

/** 主链路:增益(提音量)→ 限幅(防爆音)→ 输出。所有音色共用。 */
function ensureMaster(Tone: ToneModule) {
  if (!masterInput) {
    const gain = new Tone.Gain(1.6);
    const limiter = new Tone.Limiter(-1);
    gain.connect(limiter);
    limiter.toDestination();
    masterInput = gain;
  }
  return masterInput;
}

async function ensureAudio(timbre: Timbre = "piano") {
  const Tone = await getTone();
  await Tone.start();
  const master = ensureMaster(Tone);

  let p = ready.get(timbre);
  if (!p) {
    p = (async () => {
      if (timbre === "synth") {
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "triangle" },
          envelope: { attack: 0.004, decay: 0.4, sustain: 0.2, release: 0.5 },
          volume: -6,
        });
        synth.connect(master);
        instruments.set(timbre, synth);
        return synth;
      }
      if (timbre === "chip") {
        // 芯片音乐音色:方波 + 极短包络,8bit/复古游戏味
        const chip = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "square" },
          envelope: { attack: 0.001, decay: 0.12, sustain: 0.08, release: 0.08 },
          volume: -14,
        });
        chip.connect(master);
        instruments.set(timbre, chip);
        return chip;
      }
      const cfg = SAMPLES[timbre];
      const urls: Record<string, string> = {};
      for (const [note, file] of Object.entries(cfg.files)) urls[note] = `${file}.mp3`;
      // onload 等全部采样就绪,避免首音被静默吞掉
      const sampler = await new Promise<InstanceType<ToneModule["Sampler"]>>((resolve) => {
        const s = new Tone.Sampler({
          urls,
          baseUrl: `/audio/${timbre}/`,
          release: cfg.release,
          ...(cfg.attack != null ? { attack: cfg.attack } : {}),
          onload: () => resolve(s),
        });
        s.volume.value = cfg.volume;
        s.connect(master);
      });
      instruments.set(timbre, sampler);
      return sampler;
    })();
    ready.set(timbre, p);
  }
  const inst = await p;
  // 幂等重连:stopAllAudio 断开输出后,下一次播放从这里恢复
  inst.connect(master);
  return { Tone, inst };
}

/** 顺序播放一串音名(如 ["C4","D4","E4"])。开始前打断已有播放。 */
export async function playSequence(
  notes: string[],
  dur = 0.45,
  gap = 0.08,
  timbre: Timbre = "piano",
) {
  stopAllAudio();
  const mySession = playSession;
  const { Tone, inst } = await ensureAudio(timbre);
  if (mySession !== playSession) return; // 加载期间被新播放取代
  const start = Tone.now() + 0.06;
  notes.forEach((n, i) => {
    inst.triggerAttackRelease(n, dur, start + i * (dur + gap));
  });
}

/** 播放单个音名。 */
export async function playNote(note: string, dur = 0.7, timbre: Timbre = "piano") {
  const { Tone, inst } = await ensureAudio(timbre);
  inst.triggerAttackRelease(note, dur, Tone.now() + 0.02);
}

/** 同时播放多个音(和弦)。 */
export async function playChord(notes: string[], dur = 1.3, timbre: Timbre = "piano") {
  const { Tone, inst } = await ensureAudio(timbre);
  const now = Tone.now() + 0.02;
  notes.forEach((n) => inst.triggerAttackRelease(n, dur, now));
}

/** 依次播放多个和弦(进行/终止式)。开始前打断已有播放。 */
export async function playChordProgression(
  chords: string[][],
  dur = 0.9,
  gap = 0.25,
  timbre: Timbre = "piano",
) {
  stopAllAudio();
  const mySession = playSession;
  const { Tone, inst } = await ensureAudio(timbre);
  if (mySession !== playSession) return; // 加载期间被新播放取代
  const now = Tone.now() + 0.05;
  chords.forEach((notes, i) => {
    const t = now + i * (dur + gap);
    notes.forEach((n) => inst.triggerAttackRelease(n, dur, t));
  });
}

// ---------- 风格试听:多轨 pattern 播放(StyleDemo 用) ----------

/** 鼓件:bodhran=爱尔兰宝思兰鼓,msnare=行进小军鼓(其余同前)。 */
export type DrumHit = "kick" | "snare" | "hihat" | "openhat" | "ride" | "bodhran" | "msnare";

/** 一条音符轨/和弦轨的事件。t/dur 以拍为单位。 */
export type NoteEvent = { t: number; notes: string[]; dur?: number; vel?: number };

export type PatternTrack =
  | { kind: "notes"; timbre: Timbre; events: NoteEvent[] }
  /** kit 默认 acoustic(真实采样);synth = 芯片/电子风格的原生噪声鼓 */
  | {
      kind: "drums";
      kit?: "acoustic" | "synth";
      events: { t: number; hit: DrumHit; vel?: number }[];
    };

export type Pattern = {
  bpm: number;
  /** 摇摆:正拍后的八分音往后挪的比例位置。0.5=平直(默认),0.62~0.67≈三连音摇摆 */
  swing?: number;
  beats: number;
  /** 整段循环遍数(默认 1)。舞曲系的 vamp 本质就是循环,拉长听感的正路是转圈而非堆音符 */
  repeat?: number;
  tracks: PatternTrack[];
};

type DrumKit = Record<
  "kick" | "snare" | "hihat" | "openhat",
  InstanceType<ToneModule["MembraneSynth"] | ToneModule["NoiseSynth"]>
>;
let drumKit: DrumKit | null = null;
/** 鼓组各件的输出末端(kick 直连、三件噪声走滤波):断开/重连都作用在末端,链条内部不动 */
let drumTerminals: unknown[] = [];
let drumKitReady: Promise<DrumKit> | null = null;

// ---------- 全局播放控制:一次只有一个播放会话,新播放自动打断旧播放 ----------
const audioInterruptListeners = new Set<() => void>();

/** 播放会话号:每次 stopAllAudio 递增。还在加载采样的旧调用醒来后发现会话变了就作废,
 *  防止「加载中被切歌 → 加载完照样排进时间线」的双声竞态。 */
let playSession = 0;

/** 订阅「新的播放开始/全局停止」(组件用它复位播放态 UI)。返回退订函数。 */
export function onAudioInterrupt(fn: () => void): () => void {
  audioInterruptListeners.add(fn);
  return () => audioInterruptListeners.delete(fn);
}

/**
 * 停止所有正在响和已排队的声音:断开每件乐器的输出端——已排进音频时间线
 * 但还没响的声源随输出端一起失效,正在延音的音被释放;随后通知所有组件复位。
 * 新的序列/片段播放前会自动调用(=点新歌自动切歌)。
 */
export function stopAllAudio() {
  playSession++;
  for (const inst of instruments.values()) {
    try {
      inst.releaseAll();
    } catch {
      /* 个别类型无 releaseAll,仅断开即可 */
    }
    try {
      inst.disconnect();
    } catch {}
  }
  for (const t of drumTerminals) {
    try {
      (t as { disconnect: () => void }).disconnect();
    } catch {}
  }
  for (const fn of audioInterruptListeners) fn();
}

/** 采样鼓组的伪音名 → 鼓件映射(与 SAMPLES.drums.files 对应)。 */
const DRUM_NOTE: Record<DrumHit, string> = {
  kick: "C1",
  snare: "D1",
  hihat: "E1",
  openhat: "F1",
  ride: "G1",
  bodhran: "A1",
  msnare: "B1",
};

/** 惰性构建合成鼓组:底鼓=膜鼓合成,军鼓/踩镲=噪声+滤波。示意用途,UI 需注明。 */
async function ensureDrums(Tone: ToneModule): Promise<DrumKit> {
  if (!drumKitReady) {
    drumKitReady = (async () => {
      const master = ensureMaster(Tone);
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.28, sustain: 0 },
        volume: -6,
      });
      kick.connect(master);

      const snareBody = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.14, sustain: 0 },
        volume: -20,
      });
      const snareTone = new Tone.Filter({ type: "bandpass", frequency: 1800, Q: 0.8 });
      snareBody.connect(snareTone);
      snareTone.connect(master);

      const hat = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.03, sustain: 0 },
        volume: -24,
      });
      const hatTone = new Tone.Filter({ type: "highpass", frequency: 8000 });
      hat.connect(hatTone);
      hatTone.connect(master);

      const openhat = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.3, sustain: 0 },
        volume: -26,
      });
      const openTone = new Tone.Filter({ type: "highpass", frequency: 7000 });
      openhat.connect(openTone);
      openTone.connect(master);

      drumKit = { kick, snare: snareBody, hihat: hat, openhat };
      drumTerminals = [kick, snareTone, hatTone, openTone];
      return drumKit;
    })();
  }
  const kit = await drumKitReady;
  // 幂等重连末端(链条内部 body→filter 不动):stopAllAudio 后恢复
  const master = ensureMaster(Tone);
  for (const t of drumTerminals) (t as InstanceType<ToneModule["Filter"]>).connect(master);
  return kit;
}

/**
 * 多轨 pattern 播放:旋律/和弦轨(采样或合成音色)+ 鼓轨(采样/合成)。
 * 时间以拍计,bpm 换算;swing 会把落在正拍后半拍(t 的小数部分恰为 0.5)的事件后移,
 * 模拟摇摆八分——爵士/布鲁斯的节奏灵魂。
 *
 * 调度采用「滚动窗口」:每 100ms 只把未来 ~300ms 内的事件排进音频时间线,
 * 切歌/停止即停排。整段一次性预排会在打断时留下上百个无法取消的幽灵声源,
 * 快速切歌几次就叠声+卡顿(2026-08-24 实测教训)。
 */
export async function playPattern(
  pattern: Pattern,
  opts?: { onStart?: () => void; transpose?: number },
): Promise<void> {
  stopAllAudio(); // 新片段打断旧片段(全局一次只播一个)
  const mySession = playSession;
  const spb = 60 / pattern.bpm; // 每拍秒数
  const swing = pattern.swing ?? 0.5;

  // 用到的音色先并行就绪(含采样下载)
  const timbres = [
    ...new Set(pattern.tracks.flatMap((tr) => (tr.kind === "notes" ? [tr.timbre] : []))),
  ];
  const acousticDrums = pattern.tracks.some(
    (tr) => tr.kind === "drums" && (tr.kit ?? "acoustic") !== "synth",
  );
  const synthDrums = pattern.tracks.some((tr) => tr.kind === "drums" && tr.kit === "synth");
  if (acousticDrums) timbres.push("drums");
  const Tone = await getTone();
  await Promise.all([
    ...timbres.map((tm) => ensureAudio(tm)),
    ...(synthDrums ? [ensureDrums(Tone)] : []),
  ]);
  await Tone.start();
  if (mySession !== playSession) return; // 加载期间被新播放取代
  opts?.onStart?.(); // 声音即将响起(首个声源约 120ms 后),动画由此刻同步起跑
  const kit = synthDrums ? (drumKit as DrumKit) : null;
  const drumSampler = acousticDrums ? instruments.get("drums") : null;

  const swingOffset = (t: number) => {
    const frac = t - Math.floor(t);
    // 只动"正拍后半"这一格(八分音符网格),其余时值不动
    if (Math.abs(frac - 0.5) < 1e-6) return (swing - 0.5) * spb;
    return 0;
  };

  const start = Tone.now() + 0.12;
  const fire = (track: PatternTrack, ev: { t: number }, when: number) => {
    if (track.kind === "notes") {
      const e = ev as NoteEvent;
      const notes = opts?.transpose ? transposeNotes(e.notes, opts.transpose) : e.notes;
      instruments
        .get(track.timbre)
        ?.triggerAttackRelease(notes, (e.dur ?? 0.5) * spb, when, e.vel ?? 1);
    } else {
      const e = ev as { hit: DrumHit; vel?: number };
      const vel = e.vel ?? 1;
      if (track.kit !== "synth" && drumSampler) {
        // 真实采样鼓:伪音名 → 鼓件;dur 给足让采样自然衰减(ride 余音最长)
        const dur = e.hit === "ride" || e.hit === "openhat" ? 2.2 : e.hit === "msnare" ? 0.6 : 1.4;
        drumSampler.triggerAttackRelease(DRUM_NOTE[e.hit], dur, when, vel);
      } else if (kit) {
        switch (e.hit) {
          case "kick":
            kit.kick.triggerAttackRelease("C1", "16n", when, vel);
            break;
          case "snare":
            kit.snare.triggerAttackRelease("16n", when, vel);
            break;
          case "hihat":
            kit.hihat.triggerAttackRelease("32n", when, vel);
            break;
          case "openhat":
            kit.openhat.triggerAttackRelease("8n", when, vel);
            break;
          case "ride":
            kit.openhat.triggerAttackRelease("4n", when, vel * 0.8);
            break;
          case "bodhran":
          case "msnare":
            break;
        }
      }
    }
  };

  // 每轨事件按时间排序,配合队头指针做滚动调度;repeat>1 时以 beats 为周期复制
  const loops = Math.max(1, pattern.repeat ?? 1);
  const queues = pattern.tracks.map((track) => {
    const sorted = [...(track.events as { t: number }[])].sort((a, b) => a.t - b.t);
    const events = Array.from({ length: loops }, (_, c) =>
      sorted.map((ev) => ({ ev: { ...ev, t: ev.t + c * pattern.beats }, track })),
    ).flat();
    return events.sort((a, b) => a.ev.t - b.ev.t);
  });
  const heads = queues.map(() => 0);
  const total = pattern.beats * loops * spb;

  await new Promise<void>((resolve) => {
    const tick = () => {
      if (mySession !== playSession) return resolve(); // 会话失效:停止排入,已排声部由 stopAllAudio 清理
      const now = Tone.now();
      const horizon = now + 0.3;
      let allDone = true;
      queues.forEach((q, qi) => {
        while (heads[qi] < q.length) {
          const { ev, track } = q[heads[qi]];
          const when = start + ev.t * spb + swingOffset(ev.t);
          if (when > horizon) {
            allDone = false;
            break;
          }
          if (when >= now - 0.05) fire(track, ev, when); // 因切换/卡顿过期的直接跳过
          heads[qi]++;
        }
        if (heads[qi] < q.length) allDone = false;
      });
      if (allDone && now > start + total) return resolve();
      window.setTimeout(tick, 100);
    };
    tick();
  });
}
