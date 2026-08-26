import { Play, Square } from "lucide-react";
import * as React from "react";

import { onAudioInterrupt, playPattern, stopAllAudio, type Pattern } from "./audio";

/** 声音起播偏移(playPattern 首声源约在 +120ms),动画延迟统一加这一段 */
const LEAD = 120;

type CardDef = {
  id: string;
  label: string;
  tagline: string;
  sig?: Pattern;
};

const CARDS: CardDef[] = [
  {
    id: "theory",
    label: "乐理",
    tagline: "音从哪来、怎么组织——音程、音阶、调式,音乐的语法书。",
    sig: {
      bpm: 132,
      beats: 4,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"].map((n, i) => ({
            t: i * 0.5,
            notes: [n],
            dur: 0.42,
            vel: 0.8,
          })),
        },
      ],
    },
  },
  {
    id: "notation",
    label: "记谱",
    tagline: "把音乐写下来的一套语言:五线谱、简谱、和弦标记。",
    sig: {
      bpm: 100,
      beats: 4,
      tracks: [
        {
          kind: "drums",
          events: [
            { t: 0, hit: "kick", vel: 0.85 },
            { t: 1, hit: "snare", vel: 0.75 },
            { t: 2, hit: "kick", vel: 0.85 },
            { t: 3, hit: "snare", vel: 0.75 },
            ...Array.from({ length: 8 }, (_, i) => ({ t: i * 0.5, hit: "hihat" as const, vel: 0.4 })),
          ],
        },
      ],
    },
  },
  {
    id: "harmony",
    label: "和声",
    tagline: "音与音叠起来的学问:和弦、进行、终止式。",
    sig: {
      bpm: 100,
      beats: 4,
      tracks: [
        {
          kind: "notes",
          timbre: "piano",
          events: [
            ["C4", "E4", "G4"],
            ["F3", "A3", "C4"],
            ["G3", "B3", "D4"],
            ["C4", "E4", "G4"],
          ].map((ch, i) => ({ t: i, notes: ch, dur: 0.9, vel: 0.75 })),
        },
      ],
    },
  },
  {
    id: "genre",
    label: "曲风",
    tagline: "听得出差别的流派——每一种都能在站里直接试听。",
    sig: {
      bpm: 110,
      swing: 0.62,
      beats: 4,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: ["E3", "G3", "A3", "A3", "G3", "E3", "G3", "B3"].map((n, i) => ({
            t: i * 0.5,
            notes: [n],
            dur: 0.4,
            vel: 0.8,
          })),
        },
      ],
    },
  },
  {
    id: "instrument",
    label: "乐器",
    tagline: "从钢琴到唢呐,每件乐器的性格、音色与玩法。",
    sig: {
      bpm: 96,
      beats: 4,
      tracks: [
        {
          kind: "notes",
          timbre: "guitar",
          events: [{ t: 0, notes: ["E3", "G3", "B3"], dur: 1.4, vel: 0.7 }],
        },
        { kind: "notes", timbre: "trumpet", events: [{ t: 1.5, notes: ["G4"], dur: 1.2, vel: 0.55 }] },
        { kind: "notes", timbre: "erhu", events: [{ t: 2.5, notes: ["A4"], dur: 1.4, vel: 0.5 }] },
      ],
    },
  },
  {
    id: "vocal",
    label: "唱法",
    tagline: "人声也是一件乐器:气息、共鸣、真假声。",
    // 暂无声乐采样,不放播放键——宁可不响,不用错的音色凑数
  },
];

const durMs = (p: Pattern) => (p.beats * 60) / p.bpm * 1000;

/** 五线谱底纹 */
function StaffLines() {
  return (
    <div className="absolute inset-0">
      {[22, 36, 50, 64, 78].map((top) => (
        <div key={top} className="absolute right-3 left-3 h-px bg-border" style={{ top: `${top}%` }} />
      ))}
    </div>
  );
}

