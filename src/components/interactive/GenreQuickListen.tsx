import { Loader2, Play } from "lucide-react";
import * as React from "react";

import { playPattern } from "./audio";
import { GENRE_LIST, type GenreDemo } from "@/lib/genrePatterns";

/** 首页「曲风速听」:13 种曲风一卡一播键,点一下就听该曲风的签名片段。 */
export function GenreQuickListen() {
  const [playing, setPlaying] = React.useState<string | null>(null);
  const timer = React.useRef(0);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  async function play(g: GenreDemo) {
    if (playing) return; // 同一时间只播一个
    setPlaying(g.slug);
    try {
      await playPattern(g.pattern);
      const ms = ((g.pattern.beats * 60) / g.pattern.bpm) * 1000 + 900;
      timer.current = window.setTimeout(() => setPlaying(null), ms);
    } catch {
      setPlaying(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {GENRE_LIST.map((g) => {
        const active = playing === g.slug;
        return (
          <div key={g.slug} className="relative">
            <a
              href={`/entries/${g.slug}`}
              className={
                "group flex h-full flex-col justify-center gap-1 rounded-xl border bg-card p-4 pr-12 transition hover:-translate-y-0.5 hover:border-signature/50 hover:shadow-md " +
                (active ? "border-signature/60" : "")
              }
            >
              <span className="font-semibold group-hover:text-signature">
                {g.title.split(" · ")[0]}
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {g.pattern.bpm} BPM
                {(g.pattern.swing ?? 0.5) > 0.55 ? " · 摇摆" : ""}
              </span>
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void play(g);
              }}
              aria-label={`试听:${g.title.split(" · ")[0]}`}
              title="播放风格片段"
              className={
                "absolute top-1/2 right-3 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full transition active:scale-90 " +
                (active
                  ? "bg-signature text-signature-foreground"
                  : "bg-signature/10 text-signature hover:bg-signature hover:text-signature-foreground")
              }
            >
              {active ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default GenreQuickListen;
