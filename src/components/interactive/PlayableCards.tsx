import { Loader2, Play } from "lucide-react";
import * as React from "react";

import { playChordProgression, playSequence, type Timbre } from "./audio";

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

/** 声音签名试听键:点一下就地播放这条内容的"代表声音"。 */
export function PlayChip({ sig, label }: { sig: SoundSig; label: string }) {
  const [state, setState] = React.useState<"idle" | "playing">("idle");

  async function go() {
    if (state === "playing") return;
    setState("playing");
    try {
      await play(sig);
    } catch {
      /* 无声环境忽略 */
    }
    setState("idle");
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void go();
      }}
      aria-label={label}
      title={label}
      className={
        "inline-flex size-9 items-center justify-center rounded-full transition active:scale-90 " +
        (state === "playing"
          ? "bg-signature text-signature-foreground"
          : "bg-signature/10 text-signature hover:bg-signature hover:text-signature-foreground")
      }
    >
      {state === "playing" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Play className="size-4" />
      )}
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
            <span className="w-fit rounded-md bg-signature/10 px-2 py-0.5 text-xs font-medium text-signature">
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
