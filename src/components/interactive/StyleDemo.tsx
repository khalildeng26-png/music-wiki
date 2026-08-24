import { Play, Square } from "lucide-react";
import * as React from "react";

import { onAudioInterrupt, playPattern, stopAllAudio, type Pattern } from "./audio";

type Props = {
  /** 片段名,如「爵士 · 摇摆八分 + walking bass」 */
  title: string;
  /** 听点提示:这一段该注意听什么 */
  hint?: string;
  /** 注脚(如「鼓组为合成音示意」) */
  note?: string;
  pattern: Pattern;
};

/** 风格试听:曲风词条的签名片段——多轨 pattern(BPM/swing/音色/鼓点)一键播放。
 *  播放中再点=停止;其他地方开始播放会自动打断并复位这里。 */
export function StyleDemo({ title, hint, note, pattern }: Props) {
  const [state, setState] = React.useState<"idle" | "playing">("idle");
  const timer = React.useRef(0);
  // 自己启动播放的瞬间,playPattern 会先广播一次"打断"——那一次要忽略
  const starting = React.useRef(false);
  // 播放会话号:被新播放取代后,旧的 await 醒来不得再动状态
  const session = React.useRef(0);

  React.useEffect(() => {
    const off = onAudioInterrupt(() => {
      if (starting.current) return;
      session.current++;
      window.clearTimeout(timer.current);
      setState("idle");
    });
    return () => {
      off();
      window.clearTimeout(timer.current);
    };
  }, []);

  async function go() {
    if (state === "playing") {
      stopAllAudio(); // 回调会把本组件复位
      return;
    }
    const my = ++session.current;
    starting.current = true;
    setState("playing");
    try {
      await playPattern(pattern);
      if (my !== session.current) return; // 期间又被取代
      starting.current = false;
      // playPattern 排完时间线即返回,按总时长 + 收尾余量复位按钮
      const ms = ((pattern.beats * 60) / pattern.bpm) * 1000 + 900;
      timer.current = window.setTimeout(() => setState("idle"), ms);
    } catch {
      if (my === session.current) {
        starting.current = false;
        setState("idle"); // 无声环境(自动播放被拦等)直接复位
      }
    }
  }

  const swung = (pattern.swing ?? 0.5) > 0.55;

  return (
    <figure className="not-prose overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => void go()}
          aria-label={state === "playing" ? `停止:${title}` : `试听:${title}`}
          title={state === "playing" ? "停止" : "播放风格片段"}
          className={
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-90 " +
            (state === "playing"
              ? "bg-signature text-signature-foreground"
              : "bg-signature/10 text-signature hover:bg-signature hover:text-signature-foreground")
          }
        >
          {state === "playing" ? <Square className="size-3.5" /> : <Play className="size-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{title}</div>
          {hint && <div className="mt-0.5 text-sm text-muted-foreground">{hint}</div>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{pattern.bpm} BPM</span>
          {swung && <span className="inline-flex items-center gap-1">摇摆</span>}
        </div>
      </div>
      {note && (
        <figcaption className="border-t bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground">
          {note}
        </figcaption>
      )}
    </figure>
  );
}

export default StyleDemo;
