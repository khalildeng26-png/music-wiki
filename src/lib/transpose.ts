// 移调工具:科学音名按半音平移。
// 采样音色靠锚点重采样,±5 半音内音色自然,超出会明显劣化——调用方应限制范围。

import { noteToMidi, midiToNote } from "@/components/interactive/noteUtils";

/** 单个音名移调 n 个半音(如 "C4", +2 → "D4")。无法解析时原样返回。 */
export function transposeNote(note: string, semis: number): string {
  if (!semis) return note;
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  if (!m) return note;
  return midiToNote(noteToMidi(note) + semis);
}

/** 音名数组整体移调(每个元素独立平移)。 */
export function transposeNotes(notes: string[], semis: number): string[] {
  return notes.map((n) => transposeNote(n, semis));
}

/** 和弦进行([[根音..],..] 或 [音名..])整体移调。 */
export function transposeChords(chords: string[][], semis: number): string[][] {
  return chords.map((ch) => transposeNotes(ch, semis));
}

/** 采样重采样的舒适区(±5 半音);超出时音色开始劣化 */
export const TRANSPOSE_SAFE = 5;

/** 可用的半音偏移选项(以 0 为中心,±TRANSPOSE_SAFE) */
export const TRANSPOSE_STEPS: { semis: number; label: string }[] = (() => {
  const NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return Array.from({ length: TRANSPOSE_SAFE * 2 + 1 }, (_, i) => {
    const s = i - TRANSPOSE_SAFE;
    return { semis: s, label: `${s === 0 ? "原调" : (s > 0 ? "+" : "") + s + " (" + NAME[((s % 12) + 12) % 12] + ")"}` };
  });
})();
