// 13 篇曲风词条的「风格试听」签名片段——词条页(StyleDemo)与首页(曲风速听)共用的唯一数据源。
// 规则:真实乐器采样优先,合成音色只用于原生电子风格(8bit/电子乐),缺失音色见 DESIGN.md §8。
import type { Pattern } from "@/components/interactive/audio";

export type GenreDemo = {
  slug: string;
  /** 片段名 */
  title: string;
  /** 听点提示 */
  hint: string;
  /** 注脚(采样说明) */
  note: string;
  pattern: Pattern;
};

/** 4/4 一小节的鼓件便捷生成(踩镲为四分——每半拍的八分密度已证实听感过碎) */
const drums = (bars: number, kick: number[], snare: number[], hatVel = 0.45) => [
  ...Array.from({ length: bars }, (_, b) =>
    kick.map((t) => ({ t: b * 4 + t, hit: "kick" as const, vel: 0.85 })),
  ).flat(),
  ...Array.from({ length: bars }, (_, b) =>
    snare.map((t) => ({ t: b * 4 + t, hit: "snare" as const, vel: 0.75 })),
  ).flat(),
  ...Array.from({ length: bars * 4 }, (_, i) => ({
    t: i,
    hit: "hihat" as const,
    vel: hatVel,
  })),
];

const eighth = (notes: string[], vel = 0.8) =>
  notes.map((n, i) => ({ t: i * 0.5, notes: [n], dur: 0.42, vel }));