/** 各分类的演示动画;on = 声音正在响(与起播同步) */
function Media({ card, on }: { card: CardDef; on: boolean }) {
  const sig = card.sig;
  const dur = sig ? durMs(sig) : 0;
  const anim = (style: React.CSSProperties) => (on ? style : undefined);

  return (
    <div
      className={
        "cat-media relative h-24 overflow-hidden rounded-lg border bg-surface " + (on ? "on" : "")
      }
    >
      {card.id === "theory" && (
        <>
          <StaffLines />
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute size-2.5 rounded-full transition-none"
              style={{
                left: `${7 + i * 11.6}%`,
                bottom: `${14 + i * 9}%`,
                background: "color-mix(in oklab, var(--signature) 30%, var(--surface))",
                ...anim({
                  animation: `cat-dot ${dur}ms linear both`,
                  animationDelay: `${LEAD + (i * dur) / 8}ms`,
                }),
              }}
            />
          ))}
        </>
      )}

      {card.id === "notation" && (
        <>
          <StaffLines />
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="absolute size-3 rounded-full opacity-0"
              style={{
                left: `${16 + i * 20}%`,
                top: "42%",
                background: "var(--signature)",
                ...anim({
                  animation: `cat-fall 420ms ease-out both`,
                  animationDelay: `${LEAD + (i * dur) / 4}ms`,
                }),
              }}
            />
          ))}
        </>
      )}

      {card.id === "harmony" && (
        <div className="absolute inset-0 flex flex-col-reverse items-center justify-center gap-1.5 py-3">
          {[0, 1, 2].map((j) => (
            <div
              key={j}
              className="h-2.5 w-16 rounded-full opacity-0"
              style={{
                background: `color-mix(in oklab, var(--signature) ${85 - j * 20}%, var(--surface))`,
                ...anim({
                  animation: `cat-chord ${dur / 4}ms ease-in-out 4 both`,
                  animationDelay: `${LEAD + j * 70}ms`,
                }),
              }}
            />
          ))}
        </div>
      )}

      {card.id === "genre" && (
        <div className="absolute inset-0 flex items-end justify-center gap-1.5 px-4 pb-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="w-2 origin-bottom rounded-full"
              style={{
                height: `${34 + ((i * 29) % 5) * 12}%`,
                background: "color-mix(in oklab, var(--signature) 45%, var(--surface))",
                transform: "scaleY(0.22)",
                ...anim({
                  animation: `cat-eq ${260 + (i % 5) * 80}ms ease-in-out infinite alternate`,
                  animationDelay: `${LEAD + i * 45}ms`,
                }),
              }}
            />
          ))}
        </div>
      )}

      {card.id === "instrument" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5">
          {[0, 1, 2].map((j) => (
            <div
              key={j}
              className="h-0.5 w-4/5 rounded-full"
              style={{
                background: "color-mix(in oklab, var(--signature) 40%, var(--surface))",
                ...anim({
                  animation: `cat-str ${dur / 3}ms linear 3`,
                  animationDelay: `${LEAD + (j * dur) / 3}ms`,
                }),
              }}
            />
          ))}
        </div>
      )}

      {card.id === "vocal" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="size-10 rounded-full border-2 border-signature/50"
            style={{ animation: "cat-breath 4s ease-in-out infinite" }}
          />
        </div>
      )}
    </div>
  );
}

/** 首页分类卡:导航 + 定位文案 + 与声音签名同步的动画演示。 */
export function CategoryCards({ counts }: { counts: Record<string, number> }) {
  const [playing, setPlaying] = React.useState<string | null>(null);
  // liveId:onStart 回调置位——动画与声音同刻起跑(首次点击要等采样加载,不能点下就动画)
  const [liveId, setLiveId] = React.useState<string | null>(null);
  const timer = React.useRef(0);
  const starting = React.useRef(false);

  React.useEffect(() => {
    const off = onAudioInterrupt(() => {
      if (starting.current) return;
      window.clearTimeout(timer.current);
      setPlaying(null);
      setLiveId(null);
    });
    return () => {
      off();
      window.clearTimeout(timer.current);
    };
  }, []);

  async function play(card: CardDef) {
    if (!card.sig) return;
    if (playing === card.id) {
      stopAllAudio();
      return;
    }
    starting.current = true;
    setPlaying(card.id);
    void Promise.resolve().then(() => (starting.current = false));
    try {
      await playPattern(card.sig, { onStart: () => setLiveId(card.id) });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setPlaying(null);
        setLiveId(null);
      }, 600);
    } catch {
      setPlaying(null);
      setLiveId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((c) => (
        <div key={c.id} className="relative">
          <a
            href={`/categories/${c.id}`}
            className={
              "group flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-signature/50 hover:shadow-md " +
              (playing === c.id ? "border-signature/60" : "")
            }
          >
            <Media card={c} on={liveId === c.id} />
            <div className="flex items-baseline gap-2 px-1">
              <span className="text-lg font-semibold group-hover:text-signature">{c.label}</span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {counts[c.id] ?? 0} 篇
              </span>
              {c.sig ? (
                <span className="ml-auto text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100">
                  声音签名 ↓
                </span>
              ) : null}
            </div>
            <div className="px-1 pb-1 text-sm leading-relaxed text-muted-foreground">{c.tagline}</div>
          </a>
          {c.sig && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void play(c);
              }}
              aria-label={playing === c.id ? `停止:${c.label}` : `试听:${c.label}的声音签名`}
              title={playing === c.id ? "停止" : "这个分类的声音"}
              className={
                "absolute top-7 right-7 inline-flex size-8 items-center justify-center rounded-full transition active:scale-90 " +
                (playing === c.id
                  ? "bg-signature text-signature-foreground"
                  : "bg-signature/10 text-signature hover:bg-signature hover:text-signature-foreground")
              }
            >
              {playing === c.id ? <Square className="size-3" /> : <Play className="size-3.5" />}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default CategoryCards;
