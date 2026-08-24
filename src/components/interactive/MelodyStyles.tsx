import { Play, Square } from "lucide-react";
import * as React from "react";

import { onAudioInterrupt, playPattern, stopAllAudio } from "./audio";
import { STYLES } from "@/lib/melodyStyles";

/** 首页「一首卡农,六种曲风」:同一段旋律一键换风格,听懂"曲风"到底是什么。
 *  播放中再点同款=停止,点别款=自动切歌(引擎全局互斥)。 */
export function MelodyStyles() {
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [last, setLast] = React.useState<string>(STYLES[0].id);
  const timer = React.useRef(0);
  // 自己启动播放的瞬间,playPattern 会先广播一次"打断"——那一次要忽略
  const starting = React.useRef(false);

  React.useEffect(() => {
    const off = onAudioInterrupt(() => {
      if (starting.current) return;
      window.clearTimeout(timer.current);
      setPlaying(null);
    });
    return () => {
      off();
      window.clearTimeout(timer.current);
    };
  }, []);

  async function play(id: string) {
    if (playing === id) {
      stopAllAudio(); // 回调自动复位
      return;
    }
    const style = STYLES.find((s) => s.id === id);
    if (!style) return;
    starting.current = true;
    setPlaying(id);
    setLast(id);
    try {
      await playPattern(style.pattern); // 引擎先打断已有播放(广播被 starting 挡下)
      starting.current = false;
      const ms = ((style.pattern.beats * 60) / style.pattern.bpm) * 1000 + 900;
      timer.current = window.setTimeout(() => setPlaying(null), ms);
    } catch {
      starting.current = false;
      setPlaying(null);
    }
  }

  const active = STYLES.find((s) => s.id === (playing ?? last));

  return (
    <figure className="not-prose overflow-hidden rounded-2xl border bg-card">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-semibold">和弦进行</span>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            C – G – Am – Em – F – C – F – G
          </span>
          <a href="/entries/pop-progressions" className="text-xs text-muted-foreground hover:text-signature">
            (卡农进行:无数流行歌的祖先)
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STYLES.map((s) => {
            const on = playing === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => void play(s.id)}
                aria-label={on ? `停止${s.name}版` : `试听${s.name}版`}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition active:scale-95 " +
                  (on
                    ? "border-signature bg-signature text-signature-foreground"
                    : "bg-card hover:border-signature/50 hover:text-signature")
                }
              >
                {on ? <Square className="size-3" /> : <Play className="size-3.5" />}
                {s.name}
              </button>
            );
          })}
        </div>

        {active && (
          <p className="mt-4 min-h-6 text-sm text-muted-foreground">
            <span className="font-medium text-signature">{active.name}版</span>
            <span className="mx-1.5">·</span>
            {active.desc}
          </p>
        )}
      </div>
      <figcaption className="border-t bg-muted/40 px-5 py-1.5 text-xs text-muted-foreground">
        同一串音符,不同的节奏、和声与音色包装——这就是「曲风」。各版本的完整版在对应曲风词条里
      </figcaption>
    </figure>
  );
}

export default MelodyStyles;
