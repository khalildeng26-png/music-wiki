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
