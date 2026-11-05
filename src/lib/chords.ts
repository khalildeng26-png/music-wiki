/** 吉他和弦库(与交互组件同源的数据层):43 个和弦 + 指法分组 + 按品几何。
 *  纯数据/纯函数,无 React 依赖——Guitar 组件与和弦反查工具(ChordFinder)共用。
 *  移植自小程序 miniprogram/miniprogram/shared/chords.ts(同源同数据;
 *  web 端 43 个为扩充版,小程序仍为 29 个,后续同步)。 */

import { transposeNote } from './transpose';

/** 标准定弦(六弦→一弦)。 */
export const STRINGS = ["E2", "A2", "D3", "G3", "B3", "E4"] as const;

export type Chord = {
  name: string;
  frets: number[];
  /** 指法编号(1=食指…4=小指,0=空弦/闷弦);小圆点里的数字 */
  fingers: number[];
  /** 横按提示(如 F/Bm 的食指横按) */
  barre?: boolean;
  /** 同位异指的多按法(位置与音完全不变,只换手指分配)。
   *  指法选择是战略:空出哪根手指,决定这个和弦能怎么被装饰。
   *  variants 含默认版为第一项,其 fingers 与顶层一致。 */
  variants?: { label: string; fingers: number[]; note?: string }[];
  /** 分组(基本/七和弦/挂留加音/横按),用于分类筛选 */
  group: (typeof GROUPS)[number];
};

export const GROUPS = ["基本", "七和弦", "挂留加音", "横按", "斜杠"] as const;
export const CHORDS: Chord[] = [
  // ── 基本:入门开放和弦 ──
  { name: "C", frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], group: "基本" },
  {
    name: "G",
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    variants: [
      {
        label: "123·留小指",
        fingers: [2, 1, 0, 0, 0, 3],
        note: "空出小拇指,可临时去够二弦三品这类加音",
      },
      {
        label: "234·留食指",
        fingers: [2, 3, 0, 0, 0, 4],
        note: "空出食指,二弦一品(C 音)随时能按;歌里要给 G 挂 C 色彩时用它",
      },
    ],
    group: "基本",
  },
  { name: "D", frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], group: "基本" },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], group: "基本" },
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], group: "基本" },
  {
    name: "E",
    frets: [0, 2, 2, 1, 1, 0],
    fingers: [0, 2, 3, 1, 1, 0],
    variants: [
      {
        label: "三指·留小指",
        fingers: [0, 2, 3, 1, 1, 0],
        note: "食指小横按压一品两弦;也是 F 大横按的前身",
      },
      {
        label: "四指",
        fingers: [0, 3, 4, 1, 2, 0],
        note: "一品两弦分给食指中指,二品两弦分给无名指小指;每弦一指,职责清楚",
      },
    ],
    group: "基本",
  },
  {
    name: "A",
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    variants: [
      { label: "三指", fingers: [0, 0, 1, 2, 3, 0], note: "二品三根弦各用一指;最通用的版本" },
      {
        label: "横按·留三指",
        fingers: [0, 0, 1, 1, 1, 0],
        note: "食指横压二品三根弦,空出中指无名指小指加音;A 型大横按的前身",
      },
    ],
    group: "基本",
  },
  { name: "Dm", frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], group: "基本" },
  { name: "F", frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: true, group: "基本" },
  // ── 七和弦:布鲁斯与流行的色彩主力 ──
  { name: "G7", frets: [3, 2, 0, 0, 0, 1], fingers: [2, 1, 0, 0, 0, 3], group: "七和弦" },
  { name: "C7", frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], group: "七和弦" },
  { name: "D7", frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], group: "七和弦" },
  { name: "A7", frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0], group: "七和弦" },
  { name: "E7", frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], group: "七和弦" },
  { name: "Em7", frets: [0, 2, 2, 0, 3, 0], fingers: [0, 2, 3, 0, 4, 0], group: "七和弦" },
  { name: "Am7", frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], group: "七和弦" },
  { name: "Dm7", frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], group: "七和弦" },
  { name: "B7", frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], group: "七和弦" },
  // ── 大七:日系/流行的朦胧色彩,ii-V-I 爵士入门必需 ──
  { name: "Cmaj7", frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], group: "七和弦" },
  { name: "Fmaj7", frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], group: "七和弦" },
  { name: "Gmaj7", frets: [3, -1, 0, 0, 0, 2], fingers: [2, 0, 0, 0, 0, 1], group: "七和弦" },
  { name: "Dmaj7", frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], group: "七和弦" },
  { name: "Amaj7", frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], group: "七和弦" },
  // ── 小七(横按族):E 调/D 调常用 ──
  { name: "Bm7", frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3], group: "七和弦" },
  {
    name: "F#m7",
    frets: [2, -1, 2, 2, 2, 2],
    fingers: [1, 0, 1, 1, 1, 1],
    barre: true,
    group: "七和弦",
  },
  // ── 挂留/加音: Modifier 色彩 ──
  { name: "Dsus4", frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4], group: "挂留加音" },
  { name: "Dsus2", frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], group: "挂留加音" },
  { name: "Asus2", frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], group: "挂留加音" },
  { name: "Asus4", frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], group: "挂留加音" },
  { name: "Esus4", frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 1, 0, 0], group: "挂留加音" },
  { name: "Csus4", frets: [-1, 3, 3, 0, 1, -1], fingers: [0, 3, 4, 0, 1, 0], group: "挂留加音" },
  { name: "Gsus4", frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4], group: "挂留加音" },
  { name: "Cadd9", frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], group: "挂留加音" },
  // ── 六和弦:老歌/爵士的收尾甜味 ──
  { name: "C6", frets: [-1, 3, 2, 2, 1, 0], fingers: [0, 3, 2, 1, 1, 0], group: "挂留加音" },
  // ── 横按:F 之后的大关 ──
  {
    name: "Bm",
    frets: [-1, 2, 4, 4, 3, 2],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: true,
    group: "横按",
  },
  { name: "B♭", frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], group: "横按" },
  {
    name: "F#m",
    frets: [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: true,
    group: "横按",
  },
  {
    name: "Gm",
    frets: [3, 5, 5, 3, 3, 3],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: true,
    group: "横按",
  },
  {
    name: "Cm",
    frets: [-1, 3, 5, 5, 4, 3],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: true,
    group: "横按",
  },
  {
    name: "G#m",
    frets: [4, 6, 6, 4, 4, 4],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: true,
    group: "横按",
  },
  // ── 斜杠:指定低音的转位,民谣低音下行(C→G/B→Am)刚需 ──
  { name: "G/B", frets: [-1, 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 3], group: "斜杠" },
  { name: "C/E", frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], group: "斜杠" },
  { name: "D/F#", frets: [2, -1, 0, 2, 3, -1], fingers: [1, 0, 0, 2, 3, 0], group: "斜杠" },
];

