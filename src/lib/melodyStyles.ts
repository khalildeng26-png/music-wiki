// 「一首卡农,六种曲风」的编曲数据——帕赫贝尔卡农移到 C 大调,
// 地面低音 8 个和弦 × 2 拍 = 16 拍:C G Am Em F C F G(卡农进行)。
// 主题旋律(二分音符):E5 D5 C5 B4 A4 G4 A4 B4,各版本按乐器音域移位。
import type { Pattern } from "@/components/interactive/audio";

export type StyleArrangement = {
  id: string;
  /** 风格名(按钮文案) */
  name: string;
  /** 当前版本的一句解说 */
  desc: string;
  pattern: Pattern;
};

/** 卡农进行:每和弦 2 拍,共 16 拍 */
const CHORDS = ["C", "G", "Am", "Em", "F", "C", "F", "G"] as const;

/** 主题旋律(8 个二分音符);octave 参数整体移位 */
const theme = (melody: string[], vel = 0.8) =>
  melody.map((n, i) => ({ t: i * 2, notes: [n], dur: 1.9, vel }));

/** 每和弦单元(u:0-7,起拍 u*2)的工具 */
const unit = (u: number) => u * 2;

export const STYLES: StyleArrangement[] = [
  {
    id: "pure",
    name: "钢琴",
    desc: "没有风格包装的对照版:钢琴主题 + 原样和弦——下面五个版本都由它「变装」而来。",
    pattern: {
      bpm: 84,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 1.0),
        },
        {
          kind: "notes",
          timbre: "piano",
          events: [
            ["C4", "E4", "G4"],
            ["G3", "B3", "D4"],
            ["A3", "C4", "E4"],
            ["G3", "B3", "E4"],
            ["F3", "A3", "C4"],
            ["C4", "E4", "G4"],
            ["F3", "A3", "C4"],
            ["G3", "B3", "D4"],
          ].map((ch, u) => ({ t: unit(u), notes: ch, dur: 1.8, vel: 0.6 })),
        },
      ],
    },
  },
  {
    id: "jazz",
    name: "爵士",
    desc: "和弦全部泡进 7 音,贝斯四拍一音地走,ride 摇摆——卡农走进爵士酒吧。",
    pattern: {
      bpm: 96,
      swing: 0.63,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.75),
        },
        {
          kind: "notes",
          timbre: "piano",
          events: [
            ["E3", "G3", "B3", "D4"], // Cmaj7
            ["F3", "A3", "B3", "D4"], // G9(根音省略)
            ["A3", "C4", "E4", "G4"], // Am7
            ["E3", "G3", "B3", "D4"], // Em7
            ["F3", "A3", "C4", "E4"], // Fmaj7
            ["E3", "G3", "B3", "D4"], // Cmaj7
            ["F3", "A3", "C4", "E4"], // Fmaj7
            ["G3", "B3", "D4", "F4"], // G7
          ].flatMap((ch, u) => [
            { t: unit(u), notes: ch, dur: 0.9, vel: 0.5 },
            { t: unit(u) + 1.5, notes: ch, dur: 0.4, vel: 0.4 },
          ]),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            "C2",
            "E2",
            "G1",
            "D2",
            "A1",
            "E2",
            "E2",
            "B2",
            "F2",
            "C3",
            "C2",
            "G2",
            "F2",
            "C3",
            "G2",
            "D3",
          ].map((n, i) => ({ t: i, notes: [n], dur: 0.95 })),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 32 }, (_, i) => ({
              t: i * 0.5,
              hit: "ride" as const,
              vel: 0.5,
            })),
            ...Array.from({ length: 8 }, (_, i) => ({
              t: 1 + i * 2,
              hit: "hihat" as const,
              vel: 0.5,
            })),
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
    desc: "电吉他把主题压低八度扛起来,强力和弦每两拍换一个——卡农插上了电。",
    pattern: {
      bpm: 132,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "eguitar",
          events: theme(["E4", "D4", "C4", "B3", "A3", "G3", "A3", "B3"], 0.8),
        },
        {
          kind: "notes",
          timbre: "eguitar",
          events: [
            ["C3", "G3", "C4"],
            ["G2", "D3", "G3"],
            ["A2", "E3", "A3"],
            ["E2", "B2", "E3"],
            ["F2", "C3", "F3"],
            ["C3", "G3", "C4"],
            ["F2", "C3", "F3"],
            ["G2", "D3", "G3"],
          ].flatMap((ch, u) =>
            Array.from({ length: 4 }, (_, i) => ({
              t: unit(u) + i * 0.5,
              notes: ch,
              dur: 0.42,
              vel: 0.8,
            })),
          ),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["C2", "G1", "A1", "E1", "F1", "C2", "F1", "G1"].flatMap((root, u) =>
            Array.from({ length: 4 }, (_, i) => ({
              t: unit(u) + i * 0.5,
              notes: [root],
              dur: 0.45,
            })),
          ),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 8 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 8 }, (_, i) => ({
              t: 1 + i * 2,
              hit: "snare" as const,
              vel: 0.8,
            })),
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.45 })),
            { t: 0, hit: "openhat", vel: 0.6 },
          ],
        },
      ],
    },
  },
  {
    id: "folk-cn",
    name: "民乐",
    desc: "笛子高八度唱主题,古筝八分琶音铺底——卡农穿上了汉服。",
    pattern: {
      bpm: 84,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "dizi",
          events: theme(["E6", "D6", "C6", "B5", "A5", "G5", "A5", "B5"], 0.75),
        },
        {
          kind: "notes",
          timbre: "guzheng",
          events: Array.from({ length: 8 }, (_, u) => {
            const tones = u % 2 === 0 ? ["A3", "C4", "E4", "A4"] : ["G3", "C4", "D4", "A4"];
            return tones.map((n, i) => ({ t: unit(u) + i * 0.5, notes: [n], dur: 0.42, vel: 0.5 }));
          }).flat(),
        },
      ],
    },
  },
  {
    id: "chip",
    name: "8bit",
    desc: "方波唱主题,方波低八度在底下蹦——卡农掉进了红白机。",
    pattern: {
      bpm: 140,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "chip",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.7),
        },
        {
          kind: "notes",
          timbre: "chip",
          events: ["C3", "G1", "A1", "E1", "F1", "C2", "F1", "G1"].flatMap((root, u) =>
            Array.from({ length: 4 }, (_, i) => ({
              t: unit(u) + i * 0.5,
              notes: [root],
              dur: 0.4,
              vel: 0.85,
            })),
          ),
        },
        {
          kind: "drums",
          kit: "synth",
          events: [
            ...Array.from({ length: 8 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.9 })),
            ...Array.from({ length: 8 }, (_, i) => ({
              t: 1 + i * 2,
              hit: "snare" as const,
              vel: 0.75,
            })),
            ...Array.from({ length: 32 }, (_, i) => ({
              t: i * 0.5,
              hit: "hihat" as const,
              vel: 0.45,
            })),
          ],
        },
      ],
    },
  },
  {
    id: "edm",
    name: "舞曲",
    desc: "主题变成四分音符脉冲,底鼓每拍都踩——卡农登上了音乐节舞台。",
    pattern: {
      bpm: 126,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "synth",
          events: [
            "E5",
            "E5",
            "D5",
            "D5",
            "C5",
            "C5",
            "B4",
            "B4",
            "A4",
            "A4",
            "G4",
            "G4",
            "A4",
            "A4",
            "B4",
            "B4",
          ].map((n, i) => ({ t: i, notes: [n], dur: 0.85, vel: 0.75 })),
        },
        {
          kind: "notes",
          timbre: "synth",
          events: ["C2", "G1", "A1", "E1", "F1", "C2", "F1", "G1"].flatMap((root, u) =>
            Array.from({ length: 4 }, (_, i) => ({
              t: unit(u) + i * 0.5 + 0.5,
              notes: [root],
              dur: 0.3,
              vel: 0.8,
            })),
          ),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 16 }, (_, i) => ({ t: i, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 8 }, (_, i) => ({
              t: 1 + i * 2,
              hit: "snare" as const,
              vel: 0.6,
            })),
            // 真反拍:只在每个正拍的后半
            ...Array.from({ length: 16 }, (_, i) => ({
              t: i + 0.5,
              hit: "hihat" as const,
              vel: 0.45,
            })),
            { t: 0, hit: "openhat", vel: 0.5 },
          ],
        },
      ],
    },
  },
];

// 每版转 2 遍(8 小节卡农进行,更完整)
STYLES.forEach((s) => (s.pattern.repeat = 2));
