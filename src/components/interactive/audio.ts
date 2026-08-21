// 音频引擎:Tone.js 动态加载(SSR 安全),按用户手势启动 AudioContext。
// 音色两类:
//  - 采样乐器(Tone.Sampler):钢琴(Salamander Grand,CC-BY)/吉他/小提琴/贝斯
//    (ISU MIS 音源)——真实录音,锚点音之间自动重采样;首次播放按需加载(每音色
//    一两百 KB),之后常驻内存。
//  - synth:振荡器合成,理论示范音色,"电子味"是刻意的。
// 统一走主链路(增益→限幅)防 boom,音量按音色分别校准。
type ToneModule = typeof import("tone");

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
  { files: Record<string, string>; volume: number; release: number }
> = {
  // 鼓组(Freesound CC0,BaDokick/blakengouda/Cringegaming64yt 上传):
  // 伪音名映射到五个单响——触发时打对应"音名"即为对应鼓件
  drums: {
    files: { C1: "kick", D1: "snare", E1: "hihat", F1: "openhat", G1: "ride" },
    volume: -10,
    release: 0.2,
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
    release: 0.4,
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
    files: { D3: "D3", F3: "F3", A3: "A3", D4: "D4", "F#4": "F#4", A4: "A4" },
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

// ---------- 风格试听:多轨 pattern 播放(StyleDemo 用) ----------

/** 合成鼓件(示意音色,非真实采样):底鼓/军鼓/踩镲。 */
export type DrumHit = "kick" | "snare" | "hihat" | "openhat" | "ride";

/** 一条音符轨/和弦轨的事件。t/dur 以拍为单位。 */
export type NoteEvent = { t: number; notes: string[]; dur?: number; vel?: number };

export type PatternTrack =
  | { kind: "notes"; timbre: Timbre; events: NoteEvent[] }
  /** kit 默认 acoustic(真实采样);synth = 芯片/电子风格的原生噪声鼓 */
  | { kind: "drums"; kit?: "acoustic" | "synth"; events: { t: number; hit: DrumHit; vel?: number }[] };

export type Pattern = {
  bpm: number;
  /** 摇摆:正拍后的八分音往后挪的比例位置。0.5=平直(默认),0.62~0.67≈三连音摇摆 */
  swing?: number;
  beats: number;
  tracks: PatternTrack[];
};

type DrumKit = Record<"kick" | "snare" | "hihat" | "openhat", InstanceType<ToneModule["MembraneSynth"] | ToneModule["NoiseSynth"]>>;
let drumKit: DrumKit | null = null;
let drumKitReady: Promise<DrumKit> | null = null;

/** 采样鼓组的伪音名 → 鼓件映射(与 SAMPLES.drums.files 对应)。 */
const DRUM_NOTE: Record<DrumHit, string> = {
  kick: "C1",
  snare: "D1",
  hihat: "E1",
  openhat: "F1",
  ride: "G1",
};

/** 惰性构建合成鼓组:底鼓=膜鼓合成,军鼓/踩镲=噪声+滤波。示意用途,UI 需注明。 */
function ensureDrums(Tone: ToneModule): Promise<DrumKit> {
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
      return drumKit;
    })();
  }
  return drumKitReady;
}

/**
 * 多轨 pattern 播放:旋律/和弦轨(采样或合成音色)+ 鼓轨(合成示意)。
 * 时间以拍计,bpm 换算;swing 会把落在正拍后半拍(t 的小数部分恰为 0.5)的事件后移,
 * 模拟摇摆八分——爵士/布鲁斯的节奏灵魂。
 */
export async function playPattern(pattern: Pattern): Promise<void> {
  const spb = 60 / pattern.bpm; // 每拍秒数
  const swing = pattern.swing ?? 0.5;

  // 用到的音色先并行就绪(含采样下载),再一次性排进时间线
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
  const kit = synthDrums ? (drumKit as DrumKit) : null;
  const drumSampler = acousticDrums ? instruments.get("drums") : null;

  const swingOffset = (t: number) => {
    const frac = t - Math.floor(t);
    // 只动"正拍后半"这一格(八分音符网格),其余时值不动
    if (Math.abs(frac - 0.5) < 1e-6) return (swing - 0.5) * spb;
    return 0;
  };

  const start = Tone.now() + 0.08;
  for (const track of pattern.tracks) {
    if (track.kind === "notes") {
      const inst = instruments.get(track.timbre);
      if (!inst) continue;
      for (const ev of track.events) {
        const t = start + ev.t * spb + swingOffset(ev.t);
        const dur = (ev.dur ?? 0.5) * spb;
        const vel = ev.vel ?? 1;
        inst.triggerAttackRelease(ev.notes, dur, t, vel);
      }
    } else if (track.kind === "drums") {
      const useSynth = track.kit === "synth";
      for (const ev of track.events) {
        const t = start + ev.t * spb + swingOffset(ev.t);
        const vel = ev.vel ?? 1;
        if (!useSynth && drumSampler) {
          // 真实采样鼓:伪音名 → 鼓件;dur 给足让采样自然衰减(ride 余音最长)
          const note = DRUM_NOTE[ev.hit];
          const dur = ev.hit === "ride" || ev.hit === "openhat" ? 2.2 : 1.4;
          drumSampler.triggerAttackRelease(note, dur, t, vel);
        } else if (useSynth && kit) {
          switch (ev.hit) {
            case "kick":
              kit.kick.triggerAttackRelease("C1", "16n", t, vel);
              break;
            case "snare":
              kit.snare.triggerAttackRelease("16n", t, vel);
              break;
            case "hihat":
              kit.hihat.triggerAttackRelease("32n", t, vel);
              break;
            case "openhat":
              kit.openhat.triggerAttackRelease("8n", t, vel);
              break;
            case "ride":
              kit.openhat.triggerAttackRelease("4n", t, vel * 0.8);
              break;
          }
        }
      }
    }
  }
}