/** 指法分组:把按品拆成「横杆(同指同品的连续弦段≥2)」与「独立圆点」。
 *  barre=true 的全横按(F/Bm/Gm…):最低品整杆由指 1 覆盖,其余手指画独立点。 */
export function groupChord(chord: Chord): {
  bars: { s0: number; s1: number; fret: number; finger: number }[];
  dots: { s: number; fret: number; finger: number }[];
  pressed: { s: number; fret: number }[];
} {
  const pairs = chord.frets
    .map((f, s) => ({ s, f, g: chord.fingers[s] }))
    .filter((p) => p.f > 0)
    .sort((a, b) => a.s - b.s);
  const bars: { s0: number; s1: number; fret: number; finger: number }[] = [];
  const dots: { s: number; fret: number; finger: number }[] = [];
  if (chord.barre) {
    const fret = Math.min(...pairs.map((p) => p.f));
    bars.push({ s0: pairs[0].s, s1: pairs[pairs.length - 1].s, fret, finger: 1 });
    for (const p of pairs) if (p.g !== 1) dots.push({ s: p.s, fret: p.f, finger: p.g });
  } else {
    for (let i = 0; i < pairs.length;) {
      let j = i;
      while (
        j + 1 < pairs.length &&
        pairs[j + 1].s === pairs[j].s + 1 &&
        pairs[j + 1].g === pairs[i].g &&
        pairs[j + 1].f === pairs[i].f
      )
        j++;
      if (j > i)
        bars.push({ s0: pairs[i].s, s1: pairs[j].s, fret: pairs[i].f, finger: pairs[i].g });
      else dots.push({ s: pairs[i].s, fret: pairs[i].f, finger: pairs[i].g });
      i = j + 1;
    }
  }
  return { bars, dots, pressed: pairs.map((p) => ({ s: p.s, fret: p.f })) };
}

/** 和弦的实际音(低→高,跳过闷弦);空弦加 0 个半音,按品加对应半音。 */
export function chordNotes(c: Chord): string[] {
  return fretsToNotes(c.frets);
}

/** 把位记号:有空弦或最低按品=1 → 1,否则最低按品(高把位和弦如 Gm/Cm 从第 3 品起)。 */
export function chordPosition(chord: Chord): number {
  const fretted = chord.frets.filter((f) => f > 0);
  if (fretted.length === 0 || chord.frets.includes(0) || Math.min(...fretted) === 1) return 1;
  return Math.min(...fretted);
}

/** 按品数据 → 音名(转调作用于音名层)。 */
export function fretsToNotes(frets: number[]): string[] {
  const out: string[] = [];
  frets.forEach((f, i) => {
    if (f >= 0) out.push(transposeNote(STRINGS[i], f));
  });
  return out;
}
