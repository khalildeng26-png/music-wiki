// 音频引擎:Tone.js 动态加载(SSR 安全),按用户手势启动 AudioContext,单例合成器。
type ToneModule = typeof import("tone");

let ToneMod: ToneModule | null = null;
let synth: InstanceType<ToneModule["PolySynth"]> | null = null;

async function getTone(): Promise<ToneModule> {
  if (!ToneMod) ToneMod = await import("tone");
  return ToneMod;
}

async function ensureAudio() {
  const Tone = await getTone();
  await Tone.start();
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = -8;
  }
  return { Tone, synth };
}

/** 顺序播放一串音名(如 ["C4","D4","E4"])。 */
export async function playSequence(
  notes: string[],
  dur = 0.45,
  gap = 0.08,
) {
  const { Tone, synth } = await ensureAudio();
  const start = Tone.now() + 0.06;
  notes.forEach((n, i) => {
    synth.triggerAttackRelease(n, dur, start + i * (dur + gap));
  });
}

/** 播放单个音名。 */
export async function playNote(note: string, dur = 0.7) {
  const { Tone, synth } = await ensureAudio();
  synth.triggerAttackRelease(note, dur, Tone.now() + 0.02);
}
