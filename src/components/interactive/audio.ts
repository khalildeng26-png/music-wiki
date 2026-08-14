// 音频引擎:Tone.js 动态加载(SSR 安全),按用户手势启动 AudioContext。
// 四种音色(钢琴/吉他/小提琴/合成),每种独立 PolySynth,
// 统一走主链路(增益→限幅)提升音量,低通滤波剃掉毛刺提升清晰度。
type ToneModule = typeof import("tone");

export type Timbre = "piano" | "guitar" | "violin" | "synth";

let ToneMod: ToneModule | null = null;
const synths = new Map<Timbre, InstanceType<ToneModule["PolySynth"]>>();
let masterInput: InstanceType<ToneModule["Gain"]> | null = null;

async function getTone(): Promise<ToneModule> {
  if (!ToneMod) ToneMod = await import("tone");
  return ToneMod;
}

// 各音色配方:振荡器 + 包络 + 低通截止频率 + 音量
// piano  = 三角波、快起音、中等延音 → 干净的键盘感
// guitar = 三角波、拨弦包络(几乎无延音)+ 暖低通 → 拨弦感
// violin = 三组失谐锯齿波、慢起音、持续音 → 弦乐的绵延感
// synth  = 通用理论示范音色
const TIMBRES: Record<
  Timbre,
  {
    osc: "triangle" | "fatsawtooth";
    env: { attack: number; decay: number; sustain: number; release: number };
    filter: number;
    volume: number;
  }
> = {
  piano: {
    osc: "triangle",
    env: { attack: 0.001, decay: 0.55, sustain: 0.16, release: 0.55 },
    filter: 4200,
    volume: -5,
  },
  guitar: {
    osc: "triangle",
    env: { attack: 0.001, decay: 0.45, sustain: 0.02, release: 0.3 },
    filter: 2600,
    volume: -4,
  },
  violin: {
    osc: "fatsawtooth",
    env: { attack: 0.1, decay: 0.25, sustain: 0.7, release: 0.35 },
    filter: 3000,
    volume: -10,
  },
  synth: {
    osc: "triangle",
    env: { attack: 0.004, decay: 0.4, sustain: 0.2, release: 0.5 },
    filter: 4200,
    volume: -6,
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
  if (!synths.has(timbre)) {
    const cfg = TIMBRES[timbre];
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: cfg.osc },
      envelope: cfg.env,
      volume: cfg.volume,
    });
    const filter = new Tone.Filter(cfg.filter, "lowpass");
    synth.connect(filter);
    filter.connect(ensureMaster(Tone));
    synths.set(timbre, synth);
  }
  return { Tone, synth: synths.get(timbre)! };
}

/** 顺序播放一串音名(如 ["C4","D4","E4"])。 */
export async function playSequence(
  notes: string[],
  dur = 0.45,
  gap = 0.08,
  timbre: Timbre = "piano",
) {
  const { Tone, synth } = await ensureAudio(timbre);
  const start = Tone.now() + 0.06;
  notes.forEach((n, i) => {
    synth.triggerAttackRelease(n, dur, start + i * (dur + gap));
  });
}

/** 播放单个音名。 */
export async function playNote(note: string, dur = 0.7, timbre: Timbre = "piano") {
  const { Tone, synth } = await ensureAudio(timbre);
  synth.triggerAttackRelease(note, dur, Tone.now() + 0.02);
}

/** 同时播放多个音(和弦)。 */
export async function playChord(notes: string[], dur = 1.3, timbre: Timbre = "piano") {
  const { Tone, synth } = await ensureAudio(timbre);
  const now = Tone.now() + 0.02;
  notes.forEach((n) => synth.triggerAttackRelease(n, dur, now));
}

/** 依次播放多个和弦(进行/终止式)。 */
export async function playChordProgression(
  chords: string[][],
  dur = 0.9,
  gap = 0.25,
  timbre: Timbre = "piano",
) {
  const { Tone, synth } = await ensureAudio(timbre);
  const now = Tone.now() + 0.05;
  chords.forEach((notes, i) => {
    const t = now + i * (dur + gap);
    notes.forEach((n) => synth.triggerAttackRelease(n, dur, t));
  });
}
