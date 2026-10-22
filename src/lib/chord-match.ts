/** 和弦反查匹配(纯函数):按音集合 → 和弦候选。
 *  与小程序 miniprogram/miniprogram/shared/chords.ts 同源,两端行为一致。
 *
 *  两层答案:
 *  1. 「这是什么和弦」:按**音级集合**(忽略八度)比对和弦库
 *  2. 「这个按法怎么按」:若点击位置与库中某和弦的标准把位完全一致,给出该指法
 */

import { CHORDS, chordNotes, type Chord } from './chords';

/** 音名 → 音级(去掉八度):"Bb3" → "Bb" */
export function pitchClass(note: string): string {
  return note.replace(/-?\d+$/, '');
}

export type MatchKind = 'exact' | 'missing' | 'extra' | 'near';

export type MatchResult = {
  chord: Chord;
  kind: MatchKind;
  /** 和弦里有、用户没按的音 */
  missing: string[];
  /** 用户多按的音 */
  extra: string[];
  /** 该和弦的音级集合 */
  notes: string[];
  /** 排序用:越小越像 */
  score: number;
  /** 点击位置与该和弦的标准按法完全一致(同音异名时靠它定夺) */
  shapeMatch: boolean;
};

/** 集合差异(忽略顺序) */
function diff(a: string[], b: string[]): string[] {
  const set = new Set(a);
  return b.filter((x) => !set.has(x));
}

/** 位置集合的规范化键(用于按法比对) */
function shapeKey(ps: { s: number; f: number }[]): string {
  return ps
    .map((p) => `${p.s}:${p.f}`)
    .sort()
    .join(',');
}

/**
 * 按音名集合匹配和弦。notes 为用户按出的音(可含八度,内部取音级)。
 * positions 若给出,标准按法完全一致的和弦优先(解决 Dsus2/Asus4 这类同音异名)。
 */
export function matchChords(
  notes: string[],
  top = 3,
  positions?: { s: number; f: number }[],
): MatchResult[] {
  const user = [...new Set(notes.map(pitchClass))].sort();
  if (user.length === 0) return [];

  // 用户按法的键集合(空弦也计入,0 品)
  const mineKey = positions && positions.length ? shapeKey(positions) : '';

  const results: MatchResult[] = [];
  for (const chord of CHORDS) {
    const cn = [...new Set(chordNotes(chord).map(pitchClass))].sort();
    const missing = diff(user, cn); // 和弦有、用户没按
    const extra = diff(cn, user); // 用户多按
    const kind: MatchKind =
      missing.length === 0 && extra.length === 0 ? 'exact' : missing.length === 0 ? 'extra' : extra.length === 0 ? 'missing' : 'near';
    // 评分:完全一致 0;只差 1 个音 1;差得越多越大;多按的音权重略低(加音是常见手法)
    const score = missing.length + extra.length * 0.5;
    // 按法完全一致 → 认定为标准按法(同音异名时以按法定夺)
    const target = chord.frets
      .map((f, s) => ({ s, f }))
      .filter((p) => p.f >= 0);
    const shapeMatch = mineKey !== '' && shapeKey(target) === mineKey;
    results.push({ chord, kind, missing, extra, notes: cn, score, shapeMatch });
  }

  return results
    .filter((r) => r.kind !== 'near' || r.score <= 2.5)
    .sort(
      (a, b) =>
        Number(b.shapeMatch) - Number(a.shapeMatch) ||
        a.score - b.score ||
        a.chord.name.localeCompare(b.chord.name),
    )
    .slice(0, top);
}

/** 位置匹配:点击的 (弦,品) 集合是否与某和弦的标准把位完全一致。 */
export function matchShape(
  positions: { s: number; f: number }[],
): { chord: Chord; variantIndex: number } | null {
  if (positions.length === 0) return null;
  const key = (ps: { s: number; f: number }[]) =>
    ps
      .map((p) => `${p.s}:${p.f}`)
      .sort()
      .join(',');
  const mine = key(positions);
  for (const chord of CHORDS) {
    const target = chord.frets
      .map((f, s) => ({ s, f }))
      .filter((p) => p.f >= 0); // 空弦也算(0 品)
    if (key(target) === mine) return { chord, variantIndex: 0 };
  }
  return null;
}

/** 按位差找最接近的按法(允许少按/多按)。 */
export function nearestShape(
  positions: { s: number; f: number }[],
): { chord: Chord; missing: string[]; extra: string[] } | null {
  if (positions.length === 0) return null;
  const mineSet = new Set(positions.map((p) => `${p.s}:${p.f}`));
  let best: { chord: Chord; missing: string[]; extra: string[]; d: number } | null = null;
  for (const chord of CHORDS) {
    const target = chord.frets
      .map((f, s) => ({ s, f }))
      .filter((p) => p.f >= 0);
    const tSet = new Set(target.map((p) => `${p.s}:${p.f}`));
    const missing = [...tSet].filter((x) => !mineSet.has(x));
    const extra = [...mineSet].filter((x) => !tSet.has(x));
    const d = missing.length + extra.length;
    if (!best || d < best.d) best = { chord, missing, extra, d };
  }
  if (!best) return null;
  // missing/extra 用「弦+品」描述,便于渲染成提示文字
  return { chord: best.chord, missing: best.missing, extra: best.extra };
}
