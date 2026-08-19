// 音频引擎:Tone.js 动态加载(SSR 安全),按用户手势启动 AudioContext。
// 音色两类:
//  - 采样乐器(Tone.Sampler):钢琴(Salamander Grand,CC-BY)/吉他/小提琴/贝斯
//    (ISU MIS 音源)——真实录音,锚点音之间自动重采样;首次播放按需加载(每音色
//    一两百 KB),之后常驻内存。
//  - synth:振荡器合成,理论示范音色,"电子味"是刻意的。
// 统一走主链路(增益→限幅)防 boom,音量按音色分别校准。
type ToneModule = typeof import("tone");

export type Timbre = "piano" | "guitar" | "violin" | "bass" | "synth";

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
  Exclude<Timbre, "synth">,
  { files: Record<string, string>; volume: number; release: number }
> = {
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
    volume: -10,
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
    volume: -2,
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
      const cfg = SAMPLES[timbre];
      const urls: Record<string, string> = {};
      for (const [note, file] of Object.entries(cfg.files)) urls[note] = `${file}.mp3`;
      // onload 等全部采样就绪,避免首音被静默吞掉
      const sampler = await new Promise<InstanceType<ToneModule["Sampler"]>>((resolve) => {
        const s = new Tone.Sampler({
          urls,
          baseUrl: `/audio/${timbre}/`,
          release: cfg.release,
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
  return { Tone, inst: await p };
}

/** 顺序播放一串音名(如 ["C4","D4","E4"])。 */
export async function playSequence(
  notes: string[],
  dur = 0.45,
  gap = 0.08,
  timbre: Timbre = "piano",
) {
  const { Tone, inst } = await ensureAudio(timbre);
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

/** 依次播放多个和弦(进行/终止式)。 */
export async function playChordProgression(
  chords: string[][],
  dur = 0.9,
  gap = 0.25,
  timbre: Timbre = "piano",
) {
  const { Tone, inst } = await ensureAudio(timbre);
  const now = Tone.now() + 0.05;
  chords.forEach((notes, i) => {
    const t = now + i * (dur + gap);
    notes.forEach((n) => inst.triggerAttackRelease(n, dur, t));
  });
}
