// 猜曲风的变奏素材库:每曲风一段不同进行/旋律的签名(与主素材风格一致但内容不同),
// 出题时从 [主素材, ...变奏] 里随机抽取,避免"听两遍就背答案"。
import type { Pattern } from "@/components/interactive/audio";

export const VARIANTS: Record<string, Pattern[]> = {
  jazz: [
    {
      bpm: 128,
      swing: 0.65,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["F3", "A3", "C4", "E4"], dur: 1.1 },
            { t: 1.5, notes: ["F3", "A3", "C4", "E4"], dur: 0.5 },
            { t: 4, notes: ["C3", "E3", "G3", "Bb3"], dur: 1.1 },
            { t: 5.5, notes: ["C3", "E3", "G3", "Bb3"], dur: 0.5 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["F2", "G2", "A2", "B2", "C3", "A2", "G2", "E2"].map((n, i) => ({
            t: i,
            notes: [n],
            dur: 0.95,
          })),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 16 }, (_, i) => ({ t: i * 0.5, hit: "ride" as const, vel: 0.5 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "hihat" as const, vel: 0.45 })),
            { t: 0, hit: "kick", vel: 0.3 },
          ],
        },
      ],
    },
  ],
  rock: [
    {
      bpm: 116,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "eguitar",
          events: [
            ...Array.from({ length: 2 }, (_, i) => ({ t: i, notes: ["A2", "E3", "A3"], dur: 0.8, vel: 0.85 })),
            ...Array.from({ length: 2 }, (_, i) => ({ t: 2 + i, notes: ["G2", "D3", "G3"], dur: 0.8, vel: 0.85 })),
            ...Array.from({ length: 2 }, (_, i) => ({ t: 4 + i, notes: ["F2", "C3", "F3"], dur: 0.8, vel: 0.85 })),
            ...Array.from({ length: 2 }, (_, i) => ({ t: 6 + i, notes: ["E2", "B2", "E3"], dur: 0.8, vel: 0.85 })),
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: (
            [
              ["A1", 2],
              ["G1", 2],
              ["F1", 2],
              ["E1", 2],
            ] as [string, number][]
          ).flatMap(([root], i) => ({ t: i, notes: [root], dur: 0.9, vel: 0.8 })),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 4 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.8 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: i, hit: "hihat" as const, vel: 0.26 })),
          ],
        },
      ],
    },
  ],
  pop: [
    {
      bpm: 116,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["A3", "C4", "E4"], dur: 1.2 },
            { t: 2, notes: ["F3", "A3", "C4"], dur: 1.2 },
            { t: 4, notes: ["C4", "E4", "G4"], dur: 1.2 },
            { t: 6, notes: ["G3", "B3", "D4"], dur: 1.2 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: (
            [
              ["A1", 2],
              ["F1", 2],
              ["C2", 2],
              ["G1", 2],
            ] as [string, number][]
          ).flatMap(([root], i) => ({ t: i, notes: [root], dur: 0.9 })),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 4 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.8 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.7 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: i, hit: "hihat" as const, vel: 0.28 })),
          ],
        },
      ],
    },
  ],
  folk: [
    {
      bpm: 92,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: (
            [
              ["G2", ["G2", "D3", "G3", "B3"]],
              ["C3", ["C3", "E3", "G3", "C4"]],
              ["G2", ["G2", "D3", "G3", "B3"]],
              ["D3", ["D3", "A3", "D4", "F#4"]],
            ] as [string, string[]][]
          ).flatMap(([root, ch], bar) => [
            { t: bar * 2, notes: [root], dur: 0.9, vel: 0.8 },
            ...ch.flatMap((n, i) => ({ t: bar * 2 + 1 + i * 0.02, notes: [n], dur: 0.8, vel: 0.62 })),
          ]),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["G1", "C2", "G1", "D2"].map((root, bar) => ({
            t: bar * 2,
            notes: [root],
            dur: 1.6,
            vel: 0.55,
          })),
        },
      ],
    },
  ],
  blues: [
    {
      bpm: 96,
      swing: 0.64,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: ["A2", "A2", "C#3", "A2", "D3", "A2", "C#3", "A2", "A2", "A2", "C#3", "A2", "D3", "C#3", "A2", "G2"].map(
            (n, i) => ({ t: i * 0.5, notes: [n], dur: 0.4, vel: 0.75 }),
          ),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: ["A1", "E2", "A1", "G1"].map((n, i) => ({ t: i * 2, notes: [n], dur: 1.8, vel: 0.8 })),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 16 }, (_, i) => ({ t: i * 0.5, hit: "ride" as const, vel: 0.5 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.5 })),
          ],
        },
      ],
    },
  ],
  guofeng: [
    {
      bpm: 88,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "dizi",
          events: [
            { t: 0, notes: ["A5"], dur: 0.9 },
            { t: 1, notes: ["G5"], dur: 0.5 },
            { t: 1.5, notes: ["E5"], dur: 1 },
            { t: 3, notes: ["D5"], dur: 0.9 },
            { t: 4, notes: ["E5"], dur: 0.5 },
            { t: 4.5, notes: ["G5"], dur: 1 },
            { t: 6, notes: ["A5"], dur: 1.9 },
          ],
        },
        {
          kind: "notes",
          timbre: "guzheng",
          events: Array.from({ length: 2 }, (_, b) =>
            ["A3", "C4", "E4", "A4"].map((n, i) => ({ t: b * 4 + i, notes: [n], dur: 0.9, vel: 0.5 })),
          ).flat(),
        },
        { kind: "notes", timbre: "erhu", events: [{ t: 0, notes: ["A4"], dur: 7.6, vel: 0.4 }] },
      ],
    },
  ],
  classical: [
    {
      bpm: 92,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: Array.from({ length: 2 }, (_, b) =>
            ["G2", "D3", "B3", "D3"].map((n, i) => ({ t: b * 4 + i, notes: [n], dur: 0.9, vel: 0.5 })),
          ).flat(),
        },
        {
          kind: "notes",
          timbre: "violin",
          events: [
            { t: 0, notes: ["D5"], dur: 1 },
            { t: 1, notes: ["B4"], dur: 1 },
            { t: 2, notes: ["A4"], dur: 1.9 },
            { t: 4, notes: ["G4"], dur: 1 },
            { t: 5, notes: ["A4"], dur: 0.5 },
            { t: 5.5, notes: ["B4"], dur: 0.5 },
            { t: 6, notes: ["D5"], dur: 1.9 },
          ],
        },
      ],
    },
  ],
  rnb: [
    {
      bpm: 90,
      swing: 0.6,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["A3", "C4", "E4", "G4", "B4"], dur: 1.6 },
            { t: 2.5, notes: ["A3", "C4", "E4", "G4", "B4"], dur: 1.2 },
            { t: 4, notes: ["F3", "A3", "C4", "E4", "G4"], dur: 1.6 },
            { t: 6.5, notes: ["F3", "A3", "C4", "E4", "G4"], dur: 1.2 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            { t: 0, notes: ["A1"], dur: 1.2 },
            { t: 1.75, notes: ["A1"], dur: 0.4 },
            { t: 2.5, notes: ["A1"], dur: 0.9 },
            { t: 4, notes: ["F1"], dur: 1.2 },
            { t: 5.75, notes: ["F1"], dur: 0.4 },
            { t: 6.5, notes: ["F1"], dur: 0.9 },
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 2 }, (_, b) => [
              { t: b * 4, hit: "kick" as const, vel: 0.75 },
              { t: b * 4 + 2.5, hit: "kick" as const, vel: 0.55 },
            ]).flat(),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.55 })),
            ...Array.from({ length: 16 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.28 })),
          ],
        },
      ],
    },
  ],
  soul: [
    {
      bpm: 104,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: Array.from({ length: 2 }, (_, b) => {
            const off = b * 4;
            const v = b === 0 ? ["C4", "E4", "Bb4", "D4"] : ["F3", "A3", "Eb4", "C4"];
            return [
              { t: off, notes: v, dur: 0.8, vel: 0.75 },
              { t: off + 1.5, notes: v, dur: 0.6, vel: 0.6 },
              { t: off + 2.5, notes: v, dur: 0.8, vel: 0.7 },
            ];
          }).flat(),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            { t: 0, notes: ["C2"], dur: 1.1 },
            { t: 1.75, notes: ["C2"], dur: 0.4 },
            { t: 2.5, notes: ["G1"], dur: 1.1 },
            { t: 4, notes: ["F1"], dur: 1.1 },
            { t: 5.75, notes: ["F1"], dur: 0.4 },
            { t: 6.5, notes: ["C2"], dur: 1.1 },
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 4 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.8 })),
            ...Array.from({ length: 16 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.4 })),
          ],
        },
      ],
    },
  ],
  hiphop: [
    {
      bpm: 84,
      swing: 0.58,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            { t: 0, notes: ["Eb3", "G3", "Bb3", "D4"], dur: 1.4, vel: 0.55 },
            { t: 2.5, notes: ["Eb3", "G3", "Bb3", "D4"], dur: 0.5, vel: 0.45 },
            { t: 4, notes: ["C3", "Eb3", "G3", "Bb3"], dur: 1.4, vel: 0.55 },
            { t: 6.5, notes: ["C3", "Eb3", "G3", "Bb3"], dur: 0.5, vel: 0.45 },
          ],
        },
        {
          kind: "notes",
          timbre: "bass",
          events: [
            { t: 0, notes: ["C1"], dur: 1.3 },
            { t: 1.75, notes: ["C1"], dur: 0.35 },
            { t: 2.5, notes: ["C1"], dur: 1.2 },
            { t: 4, notes: ["Bb0"], dur: 1.3 },
            { t: 5.75, notes: ["Bb0"], dur: 0.35 },
            { t: 6.5, notes: ["Ab0"], dur: 1.2 },
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 2 }, (_, b) => [
              { t: b * 4, hit: "kick" as const, vel: 0.9 },
              { t: b * 4 + 2.75, hit: "kick" as const, vel: 0.8 },
            ]).flat(),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.85 })),
            ...Array.from({ length: 16 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.38 })),
          ],
        },
      ],
    },
  ],
  electronic: [
    {
      bpm: 122,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "synth",
          events: [
            ...Array.from({ length: 4 }, (_, i) => ["A4", "C5", "E5", "A5"][i % 4]).map((n, i) => ({
              t: i * 0.5,
              notes: [n],
              dur: 0.42,
              vel: 0.7,
            })),
            ...Array.from({ length: 4 }, (_, i) => ["F4", "A4", "C5", "F5"][i % 4]).map((n, i) => ({
              t: 4 + i * 0.5,
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
            ...Array.from({ length: 4 }, () => "A2").map((n, i) => ({ t: i + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
            ...Array.from({ length: 4 }, () => "F2").map((n, i) => ({ t: 4 + i + 0.5, notes: [n], dur: 0.3, vel: 0.8 })),
          ],
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 8 }, (_, i) => ({ t: i, hit: "kick" as const, vel: 0.85 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.6 })),
            ...Array.from({ length: 8 }, (_, i) => ({ t: i + 0.5, hit: "hihat" as const, vel: 0.45 })),
          ],
        },
      ],
    },
  ],
  funk: [
    {
      bpm: 104,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "eguitar",
          events: Array.from({ length: 2 }, (_, b) => {
            const off = b * 4;
            return [
              { t: off, notes: ["E2"], dur: 0.2, vel: 0.8 },
              { t: off + 0.5, notes: ["G2"], dur: 0.2, vel: 0.7 },
              { t: off + 1, notes: ["Bb2"], dur: 0.2, vel: 0.7 },
              { t: off + 1.75, notes: ["A2"], dur: 0.2, vel: 0.7 },
              { t: off + 2.5, notes: ["G2"], dur: 0.2, vel: 0.7 },
              { t: off + 3.25, notes: ["E2"], dur: 0.2, vel: 0.8 },
            ];
          }).flat(),
        },
        {
          kind: "notes",
          timbre: "bass",
          events: Array.from({ length: 2 }, (_, b) => {
            const off = b * 4;
            return [
              { t: off, notes: ["E1"], dur: 0.35, vel: 0.9 },
              { t: off + 0.75, notes: ["E2"], dur: 0.2, vel: 0.7 },
              { t: off + 2, notes: ["E1"], dur: 0.35, vel: 0.85 },
              { t: off + 3.25, notes: ["E2"], dur: 0.2, vel: 0.7 },
            ];
          }).flat(),
        },
        {
          kind: "drums",
          events: [
            ...Array.from({ length: 2 }, (_, b) => [
              { t: b * 4, hit: "kick" as const, vel: 0.9 },
              { t: b * 4 + 1.75, hit: "kick" as const, vel: 0.7 },
            ]).flat(),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.7 })),
            ...Array.from({ length: 32 }, (_, i) => ({ t: i * 0.25, hit: "hihat" as const, vel: 0.28 })),
          ],
        },
      ],
    },
  ],
  "8bit": [
    {
      bpm: 150,
      beats: 8,
      tracks: [
        {
          kind: "notes",
          timbre: "chip",
          events: ["A4", "C5", "E5", "A4", "G4", "E5", "D5", "C5", "A4", "C5", "E5", "A5", "G5", "E5", "C5", "A4"].map(
            (n, i) => ({ t: i * 0.5, notes: [n], dur: 0.4, vel: 0.75 }),
          ),
        },
        {
          kind: "notes",
          timbre: "chip",
          events: ["A2", "A2", "A3", "A2", "F2", "F2", "F3", "F2", "A2", "A2", "A3", "A2", "E2", "E2", "E3", "E2"].map(
            (n, i) => ({ t: i, notes: [n], dur: 0.9, vel: 0.9 }),
          ),
        },
        {
          kind: "drums",
          kit: "synth",
          events: [
            ...Array.from({ length: 4 }, (_, i) => ({ t: i * 2, hit: "kick" as const, vel: 0.9 })),
            ...Array.from({ length: 4 }, (_, i) => ({ t: 1 + i * 2, hit: "snare" as const, vel: 0.75 })),
            ...Array.from({ length: 16 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.45 })),
          ],
        },
      ],
    },
  ],
};
