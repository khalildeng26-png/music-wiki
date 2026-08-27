import { Play, Square } from "lucide-react";
import * as React from "react";

import { playSequence } from "./audio";
import { LETTERS, midiToNote, noteToMidi } from "./noteUtils";
import { usePlayToggle } from "./usePlayToggle";

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
  const { playing, start, stop } = usePlayToggle();
  // 正在发声的音符下标:-1 = 没有在播;跟走播放进度逐个高亮
  const [noteIdx, setNoteIdx] = React.useState(-1);

  const scale = SCALES.find((s) => s.key === scaleKey)!;
  // 上行 + 去掉首音的下行 → 首尾主音各出现一次
  const up = scale.steps.map((st) => midiToNote(noteToMidi(`${root}4`) + st));
  const notes = [...up, ...up.slice(0, -1).reverse()];

  const stepMs = (0.4 + 0.06) * 1000;

  // 高亮跟走播放进度;playing 翻回 false(播完/被停/被打断)时收尾归零
  React.useEffect(() => {
    if (!playing) {
      setNoteIdx(-1);
      return;
    }
    let i = 0;
    setNoteIdx(0);
    const t = window.setInterval(() => {
      i += 1;
      if (i < notes.length) setNoteIdx(i);
    }, stepMs);
    return () => window.clearInterval(t);
  }, [playing, notes.length, stepMs]);

  function play() {
    if (playing) return stop();
    void start(() => playSequence(notes, 0.4, 0.06), notes.length * stepMs + 300);
  }

  return (
    <figure className="not-prose rounded-xl border bg-card p-4">
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
                ? "border-signature/50 bg-signature/10 text-signature-ink"
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
                ? "border-signature/50 bg-signature/10 text-signature-ink"
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
          onClick={play}
          aria-label={playing ? "停止播放" : "播放音阶(上下行)"}
          aria-pressed={playing}
          title={playing ? "停止" : "播放音阶(上下行)"}
          className={
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-signature text-signature-foreground transition hover:opacity-90 " +
            (playing ? "play-pulse" : "")
          }
        >
          {playing ? <Square className="size-3.5" /> : <Play className="size-4" />}
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {notes.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className={
                "rounded-md px-1.5 py-0.5 font-mono text-sm tabular-nums transition " +
                (i === noteIdx
                  ? "bg-signature font-semibold text-signature-foreground ring-2 ring-signature/50"
                  : i === 0 || i === notes.length - 1
                    ? "bg-signature/10 font-semibold text-signature-ink"
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
