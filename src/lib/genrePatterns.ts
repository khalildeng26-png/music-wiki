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

/** 4/4 一小节的鼓件便捷生成 */
const drums = (bars: number, kick: number[], snare: number[], hatVel = 0.45) => [
  ...Array.from({ length: bars }, (_, b) =>
    kick.map((t) => ({ t: b * 4 + t, hit: "kick" as const, vel: 0.85 })),
  ).flat(),
  ...Array.from({ length: bars }, (_, b) =>
    snare.map((t) => ({ t: b * 4 + t, hit: "snare" as const, vel: 0.75 })),
  ).flat(),
  ...Array.from({ length: bars * 8 }, (_, i) => ({
    t: i * 0.5,
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
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5, hit: "ride" as const, vel: 0.55 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "hihat" as const, vel: 0.5 })),
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
            // 八分音符改短促颗粒(时值 0.42→0.28 拍):收掉余音重叠,"推进"而不是"糊"
            ...Array.from({ length: 16 }, (_, i) => ({ t: i * 0.5, notes: ["E3", "B3", "E4"], dur: 0.28, vel: 0.85 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 8 + i * 0.5, notes: ["G3", "D4", "G4"], dur: 0.28, vel: 0.85 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 12 + i * 0.5, notes: ["A3", "E4", "A4"], dur: 0.28, vel: 0.85 })),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            // 四分音符根音(与踩镲同密度),不再八分连打——避免低频机关枪感
            ...Array.from({ length: 8 }, (_, i) => ({ t: i, notes: ["E2"], dur: 0.9, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 8 + i, notes: ["G2"], dur: 0.9, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 12 + i, notes: ["A2"], dur: 0.9, vel: 0.8 })),
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 8 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.8 })),
            // 踩镲每拍一下(四分),不再每半拍——留出呼吸感
            ...Array.from({ length: 16 }, (_, i) => ({ t: i, hit: "hihat" as const, vel: 0.5 })),
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
            "C5", "E5", "G5", "E5", "C6", "G5", "E5", "G5",
            "A4", "C5", "F5", "C5", "A5", "F5", "C5", "A4",
            "C5", "E5", "G5", "E5", "C6", "G5", "E5", "G5",
            "G4", "B4", "D5", "G5", "B5", "G5", "D5", "B4",
          ]),
        },
        {
          kind: "notes",
          timbre: "chip",
          events: [
            "C3", "C3", "C4", "C3", "F2", "F2", "F3", "F2",
            "C3", "C3", "C4", "C3", "G2", "G2", "G3", "G2",
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
        { kind: "drums", events: [...drums(4, [0, 2], [1, 3], 0.4), { t: 0, hit: "openhat", vel: 0.55 }] },
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
                ...voicing.flatMap((n, i) => ({ t: off + 1 + i * 0.02, notes: [n], dur: 0.8, vel: 0.62 })),
                { t: off + 2, notes: [root], dur: 0.9, vel: 0.8 },
                ...voicing.flatMap((n, i) => ({ t: off + 3 + i * 0.02, notes: [n], dur: 0.8, vel: 0.62 })),
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
                ch === "Am" ? ["A3", "C4", "E4", "A4"] : ch === "G" ? ["G3", "D4", "E4", "G4"] : ["A3", "C4", "E4", "G4"];
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
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.85 })),
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.45 })),
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
            ...Array.from({ length: 16 }, (_, i) => ["A4", "C5", "E5", "A5"][i % 4]).map((n, i) => ({
              t: i * 0.5,
              notes: [n],
              dur: 0.42,
              vel: 0.7,
            })),
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
            ...Array.from({ length: 16 }, () => "A2").map((n, i) => ({ t: i * 0.5 + 0.25, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 8 }, () => "F2").map((n, i) => ({ t: 8 + i * 0.5 + 0.25, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 8 }, () => "G2").map((n, i) => ({ t: 12 + i * 0.5 + 0.25, notes: [n], dur: 0.3, vel: 0.8 })),
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 16 }, (_, i) => ({ t: i, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.6 })),
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5 + 0.5, hit: "hihat" as const, vel: 0.5 })),
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
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.5, hit: "ride" as const, vel: 0.5 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.5 })),
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
            ...Array.from({ length: 8 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.7 })),
            ...Array.from({ length: 64 }, (_, i) => ({ t: i * 0.25, hit: "hihat" as const, vel: 0.3 })),
          ],
        },
      ],
    },
  },
};

export const GENRE_LIST = Object.values(GENRES);
