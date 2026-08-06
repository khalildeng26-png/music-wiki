export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/** 把科学音名(如 "C4"、"F#5"、"Bb3")转成 ABC 记谱法的音名。 */
export function toAbc(note: string): string {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  if (!m) return note;
  const letter = m[1];
  const acc = m[2] === "#" ? "^" : m[2] === "b" ? "_" : "";
  const oct = parseInt(m[3], 10);
  const abcLetter = oct >= 5 ? letter.toLowerCase() : letter;
  let suffix = "";
  if (oct <= 3) suffix = ",".repeat(4 - oct);
  if (oct >= 6) suffix = "'".repeat(oct - 5);
  return acc + abcLetter + suffix;
}

const PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const NAME_BY_PC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** 科学音名 → MIDI 数(如 E4 = 64)。 */
export function noteToMidi(note: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  if (!m) return 60;
  const letter = m[1];
  const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  const oct = parseInt(m[3], 10);
  let pc = PITCH_CLASS[letter] + acc;
  if (pc < 0) pc += 12;
  return (oct + 1) * 12 + pc;
}

/** MIDI 数 → 科学音名(用升号记法)。 */
export function midiToNote(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const oct = Math.floor(midi / 12) - 1;
  return NAME_BY_PC[pc] + oct;
}
