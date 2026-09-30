// 「一首卡农,六种曲风」的编曲数据——帕赫贝尔卡农移到 C 大调,
// 地面低音 8 个和弦 × 2 拍 = 16 拍:C G Am Em F C F G(卡农进行)。
// 主题旋律(二分音符):E5 D5 C5 B4 A4 G4 A4 B4,各版本按乐器音域移位。
// 2026-09-03 换血:凯尔特/进行曲/新世纪/蓝调/放克;2026-09-10 第三批:
// 古典/蓝草/R&B/嘻哈/流行,且「钢琴·原形」升级为迷你原曲结构——
// 主题 → 第二声部隔一小节追进来(真卡农) → 左手八分跑动(加花变奏),
// 对应帕赫贝尔原曲「固定低音上的多声部变奏」,不再原地重复。
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

/** 卡农各级根音(低八度,供 bass 用) */
const ROOTS = ["C2", "G1", "A1", "E1", "F1", "C2", "F1", "G1"] as const;
/** 根音上五度(oom-pah 的 pah / 蓝草贝斯的 5) */
const FIFTHS = ["G2", "D2", "E2", "B1", "C2", "G2", "C2", "D2"] as const;

export const STYLES: StyleArrangement[] = [
  {
    id: "pure",
    name: "钢琴",
    desc: "迷你版原曲:先主题,再让第二个声部隔一小节追进来(这才是「卡农」),最后左手跑起来——原曲就是这样一遍遍加花的。",
    pattern: {
      bpm: 84,
      beats: 32,
      repeat: 1,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          // 第一遍:主题(二分音符);第二遍:五度-三度四分音符变奏(原曲第三变奏的形态)
          events: [
            ...theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.9),
            ...[
              ["G5", "E5"],
              ["D5", "B4"],
              ["E5", "C5"],
              ["B4", "G4"],
              ["C5", "A4"],
              ["G5", "E5"],
              ["C5", "A4"],
              ["D5", "B4"],
            ].flatMap((pair, u) =>
              pair.map((n, i) => ({ t: 16 + unit(u) + i, notes: [n], dur: 0.9, vel: 0.8 })),
            ),
          ],
        },
        {
          kind: "notes",
          timbre: "piano",
          // 第二声部:同一主题晚 4 拍(一小节)追进来——两声部互相追赶,卡农本义
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.55).map((e) => ({
            ...e,
            t: e.t + 4,
          })),
        },
        {
          kind: "notes",
          timbre: "piano",
          // 第一遍:柱式和弦;第二遍:左手八音跑动(加花)
          events: [
            ...[
              ["C4", "E4", "G4"],
              ["G3", "B3", "D4"],
              ["A3", "C4", "E4"],
              ["G3", "B3", "E4"],
              ["F3", "A3", "C4"],
              ["C4", "E4", "G4"],
              ["F3", "A3", "C4"],
              ["G3", "B3", "D4"],
            ].map((ch, u) => ({ t: unit(u), notes: ch, dur: 1.8, vel: 0.5 })),
            ...[
              ["C3", "G3", "E3", "G3"],
              ["G2", "D3", "B3", "D3"],
              ["A2", "E3", "C3", "E3"],
              ["E2", "B2", "G2", "B2"],
              ["F2", "C3", "A3", "C3"],
              ["C3", "G3", "E3", "G3"],
              ["F2", "C3", "A3", "C3"],
              ["G2", "D3", "B3", "D3"],
            ].flatMap((arp, u) =>
              arp.map((n, i) => ({ t: 16 + unit(u) + i * 0.5, notes: [n], dur: 0.42, vel: 0.5 })),
            ),
          ],
        },
      ],
    },
  },
  {
    id: "classical",
    name: "古典",
    desc: "小提琴在上面规整地唱,钢琴左手「低-高-中-高」地分解(阿尔贝蒂低音)——卡农回到了古典时期的客厅。",
    pattern: {
      bpm: 96,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "violin",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.75),
        },
        {
          kind: "notes",
          timbre: "piano",
          // 阿尔贝蒂低音:每和弦「根-五-三-五」四分音符
          events: [
            ["C3", "G3", "E3", "G3"],
            ["G2", "D3", "B3", "D3"],
            ["A2", "E3", "C3", "E3"],
            ["E2", "B2", "G2", "B2"],
            ["F2", "C3", "A3", "C3"],
            ["C3", "G3", "E3", "G3"],
            ["F2", "C3", "A3", "C3"],
            ["G2", "D3", "B3", "D3"],
          ].flatMap((arp, u) =>
            arp.map((n, i) => ({ t: unit(u) + i, notes: [n], dur: 0.9, vel: 0.5 })),
          ),
        },
      ],
    },
  },
  {
    id: "bluegrass",
    name: "蓝草",
    desc: "132 BPM 的山地快车:小提琴扛主题,吉他根音-扫弦地弹,贝斯一五一十——卡农开进了蓝草 jam 场。",
    pattern: {
      bpm: 132,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "violin",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.8),
        },
        {
          kind: "notes",
          timbre: "guitar",
          // boom-chuck:正拍低音、反拍轻扫
          events: [
            ["C3", "E3", "G3"],
            ["G2", "B2", "D3"],
            ["A2", "C3", "E3"],
            ["E2", "G2", "B2"],
            ["F2", "A2", "C3"],
            ["C3", "E3", "G3"],
            ["F2", "A2", "C3"],
            ["G2", "B2", "D3"],
          ].flatMap((ch, u) => [
            { t: unit(u), notes: [ch[0]], dur: 0.4, vel: 0.6 },
            { t: unit(u) + 1, notes: ch, dur: 0.35, vel: 0.5 },
          ]),
        },
        {
          kind: "notes",
          timbre: "bass",
          // 站立贝斯:根音与五度各占一拍
          events: ROOTS.flatMap((root, u) => [
            { t: unit(u), notes: [root], dur: 0.85, vel: 0.75 },
            { t: unit(u) + 1, notes: [FIFTHS[u]], dur: 0.85, vel: 0.65 },
          ]),
        },
      ],
    },
  },
  {
    id: "rnb",
    name: "R&B",
    desc: "和弦全泡进 7 音,落点总比拍子晚半口气(黏),鼓点松松地拖——卡农换上了丝绒西装。",
    pattern: {
      bpm: 86,
      swing: 0.6,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.7),
        },
        {
          kind: "notes",
          timbre: "piano",
          // 七和弦:正拍长按 + 反拍推一下(「黏」的落点)
          events: [
            ["C4", "E4", "G4", "B4"], // Cmaj7
            ["G3", "B3", "D4", "F4"], // G7
            ["A3", "C4", "E4", "G4"], // Am7
            ["E3", "G3", "B3", "D4"], // Em7
            ["F3", "A3", "C4", "E4"], // Fmaj7
            ["C4", "E4", "G4", "B4"],
            ["F3", "A3", "C4", "E4"],
            ["G3", "B3", "D4", "F4"],
          ].flatMap((ch, u) => [
            { t: unit(u), notes: ch, dur: 1.1, vel: 0.55 },
            { t: unit(u) + 1.5, notes: ch, dur: 0.6, vel: 0.45 },
          ]),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ROOTS.flatMap((root, u) => [
            { t: unit(u), notes: [root], dur: 1.0, vel: 0.8 },
            { t: unit(u) + 1.25, notes: [root], dur: 0.5, vel: 0.6 },
          ]),
        },
        {
          kind: "drums",
          events: [
            ...ROOTS.flatMap((_, u) => [
              { t: unit(u), hit: "kick" as const, vel: 0.5 },
              { t: unit(u) + 1.25, hit: "kick" as const, vel: 0.4 },
              { t: unit(u) + 1, hit: "snare" as const, vel: 0.5 },
            ]),
            ...Array.from({ length: 32 }, (_, i) => ({
              t: i * 0.5,
              hit: "hihat" as const,
              vel: 0.28,
            })),
          ],
        },
      ],
    },
  },
  {
    id: "hiphop",
    name: "嘻哈",
    desc: "慢而沉的 boom bap:军鼓钉 2、4 拍,底鼓拖到后半拍才落,钢琴七和弦稀疏地戳——卡农躺进了说唱的节拍床。",
    pattern: {
      bpm: 88,
      swing: 0.58,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: theme(["E4", "D4", "C4", "B3", "A3", "G3", "A3", "B3"], 0.7),
        },
        {
          kind: "notes",
          timbre: "piano",
          // 七和弦短戳:隔一个和弦戳一次,留呼吸;压低八度给主题让路
          events: [
            ["C3", "E3", "G3", "B3"],
            ["A2", "C3", "E3", "G3"],
            ["F2", "A2", "C3", "E3"],
            ["G2", "B2", "D3", "F3"],
          ].flatMap((ch, u) => [
            { t: unit(u * 2), notes: ch, dur: 1.2, vel: 0.5 },
            { t: unit(u * 2) + 1.25, notes: ch, dur: 0.4, vel: 0.4 },
          ]),
        },
        {
          kind: "notes",
          timbre: "bass",
          // 拖拍贝斯:正拍 + 1.75 的迟推
          events: ROOTS.flatMap((root, u) => [
            { t: unit(u), notes: [root], dur: 1.3, vel: 0.85 },
            { t: unit(u) + 1.75, notes: [root], dur: 0.3, vel: 0.6 },
          ]),
        },
        {
          kind: "drums",
          events: [
            ...[0, 2.75, 8, 10.75].map((t) => ({ t, hit: "kick" as const, vel: 0.75 })),
            ...Array.from({ length: 8 }, (_, i) => ({
              t: 1 + i * 2,
              hit: "snare" as const,
              vel: 0.65,
            })),
            ...Array.from({ length: 16 }, (_, i) => ({ t: i, hit: "hihat" as const, vel: 0.25 })),
          ],
        },
      ],
    },
  },
  {
    id: "pop",
    name: "流行",
    desc: "钢琴在正拍和反拍后半各落一下,贝斯一步一步走,鼓组干净利落——卡农穿上了电台主打歌的外套。",
    pattern: {
      bpm: 120,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.85),
        },
        {
          kind: "notes",
          timbre: "piano",
          // 流行落点:每和弦第 1 拍与第 2 拍后半
          events: [
            ["C4", "E4", "G4"],
            ["G3", "B3", "D4"],
            ["A3", "C4", "E4"],
            ["E3", "G3", "B3"],
            ["F3", "A3", "C4"],
            ["C4", "E4", "G4"],
            ["F3", "A3", "C4"],
            ["G3", "B3", "D4"],
          ].flatMap((ch, u) => [
            { t: unit(u), notes: ch, dur: 1.1, vel: 0.55 },
            { t: unit(u) + 1.5, notes: ch, dur: 0.6, vel: 0.45 },
          ]),
        },
        {
          kind: "notes",
          timbre: "bass",
          // 根音-五度交替,一拍一音
          events: ROOTS.flatMap((root, u) => [
            { t: unit(u), notes: [root], dur: 0.9, vel: 0.75 },
            { t: unit(u) + 1, notes: [FIFTHS[u]], dur: 0.9, vel: 0.65 },
          ]),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 8 }, (_, u) => ({
              t: unit(u),
              hit: "kick" as const,
              vel: 0.7,
            })),
            ...Array.from({ length: 8 }, (_, i) => ({
              t: 1 + i * 2,
              hit: "snare" as const,
              vel: 0.6,
            })),
            ...Array.from({ length: 32 }, (_, i) => ({
              t: i * 0.5,
              hit: "hihat" as const,
              vel: 0.35,
            })),
            { t: 0, hit: "openhat", vel: 0.5 },
          ],
        },
      ],
    },
  },
];

// 每版默认转 2 遍(原形自定为 32 拍单遍结构,不翻倍)
STYLES.forEach((s) => (s.pattern.repeat ??= 2));
