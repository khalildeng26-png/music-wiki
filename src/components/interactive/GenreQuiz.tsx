import { Play, RotateCcw, Square } from "lucide-react";
import * as React from "react";

import { onAudioInterrupt, playPattern, stopAllAudio, type Pattern } from "./audio";
import { GENRE_LIST, type GenreDemo } from "@/lib/genrePatterns";
import { VARIANTS } from "@/lib/quizVariants";

type Phase = "idle" | "asking" | "right" | "wrong";

/** 截取 pattern 前 8 拍当题目(整段 6-12 秒太长,猜谜 4-5 秒正合适) */
const clip = (p: Pattern): Pattern => ({
  ...p,
  beats: 8,
  tracks: p.tracks.map((tr) => ({ ...tr, events: tr.events.filter((e: { t: number }) => e.t < 8) })),
});

const shortName = (g: GenreDemo) => g.title.split(" · ")[0];

function pickQuestion(): { q: GenreDemo; pattern: Pattern; options: string[] } {
  const q = GENRE_LIST[Math.floor(Math.random() * GENRE_LIST.length)];
  // 主素材 + 变奏随机抽一段,防止听两遍就背答案
  const pool = [q.pattern, ...(VARIANTS[q.slug] ?? [])];
  const pattern = pool[Math.floor(Math.random() * pool.length)];
  const others = GENRE_LIST.filter((g) => g.slug !== q.slug)
    .map((g) => ({ g, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 3)
    .map((x) => x.g.slug);
  return {
    q,
    pattern,
    options: [q.slug, ...others].map((s) => ({ s, r: Math.random() })).sort((a, b) => a.r - b.r).map((x) => x.s),
  };
}

const bySlug = (slug: string) => GENRE_LIST.find((g) => g.slug === slug);

/** 首页「听音猜曲风」:随机播一段曲风签名(前 8 拍),四选一,即时反馈 + 连对计数。 */
export function GenreQuiz() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [q, setQ] = React.useState<GenreDemo | null>(null);
  const [pattern, setPattern] = React.useState<Pattern | null>(null);
  const [options, setOptions] = React.useState<string[]>([]);
  const [chosen, setChosen] = React.useState<string | null>(null);
  const [streak, setStreak] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const timer = React.useRef(0);
  const starting = React.useRef(false);

  React.useEffect(() => {
    const off = onAudioInterrupt(() => {
      if (starting.current) return;
      window.clearTimeout(timer.current);
      setPlaying(false);
    });
    return () => {
      off();
      window.clearTimeout(timer.current);
    };
  }, []);

  async function play(g: GenreDemo, p: Pattern) {
    if (playing) {
      stopAllAudio();
      return;
    }
    starting.current = true;
    setPlaying(true);
    void Promise.resolve().then(() => (starting.current = false));
    try {
      await playPattern(clip(p));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setPlaying(false), 600);
    } catch {
      setPlaying(false);
    }
  }

  function start() {
    const { q: nq, pattern: np, options: no } = pickQuestion();
    setQ(nq);
    setPattern(np);
    setOptions(no);
    setChosen(null);
    setPhase("asking");
    void play(nq, np); // 出题自动播一遍
  }

  function answer(slug: string) {
    if (phase !== "asking" || !q) return;
    setChosen(slug);
    if (slug === q.slug) {
      setStreak((s) => s + 1);
      setPhase("right");
    } else {
      setStreak(0);
      setPhase("wrong");
    }
    stopAllAudio(); // 猜完不用再响
  }

  return (
    <figure className="not-prose overflow-hidden rounded-2xl border bg-card">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {phase === "idle" ? (
              <>
                <div className="font-medium">随机播一段曲风签名(前几秒),猜猜它是谁</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  13 种曲风盲听测试——连对越多,说明耳朵越灵。
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => q && pattern && void play(q, pattern)}
                  aria-label={playing ? "停止播放" : "再听一遍"}
                  title={playing ? "停止" : "再听一遍"}
                  className={
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-90 " +
                    (playing
                      ? "bg-signature text-signature-foreground"
                      : "bg-signature/10 text-signature hover:bg-signature hover:text-signature-foreground")
                  }
                >
                  {playing ? <Square className="size-3.5" /> : <RotateCcw className="size-4" />}
                </button>
                <div className="font-medium">
                  {phase === "asking" ? "这段是哪种曲风?" : phase === "right" ? "答对了!" : "差一点——"}
                </div>
              </div>
            )}
          </div>
          {phase !== "idle" && (
            <span className="shrink-0 rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground tabular-nums">
              连对 {streak}
            </span>
          )}
        </div>

        {phase === "idle" ? (
          <button
            type="button"
            onClick={start}
            className="mt-5 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition hover:opacity-90 active:scale-95"
          >
            开始挑战 →
          </button>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {options.map((slug) => {
                const g = bySlug(slug);
                if (!g) return null;
                const isAnswer = q?.slug === slug;
                const isChosen = chosen === slug;
                const answered = phase === "right" || phase === "wrong";
                return (
                  <button
                    key={slug}
                    type="button"
                    disabled={answered}
                    onClick={() => answer(slug)}
                    className={
                      "rounded-lg border px-3 py-2.5 text-sm transition active:scale-95 " +
                      (answered
                        ? isAnswer
                          ? "border-signature bg-signature/10 font-medium text-signature"
                          : isChosen
                            ? "border-red-500/50 bg-red-500/5 text-red-600"
                            : "text-muted-foreground opacity-60"
                        : "hover:border-signature/50 hover:text-signature")
                    }
                  >
                    {shortName(g)}
                  </button>
                );
              })}
            </div>
            {q && (phase === "right" || phase === "wrong") && (
              <p className="mt-4 min-h-6 text-sm text-muted-foreground">
                <span className="font-medium text-signature">{shortName(q)}</span>
                <span className="mx-1.5">·</span>
                {q.hint}
                <a href={`/entries/${q.slug}`} className="ml-2 whitespace-nowrap text-signature hover:underline">
                  读词条 →
                </a>
              </p>
            )}
            {(phase === "right" || phase === "wrong") && (
              <button
                type="button"
                onClick={start}
                className="mt-4 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition hover:opacity-90 active:scale-95"
              >
                下一题 →
              </button>
            )}
          </>
        )}
      </div>
      <figcaption className="border-t bg-muted/40 px-5 py-1.5 text-xs text-muted-foreground">
        题目都是各曲风词条里的「风格试听」片段——猜错的,读完词条再来
      </figcaption>
    </figure>
  );
}

export default GenreQuiz;
