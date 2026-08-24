// 「一首小星星,六种曲风」的编曲数据——同一段旋律(C 大调,16 拍)换六种风格包装。
// 旋律:1 1 5 5 6 6 5- | 4 4 3 3 2 2 1-(简谱,C4 起)
import type { Pattern } from "@/components/interactive/audio";

export type StyleArrangement = {
  id: string;
  /** 风格名(按钮文案) */
  name: string;
  /** 当前版本的一句解说 */
  desc: string;
  pattern: Pattern;
};

/** 小星星旋律(四分音符,结尾长音),音高按编曲需要整体移位 */
const twinkle = (root: string[], dur = 0.9) =>
  [
    [0, 0.9],
    [1, 0.9],
    [2, 0.9],
    [3, 0.9],
    [4, 0.9],
    [5, 0.9],
    [6, 1.9],
    [8, 0.9],
    [9, 0.9],
    [10, 0.9],
    [11, 0.9],
    [12, 0.9],
    [13, 0.9],
    [14, 1.9],
  ].map(([t, d], i) => ({ t, notes: [root[i]], dur: Math.min(d, dur + 0.9), vel: 0.8 }));

export const STYLES: StyleArrangement[] = [
  {
    id: "pure",
    name: "纯净",
    desc: "课本原样:钢琴单旋律 + 简单和弦——所有版本的对照组。",
    pattern: {
      bpm: 100,
      beats: 16,
      tracks: [
        { kind: "notes", timbre: "piano", events: twinkle(["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"]) },
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["C3", "E3", "G3"], dur: 3.8, vel: 0.5 },
            { t: 4, notes: ["F3", "A3", "C4"], dur: 1.8, vel: 0.5 },
            { t: 6, notes: ["C3", "E3", "G3"], dur: 1.8, vel: 0.5 },
            { t: 8, notes: ["F3", "A3", "C4"], dur: 1.8, vel: 0.5 },
            { t: 10, notes: ["C3", "E3", "G3"], dur: 1.8, vel: 0.5 },
            { t: 12, notes: ["G2", "B2", "D3"], dur: 1.8, vel: 0.5 },
            { t: 14, notes: ["C3", "E3", "G3"], dur: 1.8, vel: 0.5 },
          ],
        },
      ],
    },
  },
  {
    id: "jazz",
    name: "爵士",
    desc: "换上 7 和弦、行走贝斯和摇摆八分——小星星走进了爵士酒吧。",
    pattern: {
      bpm: 132,
      swing: 0.65,
      beats: 16,
      tracks: [
        { kind: "notes", timbre: "piano", events: twinkle(["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"]) },
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["E3", "G3", "B3", "D4"], dur: 1.1, vel: 0.5 },
            { t: 1.5, notes: ["E3", "G3", "B3", "D4"], dur: 0.5, vel: 0.4 },
            { t: 4, notes: ["F3", "A3", "C4", "E4"], dur: 1.1, vel: 0.5 },
            { t: 5.5, notes: ["F3", "A3", "C4", "E4"], dur: 0.5, vel: 0.4 },
            { t: 8, notes: ["E3", "G3", "B3", "D4"], dur: 1.1, vel: 0.5 },
            { t: 9.5, notes: ["E3", "G3", "B3", "D4"], dur: 0.5, vel: 0.4 },
            { t: 12, notes: ["G2", "B2", "D3", "F3"], dur: 1.1, vel: 0.5 },
            { t: 13.5, notes: ["E3", "G3", "B3", "D4"], dur: 0.5, vel: 0.45 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["C2", "D2", "E2", "F2", "F2", "G2", "A2", "B2", "C3", "B2", "A2", "G2", "G2", "F2", "E2", "D2"].map(
            (n, i) => ({ t: i, notes: [n], dur: 0.95 }),
          ),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5, hit: "ride" as const, vel: 0.5 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "hihat" as const, vel: 0.5 })),
            { t: 0, hit: "kick", vel: 0.3 },
            { t: 8, hit: "kick", vel: 0.3 },
          ],
        },
      ],
    },
  },
  {
    id: "rock",
    name: "摇滚",
    desc: "电吉他扛旋律,底下强力和弦 + 真鼓 backbeat——小星星插上了电。",
    pattern: {
      bpm: 130,
      beats: 16,
      tracks: [
        { kind: "notes", timbre: "eguitar", events: twinkle(["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"], 0.8) },
        {
          kind: "notes",
          timbre: "eguitar",
          events: [
            { t: 0, notes: ["C3", "G3", "C4"], dur: 3.8, vel: 0.7 },
            { t: 4, notes: ["F2", "C3", "F3"], dur: 1.8, vel: 0.7 },
            { t: 6, notes: ["C3", "G3", "C4"], dur: 1.8, vel: 0.7 },
            { t: 8, notes: ["F2", "C3", "F3"], dur: 1.8, vel: 0.7 },
            { t: 10, notes: ["C3", "G3", "C4"], dur: 1.8, vel: 0.7 },
            { t: 12, notes: ["G2", "D3", "G3"], dur: 1.8, vel: 0.7 },
            { t: 14, notes: ["C3", "G3", "C4"], dur: 1.8, vel: 0.7 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            ...Array.from({ length: 8 }, (_, i) => ({ t: i * 0.5, notes: ["C2"], dur: 0.45 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 4 + i * 0.5, notes: ["F1"], dur: 0.45 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 6 + i * 0.5, notes: ["C2"], dur: 0.45 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 8 + i * 0.5, notes: ["F1"], dur: 0.45 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 10 + i * 0.5, notes: ["C2"], dur: 0.45 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 12 + i * 0.5, notes: ["G1"], dur: 0.45 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 14 + i * 0.5, notes: ["C2"], dur: 0.45 })),
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 8 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.8 })),
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.42 })),
            { t: 0, hit: "openhat", vel: 0.6 },
          ],
        },
      ],
    },
  },
  {
    id: "folk-cn",
    name: "民乐",
    desc: "笛子高八度唱主旋律,古筝在底下琶音——小星星穿上了汉服。",
    pattern: {
      bpm: 96,
      beats: 16,
      tracks: [
        { kind: "notes", timbre: "dizi", events: twinkle(["C6", "C6", "G5", "G5", "A5", "A5", "G5", "F5", "F5", "E6", "E6", "D6", "D6", "C6"], 0.9) },
        {
          kind: "notes",
          timbre: "guzheng",
          events: [
            ...Array.from({ length: 4 }, (_, bar) => {
              const off = bar * 4;
              const tones = bar % 2 === 0 ? ["A3", "C4", "E4", "A4"] : ["G3", "C4", "D4", "A4"];
              return tones.map((n, i) => ({ t: off + i, notes: [n], dur: 0.9, vel: 0.5 }));
            }).flat(),
          ],
        },
      ],
    },
  },
  {
    id: "chip",
    name: "8bit",
    desc: "方波 + 噪声鼓——小星星掉进了红白机。",
    pattern: {
      bpm: 160,
      beats: 16,
      tracks: [
        { kind: "notes", timbre: "chip", events: twinkle(["C5", "C5", "G5", "G5", "A5", "A5", "G5", "F5", "F5", "E5", "E5", "D5", "D5", "C5"], 0.7) },
        {
          kind: "notes",
          timbre: "chip",
          events: ["C3", "C3", "C4", "C3", "F2", "F2", "F3", "F2", "C3", "C3", "C4", "C3", "G2", "G2", "G3", "C3"].map(
            (n, i) => ({ t: i, notes: [n], dur: 0.9, vel: 0.9 }),
          ),
        },
        {
          kind: "drums",
          kit: "synth",
          events: [
            ...Array.from({ length: 8 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.9 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.75 })),
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.45 })),
          ],
        },
      ],
    },
  },
  {
    id: "edm",
    name: "舞曲",
    desc: "底鼓每拍都踩、贝斯全在反拍——小星星登上了音乐节舞台。",
    pattern: {
      bpm: 126,
      beats: 16,
      tracks: [
        { kind: "notes", timbre: "synth", events: twinkle(["C5", "C5", "G5", "G5", "A5", "A5", "G5", "F5", "F5", "E5", "E5", "D5", "D5", "C5"], 0.7) },
        {
          kind: "notes",
          timbre: "synth",
          events: [
            ...Array.from({ length: 8 }, () => "C2").map((n, i) => ({ t: i * 0.5 + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 4 }, () => "F2").map((n, i) => ({ t: 4 + i * 0.5 + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 4 }, () => "C2").map((n, i) => ({ t: 6 + i * 0.5 + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 4 }, () => "F2").map((n, i) => ({ t: 8 + i * 0.5 + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 4 }, () => "C2").map((n, i) => ({ t: 10 + i * 0.5 + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 4 }, () => "G2").map((n, i) => ({ t: 12 + i * 0.5 + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 4 }, () => "C2").map((n, i) => ({ t: 14 + i * 0.5 + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 16 }, (_, i) => ({ t: i, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.6 })),
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5 + 0.5, hit: "hihat" as const, vel: 0.5 })),
            { t: 0, hit: "openhat", vel: 0.5 },
          ],
        },
      ],
    },
  },
];