export const GENRES: Record<string, GenreDemo> = {
  jazz: {
    slug: "jazz",
    title: "爵士 · Dm7–G7–Cmaj7(ii–V–I)",
    hint: "注意两件事:八分音符「长–短」不均的摇摆感;贝斯四拍一音地行走。",
    note: "钢琴/贝斯/鼓组均为真实采样",
    pattern: {
      bpm: 132,
      swing: 0.65,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["D4", "F4", "A4", "C5"], dur: 1.1 },
            { t: 1.5, notes: ["D4", "F4", "A4", "C5"], dur: 0.5 },
            { t: 4, notes: ["G3", "B3", "D4", "F4"], dur: 1.1 },
            { t: 5.5, notes: ["G3", "B3", "D4", "F4"], dur: 0.5 },
            { t: 8, notes: ["C4", "E4", "G4", "B4"], dur: 1.1 },
            { t: 9.5, notes: ["C4", "E4", "G4", "B4"], dur: 0.5 },
            { t: 12, notes: ["C4", "E4", "G4", "B4"], dur: 1.1 },
            { t: 13.5, notes: ["A3", "C#4", "E4", "G4"], dur: 0.5 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            "D2",
            "E2",
            "F2",
            "G2",
            "F2",
            "G2",
            "A2",
            "B2",
            "C3",
            "E3",
            "G3",
            "A3",
            "B2",
            "A2",
            "G2",
            "E2",
          ].map((n, i) => ({ t: i, notes: [n], dur: 0.95 })),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 32 }, (_, i) => ({
              t: i * 0.5,
              hit: "ride" as const,
              vel: 0.55,
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
  rock: {
    slug: "rock",
    title: "摇滚 · E5–G5–A5 强力和弦推进",
    hint: "注意鼓在 2、4 拍的重击(backbeat),和吉他八分音符一路推着走的感觉。",
    note: "吉他/贝斯/鼓组均为真实采样;真实摇滚的吉他还会加失真",
    pattern: {
      bpm: 120,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "eguitar",
          events: [
            // 四分音符扫弦(每拍一下):用户听感三连否决八分密度,全曲最高密度=每拍一击
            ...Array.from({ length: 8 }, (_, i) => ({
              t: i,
              notes: ["E3", "B3", "E4"],
              dur: 0.8,
              vel: 0.85,
            })),
            ...Array.from({ length: 4 }, (_, i) => ({
              t: 8 + i,
              notes: ["G3", "D4", "G4"],
              dur: 0.8,
              vel: 0.85,
            })),
            ...Array.from({ length: 4 }, (_, i) => ({
              t: 12 + i,
              notes: ["A3", "E4", "A4"],
              dur: 0.8,
              vel: 0.85,
            })),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            // 四分音符根音(与踩镲同密度),不再八分连打——避免低频机关枪感
            ...Array.from({ length: 8 }, (_, i) => ({ t: i, notes: ["E2"], dur: 0.9, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, i) => ({
              t: 8 + i,
              notes: ["G2"],
              dur: 0.9,
              vel: 0.8,
            })),
            ...Array.from({ length: 4 }, (_, i) => ({
              t: 12 + i,
              notes: ["A2"],
              dur: 0.9,
              vel: 0.8,
            })),
          ],
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
            // 踩镲每拍一下(四分),力度再收,只做背景沙沙
            ...Array.from({ length: 16 }, (_, i) => ({ t: i, hit: "hihat" as const, vel: 0.26 })),
            { t: 0, hit: "openhat", vel: 0.6 },
          ],
        },
      ],
    },
  },
  "8bit": {
    slug: "8bit",
    title: "8bit · 方波旋律 + 芯片贝斯 + 噪声鼓",
    hint: "这就是当年游戏机音频芯片的三大件:方波负责旋律,方波低八度当贝斯,白噪声当鼓。",
    note: "全合成音色(方波/噪声)——这正是 8bit 的原生声音,无需「真实」",
    pattern: {
      bpm: 160,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "chip",
          events: eighth([
            "C5",
            "E5",
            "G5",
            "E5",
            "C6",
            "G5",
            "E5",
            "G5",
            "A4",
            "C5",
            "F5",
            "C5",
            "A5",
            "F5",
            "C5",
            "A4",
            "C5",
            "E5",
            "G5",
            "E5",
            "C6",
            "G5",
            "E5",
            "G5",
            "G4",
            "B4",
            "D5",
            "G5",
            "B5",
            "G5",
            "D5",
            "B4",
          ]),
        },
        {
          kind: "notes",
          timbre: "chip",
          events: [
            "C3",
            "C3",
            "C4",
            "C3",
            "F2",
            "F2",
            "F3",
            "F2",
            "C3",
            "C3",
            "C4",
            "C3",
            "G2",
            "G2",
            "G3",
            "G2",
          ].map((n, i) => ({ t: i, notes: [n], dur: 0.9, vel: 0.9 })),
        },
        { kind: "drums", kit: "synth", events: drums(4, [0, 2], [1, 3], 0.45) },
      ],
    },
  },
  pop: {
    slug: "pop",
    title: "流行 · C–G–Am–F(I–V–vi–IV)",
    hint: "这四个和弦撑起了上万首金曲;注意钢琴在每小节第 1 拍和「3 拍后半」的落点。",
    note: "钢琴/贝斯/鼓组均为真实采样",
    pattern: {
      bpm: 120,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["C4", "E4", "G4"], dur: 1.2 },
            { t: 2.5, notes: ["C4", "E4", "G4"], dur: 1.2 },
            { t: 4, notes: ["G3", "B3", "D4"], dur: 1.2 },
            { t: 6.5, notes: ["G3", "B3", "D4"], dur: 1.2 },
            { t: 8, notes: ["A3", "C4", "E4"], dur: 1.2 },
            { t: 10.5, notes: ["A3", "C4", "E4"], dur: 1.2 },
            { t: 12, notes: ["F3", "A3", "C4"], dur: 1.2 },
            { t: 14.5, notes: ["F3", "A3", "C4"], dur: 1.2 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            ...Array.from({ length: 4 }, (_, i) => ({ t: i, notes: ["C2"], dur: 0.9 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 4 + i, notes: ["A1"], dur: 0.9 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 8 + i, notes: ["A1"], dur: 0.9 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 12 + i, notes: ["F1"], dur: 0.9 })),
          ],
        },
        {
          kind: "drums",
          events: [...drums(4, [0, 2], [1, 3], 0.4), { t: 0, hit: "openhat", vel: 0.55 }],
        },
      ],
    },
  },
  folk: {
    slug: "folk",
    title: "民谣 · 木吉他 boom-chick(C–G–Am–F)",
    hint: "低音-和弦-低音-和弦:1、3 拍弹根音,2、4 拍扫和弦,乡村/民谣的心跳。",
    note: "木吉他/贝斯均为真实采样;民谣常见编制不带鼓组,本段从略",
    pattern: {
      bpm: 96,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: [
            ...["C3", "G2", "A2", "F2"].flatMap((root, bar) => {
              const off = bar * 4;
              const voicing =
                bar === 0
                  ? ["C3", "G3", "C4", "E4"]
                  : bar === 1
                    ? ["G2", "D3", "G3", "B3"]
                    : bar === 2
                      ? ["A2", "E3", "A3", "C4"]
                      : ["F2", "C3", "F3", "A3"];
              return [
                { t: off, notes: [root], dur: 0.9, vel: 0.8 },
                ...voicing.flatMap((n, i) => ({
                  t: off + 1 + i * 0.02,
                  notes: [n],
                  dur: 0.8,
                  vel: 0.62,
                })),
                { t: off + 2, notes: [root], dur: 0.9, vel: 0.8 },
                ...voicing.flatMap((n, i) => ({
                  t: off + 3 + i * 0.02,
                  notes: [n],
                  dur: 0.8,
                  vel: 0.62,
                })),
              ];
            }),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["C2", "G1", "A1", "F1"].flatMap((root, bar) => [
            { t: bar * 4, notes: [root], dur: 1.6, vel: 0.6 },
            { t: bar * 4 + 2, notes: [root], dur: 1.6, vel: 0.55 },
          ]),
        },
      ],
    },
  },
  guofeng: {
    slug: "guofeng",
    title: "国风 · 五声音阶小调(笛子 × 古筝 × 二胡)",
    hint: "旋律里没有 fa 和 si(只剩 do re mi sol la),笛子一响中国味就来了;底下是古筝琶音和二胡长音。",
    note: "笛子/古筝/二胡均为真实采样;民乐打击乐(堂鼓/镲)暂无采样,本段从略",
    pattern: {
      bpm: 84,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "dizi",
          events: [
            { t: 0, notes: ["G5"], dur: 0.5 },
            { t: 0.5, notes: ["A5"], dur: 0.5 },
            { t: 1, notes: ["C6"], dur: 1 },
            { t: 2, notes: ["A5"], dur: 0.5 },
            { t: 2.5, notes: ["G5"], dur: 1.4 },
            { t: 4, notes: ["D6"], dur: 0.5 },
            { t: 4.5, notes: ["C6"], dur: 0.5 },
            { t: 5, notes: ["A5"], dur: 1 },
            { t: 6, notes: ["G5"], dur: 0.5 },
            { t: 6.5, notes: ["A5"], dur: 1.4 },
            { t: 8, notes: ["C6"], dur: 0.5 },
            { t: 8.5, notes: ["D6"], dur: 0.5 },
            { t: 9, notes: ["E6"], dur: 1 },
            { t: 10, notes: ["D6"], dur: 0.5 },
            { t: 10.5, notes: ["C6"], dur: 1.4 },
            { t: 12, notes: ["A5"], dur: 0.5 },
            { t: 12.5, notes: ["G5"], dur: 0.5 },
            { t: 13, notes: ["E5"], dur: 1 },
            { t: 14, notes: ["G5"], dur: 0.5 },
            { t: 14.5, notes: ["A5"], dur: 1.4 },
          ],
        },
        {
          kind: "notes",
          timbre: "guzheng",
          events: [
            ...["C", "Am", "C", "G"].flatMap((ch, bar) => {
              const off = bar * 4;
              const tones =
                ch === "Am"
                  ? ["A3", "C4", "E4", "A4"]
                  : ch === "G"
                    ? ["G3", "D4", "E4", "G4"]
                    : ["A3", "C4", "E4", "G4"];
              return tones.map((n, i) => ({ t: off + i, notes: [n], dur: 0.9, vel: 0.55 }));
            }),
          ],
        },
        {
          kind: "notes",
          timbre: "erhu",
          events: [
            { t: 0, notes: ["D4"], dur: 3.8, vel: 0.45 },
            { t: 4, notes: ["E4"], dur: 3.8, vel: 0.45 },
            { t: 8, notes: ["G4"], dur: 3.8, vel: 0.45 },
            { t: 12, notes: ["A4"], dur: 3.8, vel: 0.45 },
          ],
        },
      ],
    },
  },
  classical: {
    slug: "classical",
    title: "古典 · 阿尔贝蒂低音 + 小提琴旋律",
    hint: "左手「低-高-中-高」分解和弦(阿尔贝蒂低音)是古典时期的招牌伴奏型;小提琴在上面唱一条规整的旋律。",
    note: "钢琴/小提琴均为真实采样;弦乐四重奏的完整编制(中提琴/大提琴)暂无采样,以二重奏示意",
    pattern: {
      bpm: 96,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            ...["C", "G", "C", "G"].flatMap((ch, bar) => {
              const off = bar * 4;
              const seq = ch === "C" ? ["C3", "G3", "E3", "G3"] : ["G2", "D3", "B3", "D3"];
              return seq.map((n, i) => ({ t: off + i, notes: [n], dur: 0.9, vel: 0.55 }));
            }),
          ],
        },
        {
          kind: "notes",
          timbre: "violin",
          events: [
            { t: 0, notes: ["G4"], dur: 1 },
            { t: 1, notes: ["A4"], dur: 1 },
            { t: 2, notes: ["B4"], dur: 0.5 },
            { t: 2.5, notes: ["C5"], dur: 1.4 },
            { t: 4, notes: ["D5"], dur: 1.5 },
            { t: 5.5, notes: ["C5"], dur: 0.5 },
            { t: 6, notes: ["B4"], dur: 1 },
            { t: 7, notes: ["A4"], dur: 0.9 },
            { t: 8, notes: ["E5"], dur: 1 },
            { t: 9, notes: ["D5"], dur: 1 },
            { t: 10, notes: ["C5"], dur: 1 },
            { t: 11, notes: ["D5"], dur: 0.9 },
            { t: 12, notes: ["C5"], dur: 1.5 },
            { t: 13.5, notes: ["B4"], dur: 0.5 },
            { t: 14, notes: ["D5"], dur: 1.8 },
          ],
        },
      ],
    },
  },
  rnb: {
    slug: "rnb",
    title: "R&B · Cmaj7–Am7–Dm7–Em7(黏律动)",
    hint: "全是带 7 音的和弦;速度不快、鼓点松松地落在拍子后面——这就是「黏」的感觉。",
    note: "钢琴/贝斯/鼓组均为真实采样(理想音色是电钢琴 Rhodes,暂无采样,以原声钢琴示意)",
    pattern: {
      bpm: 86,
      swing: 0.6,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["C4", "E4", "G4", "B4"], dur: 1.6 },
            { t: 2.5, notes: ["C4", "E4", "G4", "B4"], dur: 1.3 },
            { t: 4, notes: ["A3", "C4", "E4", "G4"], dur: 1.6 },
            { t: 6.5, notes: ["A3", "C4", "E4", "G4"], dur: 1.3 },
            { t: 8, notes: ["D4", "F4", "A4", "C5"], dur: 1.6 },
            { t: 10.5, notes: ["D4", "F4", "A4", "C5"], dur: 1.3 },
            { t: 12, notes: ["E4", "G4", "B4", "D5"], dur: 1.6 },
            { t: 14.5, notes: ["E4", "G4", "B4", "D5"], dur: 1.3 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["C2", "A1", "D2", "E2"].flatMap((root, bar) => [
            { t: bar * 4, notes: [root], dur: 1.2 },
            { t: bar * 4 + 1.75, notes: [root], dur: 0.4 },
            { t: bar * 4 + 2.5, notes: [root], dur: 0.9 },
          ]),
        },
        { kind: "drums", events: drums(4, [0, 2.5], [1, 3], 0.3) },
      ],
    },
  },
  soul: {
    slug: "soul",
    title: "灵魂乐 · C7–F7 律动(重 backbeat)",
    hint: "7 和弦 + 军鼓在 2、4 拍狠狠地打——从教堂唱诗班长出来的那股劲儿。",
    note: "钢琴/贝斯/鼓组均为真实采样;福音标配的铃鼓/拍手暂无采样,从略",
    pattern: {
      bpm: 100,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            ...["C7", "F7", "C7", "G7"].flatMap((ch, bar) => {
              const off = bar * 4;
              const voicing =
                ch === "C7"
                  ? ["C4", "E4", "G4", "A#4"]
                  : ch === "F7"
                    ? ["F3", "A3", "C4", "D#4"]
                    : ["G3", "B3", "D4", "F4"];
              return [
                { t: off, notes: voicing, dur: 0.8, vel: 0.75 },
                { t: off + 1.5, notes: voicing, dur: 0.6, vel: 0.6 },
                { t: off + 2.5, notes: voicing, dur: 0.8, vel: 0.7 },
              ];
            }),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            ...["C2", "F1", "C2", "G1"].flatMap((root, bar) => [
              { t: bar * 4, notes: [root], dur: 1.1 },
              { t: bar * 4 + 1.75, notes: [root], dur: 0.4 },
              { t: bar * 4 + 2.5, notes: [root], dur: 1.1 },
            ]),
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 4 }, (_, b) => [
              { t: b * 4, hit: "kick" as const, vel: 0.9 },
              { t: b * 4 + 3.5, hit: "kick" as const, vel: 0.7 },
            ]).flat(),
            ...Array.from({ length: 8 }, (_, i) => ({
              t: 1 + i * 2,
              hit: "snare" as const,
              vel: 0.85,
            })),
            ...Array.from({ length: 32 }, (_, i) => ({
              t: i * 0.5,
              hit: "hihat" as const,
              vel: 0.45,
            })),
            { t: 0, hit: "openhat", vel: 0.6 },
          ],
        },
      ],
    },
  },
  hiphop: {
    slug: "hiphop",
    title: "嘻哈 · Am7–Dm7 boom bap",
    hint: "慢而沉:军鼓在 2、4 拍打重,底鼓拖在第 3 拍后半才落,贝斯松松地跟着走——说唱就踩在这上面。",
    note: "钢琴/贝斯/鼓组均为真实采样;808 合成鼓与唱机采样(scratch)是嘻哈原生元素,暂无采样,以原声鼓组示意",
    pattern: {
      bpm: 88,
      swing: 0.58,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["A3", "C4", "E4", "G4"], dur: 1.4, vel: 0.6 },
            { t: 2.5, notes: ["A3", "C4", "E4", "G4"], dur: 0.5, vel: 0.5 },
            { t: 8, notes: ["D4", "F4", "A4", "C5"], dur: 1.4, vel: 0.6 },
            { t: 10.5, notes: ["D4", "F4", "A4", "C5"], dur: 0.5, vel: 0.5 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            ...["A1", "A1", "D2", "D2"].flatMap((root, bar) => [
              { t: bar * 4, notes: [root], dur: 1.3 },
              { t: bar * 4 + 1.75, notes: [root], dur: 0.35 },
              { t: bar * 4 + 2.5, notes: [root], dur: 1.2 },
            ]),
          ],
        },
        { kind: "drums", events: drums(4, [0, 2.75], [1, 3], 0.4) },
      ],
    },
  },
  electronic: {
    slug: "electronic",
    title: "电子乐 · 舞曲骨架(four-on-the-floor)",
    hint: "底鼓每一拍都踩、踩镲全落在反拍上——舞池的心跳;合成器琶音在上面飘。",
    note: "合成器为电子乐原生音色(同 8bit 的逻辑,不是「代替」);鼓组为真实采样",
    pattern: {
      bpm: 124,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "synth",
          events: [
            ...Array.from({ length: 16 }, (_, i) => ["A4", "C5", "E5", "A5"][i % 4]).map(
              (n, i) => ({
                t: i * 0.5,
                notes: [n],
                dur: 0.42,
                vel: 0.7,
              }),
            ),
            ...Array.from({ length: 8 }, (_, i) => ["F4", "A4", "C5", "F5"][i % 4]).map((n, i) => ({
              t: 8 + i * 0.5,
              notes: [n],
              dur: 0.42,
              vel: 0.7,
            })),
            ...Array.from({ length: 8 }, (_, i) => ["G4", "B4", "D5", "G5"][i % 4]).map((n, i) => ({
              t: 12 + i * 0.5,
              notes: [n],
              dur: 0.42,
              vel: 0.7,
            })),
          ],
        },
        {
          kind: "notes",
          timbre: "synth",
          events: [
            ...Array.from({ length: 16 }, () => "A2").map((n, i) => ({
              t: i * 0.5 + 0.25,
              notes: [n],
              dur: 0.3,
              vel: 0.8,
            })),
            ...Array.from({ length: 8 }, () => "F2").map((n, i) => ({
              t: 8 + i * 0.5 + 0.25,
              notes: [n],
              dur: 0.3,
              vel: 0.8,
            })),
            ...Array.from({ length: 8 }, () => "G2").map((n, i) => ({
              t: 12 + i * 0.5 + 0.25,
              notes: [n],
              dur: 0.3,
              vel: 0.8,
            })),
          ],
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
            // 真反拍:只在每个正拍的后半(此前 i*0.5+0.5 误盖全部八分音,密度翻倍成"每秒四下")
            ...Array.from({ length: 16 }, (_, i) => ({
              t: i + 0.5,
              hit: "hihat" as const,
              vel: 0.45,
            })),
            { t: 0, hit: "openhat", vel: 0.5 },
            { t: 8, hit: "openhat", vel: 0.5 },
          ],
        },
      ],
    },
  },
  blues: {
    slug: "blues",
    title: "布鲁斯 · E 调 shuffle 律动",
    hint: "八分音符一长一短(shuffle),吉他走的 E–E–G–A 音型——把音「弹歪」一点,苦味就出来了。",
    note: "吉他/贝斯/鼓组均为真实采样",
    pattern: {
      bpm: 100,
      swing: 0.64,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: [
            // 每小节 boogie 音型:E-E-G-E / A-E-G-E(摇摆八分)
            ...Array.from({ length: 4 }, (_, bar) => {
              const off = bar * 4;
              const root = bar === 2 ? "A2" : "E2";
              const third = bar === 2 ? "C3" : "G2";
              return [
                { t: off, notes: [root], dur: 0.4, vel: 0.8 },
                { t: off + 0.5, notes: [root], dur: 0.4, vel: 0.7 },
                { t: off + 1, notes: [third], dur: 0.4, vel: 0.75 },
                { t: off + 1.5, notes: [root], dur: 0.4, vel: 0.7 },
                { t: off + 2, notes: ["A2"], dur: 0.4, vel: 0.75 },
                { t: off + 2.5, notes: [root], dur: 0.4, vel: 0.7 },
                { t: off + 3, notes: [third], dur: 0.4, vel: 0.75 },
                { t: off + 3.5, notes: [root], dur: 0.4, vel: 0.7 },
              ];
            }).flat(),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            // 简单根音行走:E | E | A | E
            ...Array.from({ length: 8 }, (_, i) => ({ t: i, notes: ["E1"], dur: 0.9 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 8 + i, notes: ["A1"], dur: 0.9 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 12 + i, notes: ["E1"], dur: 0.9 })),
          ],
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
              hit: "snare" as const,
              vel: 0.5,
            })),
            { t: 0, hit: "kick", vel: 0.5 },
            { t: 4, hit: "kick", vel: 0.4 },
            { t: 8, hit: "kick", vel: 0.5 },
            { t: 12, hit: "kick", vel: 0.4 },
          ],
        },
      ],
    },
  },
  funk: {
    slug: "funk",
    title: "放克 · 切分十六分音型",
    hint: "音符都挤在意想不到的位置(切分),中间留空——放克的秘诀不是弹得多,而是「哪里不弹」。",
    note: "电吉他/贝斯/鼓组均为真实采样",
    pattern: {
      bpm: 100,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "eguitar",
          events: [
            // 一小节动机重复四次,十六分切分
            ...Array.from({ length: 4 }, (_, bar) => {
              const off = bar * 4;
              return [
                { t: off, notes: ["E2"], dur: 0.2, vel: 0.8 },
                { t: off + 0.5, notes: ["G2"], dur: 0.2, vel: 0.7 },
                { t: off + 0.75, notes: ["A2"], dur: 0.2, vel: 0.7 },
                { t: off + 1.5, notes: ["G2"], dur: 0.2, vel: 0.7 },
                { t: off + 2, notes: ["E2"], dur: 0.2, vel: 0.8 },
                { t: off + 2.5, notes: ["G2"], dur: 0.2, vel: 0.7 },
                { t: off + 2.75, notes: ["B2"], dur: 0.2, vel: 0.7 },
                { t: off + 3.5, notes: ["A2"], dur: 0.2, vel: 0.7 },
              ];
            }).flat(),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            ...Array.from({ length: 4 }, (_, bar) => {
              const off = bar * 4;
              return [
                { t: off, notes: ["E1"], dur: 0.35, vel: 0.9 },
                { t: off + 0.75, notes: ["E2"], dur: 0.2, vel: 0.7 },
                { t: off + 1.75, notes: ["E1"], dur: 0.35, vel: 0.8 },
                { t: off + 2.5, notes: ["G1"], dur: 0.2, vel: 0.7 },
                { t: off + 3.25, notes: ["A1"], dur: 0.35, vel: 0.8 },
              ];
            }).flat(),
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 4 }, (_, b) => [
              { t: b * 4, hit: "kick" as const, vel: 0.85 },
              { t: b * 4 + 1.75, hit: "kick" as const, vel: 0.7 },
              { t: b * 4 + 2.5, hit: "kick" as const, vel: 0.6 },
            ]).flat(),
            ...Array.from({ length: 8 }, (_, i) => ({
              t: 1 + i * 2,
              hit: "snare" as const,
              vel: 0.7,
            })),
            ...Array.from({ length: 64 }, (_, i) => ({
              t: i * 0.25,
              hit: "hihat" as const,
              vel: 0.3,
            })),
          ],
        },
      ],
    },
  },

  disco: {
    slug: "disco",
    title: "迪斯科 · 四踩底鼓 + 切分贝斯",
    hint: "底鼓每一拍都踩,贝斯在拍子缝隙里蹦——1970 年代舞池的标准配置。",
    note: "电吉他/贝斯/鼓组均为真实采样",
    pattern: {
      bpm: 120,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "eguitar",
          events: ["C3", "F2", "C3", "G2"].flatMap((root, bar) =>
            // 吉他切碎音:每小节第 2、4 拍后半各一下
            [
              { t: bar * 4 + 1.5, notes: [root, root === "C3" ? "G3" : "D3"], dur: 0.2, vel: 0.7 },
              { t: bar * 4 + 3.5, notes: [root, root === "C3" ? "G3" : "D3"], dur: 0.2, vel: 0.7 },
            ],
          ),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["C2", "F1", "C2", "G1"].flatMap((root, bar) =>
            // 迪斯科标志:根音-高八度 蹦跳线
            [
              { t: bar * 4, notes: [root], dur: 0.45 },
              { t: bar * 4 + 0.5, notes: [root], dur: 0.2 },
              { t: bar * 4 + 1.5, notes: [root], dur: 0.45 },
              { t: bar * 4 + 2, notes: [root], dur: 0.2 },
              { t: bar * 4 + 2.5, notes: [root], dur: 0.45 },
              { t: bar * 4 + 3.5, notes: [root], dur: 0.45 },
            ],
          ),
        },
        { kind: "drums", events: drums(4, [0, 1, 2, 3], [1, 3], 0.3) },
      ],
    },
  },
  reggae: {
    slug: "reggae",
    title: "雷鬼 · 反拍吉他 + 下沉贝斯",
    hint: "吉他和弦全落在反拍上(正拍反而空着),贝斯慢慢下沉——牙买加的慵懒律动。",
    note: "木吉他/贝斯/鼓组均为真实采样",
    pattern: {
      bpm: 78,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: [
            ["C3", ["C4", "E4", "G4"]],
            ["C3", ["C4", "E4", "G4"]],
            ["F2", ["A3", "C4", "F4"]],
            ["G2", ["B3", "D4", "G4"]],
          ].flatMap(([, ch], bar) =>
            // skank:每个正拍的后半扫一下,正拍留空
            Array.from({ length: 4 }, (_, i) => ({
              t: bar * 4 + i + 0.5,
              notes: ch,
              dur: 0.16,
              vel: 0.7,
            })),
          ),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            { t: 0, notes: ["C2"], dur: 1.4 },
            { t: 2, notes: ["G1"], dur: 1.9 },
            { t: 4, notes: ["E1"], dur: 1.4 },
            { t: 6, notes: ["C2"], dur: 1.9 },
            { t: 8, notes: ["F1"], dur: 1.4 },
            { t: 10, notes: ["C2"], dur: 1.4 },
            { t: 12, notes: ["G1"], dur: 1.4 },
            { t: 14, notes: ["D2"], dur: 1.9 },
          ],
        },
        {
          kind: "drums",
          events: [
            // one-drop:底鼓和军鼓一起砸在第 3 拍,第 1 拍空着
            ...Array.from({ length: 4 }, (_, b) => ({ t: b * 4 + 2, hit: "kick" as const, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, b) => ({ t: b * 4 + 2, hit: "snare" as const, vel: 0.7 })),
            ...Array.from({ length: 16 }, (_, i) => ({ t: i, hit: "hihat" as const, vel: 0.26 })),
          ],
        },
      ],
    },
  },
  country: {
    slug: "country",
    title: "乡村 · boom-chick + 口琴",
    hint: "低音-和弦的 boom-chick(和民谣同源),末尾口琴滑出一句——美国南方的乡土味。",
    note: "木吉他/口琴/贝斯/鼓组均为真实采样",
    pattern: {
      bpm: 112,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: [
            ["G2", ["G3", "B3", "D4"]],
            ["C3", ["C4", "E4", "G4"]],
            ["G2", ["G3", "B3", "D4"]],
            ["D3", ["F#4", "A3", "D4"]],
          ].flatMap(([root, ch], bar) => [
            { t: bar * 4, notes: [root], dur: 0.9, vel: 0.8 },
            ...ch.flatMap((n, i) => ({ t: bar * 4 + 1 + i * 0.02, notes: [n], dur: 0.8, vel: 0.6 })),
            { t: bar * 4 + 2, notes: [root], dur: 0.9, vel: 0.8 },
            ...ch.flatMap((n, i) => ({ t: bar * 4 + 3 + i * 0.02, notes: [n], dur: 0.8, vel: 0.6 })),
          ]),
        },
        {
          kind: "notes",
          timbre: "harmonica",
          events: [
            { t: 12, notes: ["C4"], dur: 0.35, vel: 0.6 },
            { t: 12.5, notes: ["D4"], dur: 0.35, vel: 0.6 },
            { t: 13, notes: ["E4"], dur: 0.35, vel: 0.65 },
            { t: 13.5, notes: ["G4"], dur: 0.4, vel: 0.65 },
            { t: 14, notes: ["A4"], dur: 1.8, vel: 0.7 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["G1", "C2", "G1", "D2"].flatMap((root, bar) => [
            { t: bar * 4, notes: [root], dur: 1.6, vel: 0.55 },
            { t: bar * 4 + 2, notes: [root], dur: 1.6, vel: 0.5 },
          ]),
        },
        { kind: "drums", events: drums(4, [0, 2], [1, 3], 0.26) },
      ],
    },
  },
  punk: {
    slug: "punk",
    title: "朋克 · 三和弦高速冲撞",
    hint: "168 BPM、强力和弦八分连扫、一分钟唱完一首歌——把摇滚的『简』推到极端。",
    note: "电吉他/贝斯/鼓组均为真实采样(朋克本就追求粗糙直给,清音电吉他意外地合适)",
    pattern: {
      bpm: 168,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "eguitar",
          events: [
            ...Array.from({ length: 8 }, (_, i) => ({ t: i * 0.5, notes: ["E3", "B3", "E4"], dur: 0.22, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 4 + i * 0.5, notes: ["A2", "E3", "A3"], dur: 0.22, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 6 + i * 0.5, notes: ["E3", "B3", "E4"], dur: 0.22, vel: 0.8 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 8 + i * 0.5, notes: ["E3", "B3", "E4"], dur: 0.22, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 12 + i * 0.5, notes: ["G2", "D3", "G3"], dur: 0.22, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 14 + i * 0.5, notes: ["A2", "E3", "A3"], dur: 0.22, vel: 0.8 })),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            ...Array.from({ length: 16 }, (_, i) => ({ t: i * 0.5, notes: ["E1"], dur: 0.22 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 8 + i * 0.5, notes: ["E1"], dur: 0.22 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 12 + i * 0.5, notes: ["G1"], dur: 0.22 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 14 + i * 0.5, notes: ["A1"], dur: 0.22 })),
          ],
        },
        { kind: "drums", events: drums(4, [0, 2], [1, 3], 0.4) },
      ],
    },
  },
  tango: {
    slug: "tango",
    title: "探戈 · 钢琴顿挫 + 小提琴咏叹",
    hint: "钢琴短促砸下、贝斯一顿一顿,小提琴在上面唱戏剧性的旋律——布宜诺斯艾利斯的深夜。",
    note: "钢琴/小提琴/贝斯均为真实采样;探戈的灵魂乐器班多钮琴暂无采样,以钢琴示意",
    pattern: {
      bpm: 116,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            ...["Am", "Am", "Dm", "E7"].flatMap((ch, bar) => {
              const v = ch === "Am" ? ["A3", "C4", "E4"] : ch === "Dm" ? ["D4", "F4", "A4"] : ["G3", "B3", "D4", "F4"];
              return [
                { t: bar * 4, notes: v, dur: 0.3, vel: 0.65 },
                { t: bar * 4 + 1, notes: v, dur: 0.3, vel: 0.55 },
                { t: bar * 4 + 2, notes: v, dur: 0.3, vel: 0.65 },
                { t: bar * 4 + 3, notes: v, dur: 0.3, vel: 0.55 },
              ];
            }),
          ],
        },
        {
          kind: "notes",
          timbre: "violin",
          events: [
            { t: 0, notes: ["A4"], dur: 1.9 },
            { t: 2, notes: ["B4"], dur: 0.45 },
            { t: 2.5, notes: ["C5"], dur: 1.4 },
            { t: 4, notes: ["E5"], dur: 1.9 },
            { t: 6, notes: ["D5"], dur: 1.9 },
            { t: 8, notes: ["D5"], dur: 0.45 },
            { t: 8.5, notes: ["C5"], dur: 0.45 },
            { t: 9, notes: ["B4"], dur: 0.45 },
            { t: 9.5, notes: ["A4"], dur: 1.4 },
            { t: 11, notes: ["B4"], dur: 0.9 },
            { t: 12, notes: ["G#4"], dur: 1.9 },
            { t: 14, notes: ["A4"], dur: 1.9 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["A1", "A1", "D2", "E1"].flatMap((root, bar) =>
            Array.from({ length: 4 }, (_, i) => ({ t: bar * 4 + i, notes: [root], dur: 0.7, vel: 0.75 })),
          ),
        },
      ],
    },
  },
  waltz: {
    slug: "waltz",
    title: "华尔兹 · 三拍子『蓬-嚓-嚓』",
    hint: "全站唯一的 3/4 拍:第一拍低音沉下去,第二三拍和弦轻轻荡——舞会从这一步开始。",
    note: "钢琴/贝斯均为真实采样",
    pattern: {
      bpm: 150,
      beats: 12,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            ...["C", "G", "C", "F"].flatMap((ch, bar) => {
              const off = bar * 3;
              const root = ch === "C" ? "C2" : ch === "G" ? "G1" : "F1";
              const triad = ch === "C" ? ["C4", "E4", "G4"] : ch === "G" ? ["B3", "D4", "G4"] : ["A3", "C4", "F4"];
              return [
                { t: off, notes: [root], dur: 0.8, vel: 0.7 },
                { t: off + 1, notes: triad, dur: 0.6, vel: 0.42 },
                { t: off + 2, notes: triad, dur: 0.6, vel: 0.42 },
              ];
            }),
            // 旋律:小圆舞曲一句
            { t: 0, notes: ["E5"], dur: 2.2, vel: 0.6 },
            { t: 3, notes: ["D5"], dur: 0.9, vel: 0.55 },
            { t: 4, notes: ["C5"], dur: 1.6, vel: 0.55 },
            { t: 6, notes: ["E5"], dur: 2.2, vel: 0.6 },
            { t: 9, notes: ["A4"], dur: 2.2, vel: 0.6 },
          ],
        },
      ],
    },
  },
  "bossa-nova": {
    slug: "bossa-nova",
    title: "波萨诺瓦 · 凉下来的桑巴",
    hint: "吉他把和弦错落着轻轻摆(像海浪),贝斯几乎不动——巴西海滩边的下午。",
    note: "木吉他/贝斯均为真实采样",
    pattern: {
      bpm: 130,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: [
            ...[
              ["C3", ["G3", "B3", "E4"]],
              ["C3", ["G3", "B3", "E4"]],
              ["F2", ["A3", "C4", "E4"]],
              ["G2", ["G3", "B3", "E4"]],
            ].flatMap(([, ch], bar) => [
              { t: bar * 4 + 0, notes: ch, dur: 0.5, vel: 0.55 },
              { t: bar * 4 + 1.5, notes: ch, dur: 0.35, vel: 0.5 },
              { t: bar * 4 + 3, notes: ch, dur: 0.5, vel: 0.5 },
              { t: bar * 4 + 3.5, notes: ch, dur: 0.35, vel: 0.45 },
            ]),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["C2", "C2", "F1", "G1"].flatMap((root, bar) => [
            { t: bar * 4, notes: [root], dur: 0.9, vel: 0.55 },
            { t: bar * 4 + 2, notes: [root], dur: 0.9, vel: 0.45 },
          ]),
        },
      ],
    },
  },
  ragtime: {
    slug: "ragtime",
    title: "拉格泰姆 · 左手行进,右手切分",
    hint: "左手像打拍子的节拍器,右手偏不听话地错半拍——爵士的钢琴祖先,滑稽又上头。",
    note: "钢琴独奏,真实采样",
    pattern: {
      bpm: 96,
      beats: 16,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            // 左手:2/4 行进感(低音-和弦),4/4 网格下每拍交替
            ...Array.from({ length: 16 }, (_, i) => {
              const bar = Math.floor(i / 4);
              const chord = bar === 3 ? ["G3", "B3", "D4"] : ["C4", "E4", "G4"];
              const bass = bar === 3 ? "G2" : i % 4 === 0 || i % 4 === 2 ? "C3" : "G2";
              return i % 2 === 0
                ? { t: i, notes: [bass], dur: 0.4, vel: 0.6 }
                : { t: i, notes: chord, dur: 0.4, vel: 0.45 };
            }),
            // 右手:切分旋律(正拍躲着走)
            { t: 0.5, notes: ["E5"], dur: 0.4, vel: 0.7 },
            { t: 1, notes: ["G5"], dur: 0.4, vel: 0.7 },
            { t: 1.5, notes: ["C6"], dur: 0.4, vel: 0.75 },
            { t: 2.5, notes: ["G5"], dur: 0.4, vel: 0.7 },
            { t: 3.5, notes: ["E5"], dur: 0.4, vel: 0.7 },
            { t: 4.5, notes: ["G5"], dur: 0.4, vel: 0.7 },
            { t: 5, notes: ["C6"], dur: 0.4, vel: 0.75 },
            { t: 5.5, notes: ["E6"], dur: 0.4, vel: 0.75 },
            { t: 6.5, notes: ["C6"], dur: 0.4, vel: 0.7 },
            { t: 7.5, notes: ["G5"], dur: 0.4, vel: 0.7 },
            { t: 8.5, notes: ["A5"], dur: 0.4, vel: 0.7 },
            { t: 9, notes: ["C6"], dur: 0.4, vel: 0.7 },
            { t: 9.5, notes: ["A5"], dur: 0.4, vel: 0.7 },
            { t: 10.5, notes: ["G5"], dur: 0.4, vel: 0.7 },
            { t: 11.5, notes: ["E5"], dur: 0.4, vel: 0.7 },
            { t: 12.5, notes: ["D5"], dur: 0.4, vel: 0.7 },
            { t: 13, notes: ["B4"], dur: 0.4, vel: 0.7 },
            { t: 13.5, notes: ["D5"], dur: 0.4, vel: 0.7 },
            { t: 14.5, notes: ["G4"], dur: 0.4, vel: 0.7 },
            { t: 15.5, notes: ["C5"], dur: 0.4, vel: 0.7 },
          ],
        },
      ],
    },
  },
};

export const GENRE_LIST = Object.values(GENRES);
