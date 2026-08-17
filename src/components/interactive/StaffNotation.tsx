import { Loader2, Play } from "lucide-react";
import * as React from "react";

import { playSequence, type Timbre } from "./audio";
import { toAbc } from "./noteUtils";

type Props = {
  notes: string[];
  label?: string;
  /** 播放音色,默认钢琴。词条在哪个乐器语境下就用哪个(如 guitar* 用 guitar)。 */
  timbre?: Timbre;
  /** 谱号,默认高音;低音乐器(贝斯等)传 "bass" 免得加线满天飞 */
  clef?: "treble" | "bass";
};

/** 渲染一段五线谱(abcjs),点琥珀播放键用 Tone.js 依次发声。 */
export function StaffNotation({ notes, label, timbre = "piano", clef = "treble" }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const abcjs = (await import("abcjs")).default;
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      const key = clef === "bass" ? "K:C clef=bass" : "K:C";
      const abc = `X:1\nL:1/4\n${key}\n${notes.map(toAbc).join(" ")} |`;
      abcjs.renderAbc(ref.current, abc, {
        responsive: "resize",
        add_classes: true,
        staffwidth: Math.max(160, Math.min(560, notes.length * 46 + 40)),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [notes.join(","), clef]);

  async function handlePlay() {
    if (playing) return;
    setPlaying(true);
    try {
      await playSequence(notes, 0.45, 0.08, timbre);
    } catch {
      /* 忽略音频错误 */
    }
    const total = notes.length * (0.45 + 0.08) * 1000 + 300;
    window.setTimeout(() => setPlaying(false), total);
  }

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border bg-card">
      {label && (
        <figcaption className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {label}
        </figcaption>
      )}
      <div className="p-4">
        <div ref={ref} className="overflow-x-auto text-foreground" />
        <button
          type="button"
          onClick={handlePlay}
          disabled={playing}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-signature px-4 py-2 text-sm font-medium text-signature-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {playing ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {playing ? "播放中…" : "播放"}
        </button>
      </div>
    </figure>
  );
}

export default StaffNotation;
