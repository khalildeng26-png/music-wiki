import { Play, Square } from "lucide-react";
import * as React from "react";

import {
  onAudioInterrupt,
  playChordProgression,
  playSequence,
  stopAllAudio,
  type Timbre,
} from "./audio";

export type SoundSig =
  | { kind: "notes"; notes: string[]; timbre?: Timbre; dur?: number; gap?: number }
  | { kind: "chords"; chords: string[][]; timbre?: Timbre; dur?: number; gap?: number };

export type PlayableCard = {
  title: string;
  titleEn?: string;
  category: string;
  summary: string;
  href: string;
  sig?: SoundSig;
};

async function play(sig: SoundSig) {
  if (sig.kind === "notes") {
    await playSequence(sig.notes, sig.dur ?? 0.38, sig.gap ?? 0.06, sig.timbre);
  } else {
    await playChordProgression(sig.chords, sig.dur ?? 0.55, sig.gap ?? 0.12, sig.timbre);
  }
}

/** 声音签名试听键:点一下就地播放这条内容的"代表声音"。
 *  播放中再点=停止;其他地方开始播放会自动打断并复位这里。 */
export function PlayChip({ sig, label }: { sig: SoundSig; label: string }) {
  const [state, setState] = React.useState<"idle" | "playing">("idle");
  const timer = React.useRef(0);
  // 自己启动播放的瞬间,播放函数会先广播一次"打断"——那一次要忽略
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
      stopAllAudio();
      return;
    }
    const my = ++session.current;
    starting.current = true;
    setState("playing");
    // 播放函数的同步"自打断"广播发生在调用内部,微任务后即解除豁免(否则播放中无法停止)
    void Promise.resolve().then(() => (starting.current = false));
    try {
      await play(sig);
      if (my !== session.current) return; // 期间又被取代
      // play() 只负责排队,等序列自然结束再复位
      const ms =
        sig.kind === "notes"
          ? (sig.notes.length * ((sig.dur ?? 0.38) + (sig.gap ?? 0.06)) + 0.3) * 1000
          : (sig.chords.length * ((sig.dur ?? 0.55) + (sig.gap ?? 0.12)) + 0.3) * 1000;
      timer.current = window.setTimeout(() => setState("idle"), ms);
    } catch {
      if (my === session.current) {
        starting.current = false;
        setState("idle"); // 无声环境忽略
      }
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void go();
      }}
      aria-label={state === "playing" ? `停止:${label.replace(/^试听:/, "")}` : label}
      aria-pressed={state === "playing"}
      title={state === "playing" ? "停止" : label}
      className={
        "inline-flex size-9 items-center justify-center rounded-full transition active:scale-90 " +
        (state === "playing"
          ? "play-pulse bg-signature text-signature-foreground"
          : "bg-signature/10 text-signature hover:bg-signature hover:text-signature-foreground")
      }
    >
      {state === "playing" ? <Square className="size-3.5" /> : <Play className="size-4" />}
    </button>
  );
}

/** 「会响的」词条卡列表:卡片本身是静态链接,角上的试听键就地发声。 */
export function PlayableCards({ items }: { items: PlayableCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <div key={c.href} className="relative">
          <a
            href={c.href}
            className="group flex h-full flex-col gap-2 rounded-xl border bg-card p-5 pr-14 transition hover:-translate-y-0.5 hover:border-signature/50 hover:shadow-md"
          >
            <span className="w-fit rounded-md bg-signature/10 px-2 py-0.5 text-xs font-medium text-signature-ink">
              {c.category}
            </span>
            <div className="text-lg font-semibold group-hover:text-signature">
              {c.title}
              {c.titleEn && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">{c.titleEn}</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{c.summary}</div>
          </a>
          {c.sig && (
            <div className="absolute right-4 bottom-4">
              <PlayChip sig={c.sig} label={`试听:${c.title}`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PlayableCards;
