// 「一首卡农,六种曲风」的编曲数据——帕赫贝尔卡农移到 C 大调,
// 地面低音 8 个和弦 × 2 拍 = 16 拍:C G Am Em F C F G(卡农进行)。
// 主题旋律(二分音符):E5 D5 C5 B4 A4 G4 A4 B4,各版本按乐器音域移位。
// 2026-09-03 换血:换下爵士/摇滚/民乐/8bit/舞曲(它们仍在各自词条与
// 猜曲风游戏里),换上凯尔特/进行曲/新世纪/蓝调/放克——B 档新音色
// (锡哨/宝思兰/行进军鼓)首次上首页;钢琴保留作「原形」对照组。
import type { Pattern } from "@/components/interactive/audio";

import { transposeNote } from "@/lib/transpose";

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

/** 卡农各级根音(低八度,供 bass/tuba 用) */
const ROOTS = ["C2", "G1", "A1", "E1", "F1", "C2", "F1", "G1"] as const;
/** 根音上五度(om-pah 的 pah) */
const FIFTHS = ["G2", "D2", "E2", "B1", "C2", "G2", "C2", "D2"] as const;

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
    id: "celtic",
    name: "凯尔特",
    desc: "锡哨把主题高高挑起,木吉他只在反拍切分,宝思兰鼓咚哒哒地推——卡农踏进了爱尔兰酒馆。",
    pattern: {
      bpm: 116,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "whistle",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.7),
        },
        {
          kind: "notes",
          timbre: "guitar",
          // 反拍切分:每拍的后半拍轻切一下,凯尔特节奏组的招牌伴奏法
          events: [
            ["C3", "G3", "E4"],
            ["G2", "D3", "B3"],
            ["A2", "E3", "C4"],
            ["E2", "B2", "G3"],
            ["F2", "C3", "A3"],
            ["C3", "G3", "E4"],
            ["F2", "C3", "A3"],
            ["G2", "D3", "B3"],
          ].flatMap((ch, u) => [
            { t: unit(u) + 0.5, notes: ch, dur: 0.35, vel: 0.5 },
            { t: unit(u) + 1.5, notes: ch, dur: 0.35, vel: 0.55 },
          ]),
        },
        {
          kind: "drums",
          // 宝思兰鼓:每拍一击,强-弱-中-弱的酒馆律动
          events: Array.from({ length: 16 }, (_, i) => ({
            t: i,
            hit: "bodhran" as const,
            vel: i % 4 === 0 ? 0.85 : i % 4 === 2 ? 0.6 : 0.4,
          })),
        },
      ],
    },
  },
  {
    id: "march",
    name: "进行曲",
    desc: "小号齐步走主题,大号在底下 oom-pah,行进军鼓密如雨点——卡农列队过街。",
    pattern: {
      bpm: 112,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "trumpet",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.8),
        },
        {
          kind: "notes",
          timbre: "tuba",
          // oom-pah:正拍根音、次拍五度
          events: ROOTS.flatMap((root, u) => [
            { t: unit(u), notes: [root], dur: 0.9, vel: 0.65 },
            { t: unit(u) + 1, notes: [FIFTHS[u]], dur: 0.9, vel: 0.5 },
          ]),
        },
        {
          kind: "drums",
          // 行进军鼓:连续八分,重音按 4/4 分句;低音鼓钉正拍
          events: [
            ...Array.from({ length: 32 }, (_, i) => ({
              t: i * 0.5,
              hit: "msnare" as const,
              vel: i % 8 === 0 ? 0.8 : i % 2 === 0 ? 0.55 : 0.3,
            })),
            ...Array.from({ length: 8 }, (_, u) => ({ t: unit(u), hit: "kick" as const, vel: 0.7 })),
          ],
        },
      ],
    },
  },
  {
    id: "newage",
    name: "新世纪",
    desc: "小提琴把主题拉成长线悬在半空,钢琴琶音一圈圈荡开,没有鼓——空间感就是主角。",
    pattern: {
      bpm: 72,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "violin",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.4),
        },
        {
          kind: "notes",
          timbre: "piano",
          // 每和弦一组八分琶音,自下而上「荡开」
          events: [
            ["C4", "E4", "G4", "C5"],
            ["G3", "B3", "D4", "G4"],
            ["A3", "C4", "E4", "A4"],
            ["E3", "G3", "B3", "E4"],
            ["F3", "A3", "C4", "F4"],
            ["C4", "E4", "G4", "C5"],
            ["F3", "A3", "C4", "F4"],
            ["G3", "B3", "D4", "G4"],
          ].flatMap((arp, u) =>
            arp.map((n, i) => ({ t: unit(u) + i * 0.5, notes: [n], dur: 1.6, vel: 0.4 })),
          ),
        },
      ],
    },
  },
  {
    id: "blues",
    name: "蓝调",
    desc: "吉他把主题唱得松松垮垮,和弦全换成七和弦,swing 八分一长一短——卡农进了烟熏酒吧。",
    pattern: {
      bpm: 96,
      swing: 0.64,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: theme(["E5", "D5", "C5", "B4", "A4", "G4", "A4", "B4"], 0.75),
        },
        {
          kind: "notes",
          timbre: "guitar",
          // 七和弦在摇摆八分上焖着:每和弦两下,swing 把它晃成 shuffle
          events: [
            ["C3", "E3", "Bb3"],
            ["G2", "B2", "F3"],
            ["A2", "C3", "G3"],
            ["E2", "G2", "D3"],
            ["F2", "A2", "Eb3"],
            ["C3", "E3", "Bb3"],
            ["F2", "A2", "Eb3"],
            ["G2", "B2", "F3"],
          ].flatMap((ch, u) => [
            { t: unit(u), notes: ch, dur: 0.4, vel: 0.6 },
            { t: unit(u) + 1, notes: ch, dur: 0.4, vel: 0.5 },
          ]),
        },
        {
          kind: "notes",
          timbre: "bass",
          // 根音-五度交替,一拍一音
          events: ROOTS.flatMap((root, u) => [
            { t: unit(u), notes: [root], dur: 0.9, vel: 0.8 },
            { t: unit(u) + 1, notes: [FIFTHS[u]], dur: 0.9, vel: 0.7 },
          ]),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5, hit: "ride" as const, vel: 0.45 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.5 })),
            ...Array.from({ length: 8 }, (_, u) => ({ t: unit(u), hit: "kick" as const, vel: 0.4 })),
          ],
        },
      ],
    },
  },
  {
    id: "funk",
    name: "放克",
    desc: "九和弦只在想不到的位置冒头,贝斯用八度蹦跳抢戏,十六分镲擦个不停——秘诀是「哪里不弹」。",
    pattern: {
      bpm: 100,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "eguitar",
          events: theme(["E4", "D4", "C4", "B3", "A3", "G3", "A3", "B3"], 0.75),
        },
        {
          kind: "notes",
          timbre: "eguitar",
          // 九和弦切分短刺:反拍进,十六分缝里收
          events: [
            ["C3", "E3", "Bb3", "D4"], // C9(省五音)
            ["G2", "B2", "F3", "A3"], // G9
            ["A2", "C3", "E3", "G3"], // Am7
            ["E2", "G2", "B2", "D3"], // Em7
            ["F2", "A2", "C3", "Eb3"], // F9(♭7 在位)
            ["C3", "E3", "Bb3", "D4"],
            ["F2", "A2", "C3", "Eb3"],
            ["G2", "B2", "F3", "A3"],
          ].flatMap((ch, u) => [
            { t: unit(u) + 0.5, notes: ch, dur: 0.18, vel: 0.6 },
            { t: unit(u) + 1.75, notes: ch, dur: 0.18, vel: 0.55 },
          ]),
        },
        {
          kind: "notes",
          timbre: "bass",
          // 八度蹦跳的 funk ostinato:正拍根音、后半拍同音、第二拍高八度
          events: ROOTS.flatMap((root, u) => [
            { t: unit(u), notes: [root], dur: 0.2, vel: 0.9 },
            { t: unit(u) + 0.75, notes: [root], dur: 0.15, vel: 0.7 },
            { t: unit(u) + 1.5, notes: [transposeNote(root, 12)], dur: 0.2, vel: 0.8 },
          ]),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 64 }, (_, i) => ({
              t: i * 0.25,
              hit: "hihat" as const,
              vel: i % 4 === 0 ? 0.4 : i % 2 === 0 ? 0.3 : 0.2,
            })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.75 })),
            ...Array.from({ length: 8 }, (_, u) => ({ t: unit(u), hit: "kick" as const, vel: 0.8 })),
            { t: 2.75, hit: "kick", vel: 0.6 },
            { t: 10.75, hit: "kick", vel: 0.6 },
          ],
        },
      ],
    },
  },
];

// 每版转 2 遍(8 小节卡农进行,更完整)
STYLES.forEach((s) => (s.pattern.repeat = 2));
