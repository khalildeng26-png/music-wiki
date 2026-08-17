import { Pause, Play } from "lucide-react";
import * as React from "react";

import { playSequence } from "./audio";
import { LETTERS, midiToNote, noteToMidi } from "./noteUtils";

/** 音阶配方:从主音起的半音距离;上下行演奏时首尾主音只出现一次。 */
const SCALES = [
  { key: "major", name: "大调", hint: "全全半全全全半 · 明亮", steps: [0, 2, 4, 5, 7, 9, 11, 12] },
  {
    key: "minor",
    name: "自然小调",
    hint: "全半全全半全全 · 柔和",
    steps: [0, 2, 3, 5, 7, 8, 10, 12],
  },
  { key: "penta-major", name: "大调五声", hint: "宫商角徵羽 · 中国风", steps: [0, 2, 4, 7, 9, 12] },
  {
    key: "penta-minor",
    name: "小调五声",
    hint: "1 b3 4 5 b7 · 布鲁斯/摇滚常用",
    steps: [0, 3, 5, 7, 10, 12],
  },
] as const;

type ScaleKey = (typeof SCALES)[number]["key"];

/** 音阶试听:选主音和音阶类型,上下行连播,听"换音阶 = 换情绪"。 */
export function ScalePlayer() {
  const [root, setRoot] = React.useState<string>("C");
  const [scaleKey, setScaleKey] = React.useState<ScaleKey>("major");
  const [playing, setPlaying] = React.useState(false);

  const scale = SCALES.find((s) => s.key === scaleKey)!;
  // 上行 + 去掉首音的下行 → 首尾主音各出现一次
  const up = scale.steps.map((st) => midiToNote(noteToMidi(`${root}4`) + st));
  const notes = [...up, ...up.slice(0, -1).reverse()];

  async function play() {
    setPlaying(true);
    try {
      await playSequence(notes, 0.4, 0.06);
    } finally {
      setPlaying(false);
    }
  }

  return (
    <figure className="not-prose my-8 rounded-xl border bg-card p-4">
      <figcaption className="mb-3 text-sm text-muted-foreground">
        音阶试听:选一个主音和一种音阶,点播放听上下行——同一主音,换音阶就是换情绪。
      </figcaption>

      <div className="flex flex-wrap gap-2">
        {SCALES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setScaleKey(s.key)}
            title={s.hint}
            className={
              "rounded-lg border px-3 py-1.5 text-sm transition " +
              (scaleKey === s.key
                ? "border-signature/50 bg-signature/10 text-signature"
                : "bg-background hover:border-signature/50 hover:text-signature")
            }
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">主音</span>
        {LETTERS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setRoot(l)}
            className={
              "inline-flex size-8 items-center justify-center rounded-lg border text-sm font-semibold transition " +
              (root === l
                ? "border-signature/50 bg-signature/10 text-signature"
                : "bg-background hover:border-signature/50 hover:text-signature")
            }
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void play()}
          disabled={playing}
          aria-label="播放音阶(上下行)"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-signature text-signature-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {notes.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className={
                "rounded-md px-1.5 py-0.5 text-sm tabular-nums " +
                (i === 0 || i === notes.length - 1
                  ? "bg-signature/10 font-semibold text-signature"
                  : "bg-muted/60 text-foreground")
              }
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">{scale.hint}</div>
    </figure>
  );
}

export default ScalePlayer;
