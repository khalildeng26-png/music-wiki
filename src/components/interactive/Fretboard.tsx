import * as React from "react";
import { Volume2 } from "lucide-react";
import { playNote } from "./audio";
import { midiToNote, noteToMidi } from "./noteUtils";

// 标准调弦,从 6 弦(低 E2)到 1 弦(高 E4);渲染时从上到下
const TUNING = ["E2", "A2", "D3", "G3", "B3", "E4"];
const INLAY = new Set([3, 5, 7, 9]);

type Props = {
  frets?: number;
  label?: string;
};

/** 吉他指板:点任意品格听音,琥珀高亮当前音。 */
export function Fretboard({ frets = 12, label }: Props) {
  const [active, setActive] = React.useState<string | null>(null);
  const cols = `repeat(${frets + 1}, minmax(0, 1fr))`;

  async function hit(note: string) {
    setActive(note);
    try {
      await playNote(note, 0.9);
    } catch {
      /* 忽略 */
    }
    window.setTimeout(() => setActive((a) => (a === note ? null : a)), 250);
  }

  const fretIdx = Array.from({ length: frets + 1 }, (_, i) => i);

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border bg-card">
      {label && (
        <figcaption className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {label}
        </figcaption>
      )}
      <div className="p-4">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[580px]">
            {/* 品位号 + 品记 */}
            <div
              className="mb-1 grid text-center"
              style={{ gridTemplateColumns: cols }}
            >
              {fretIdx.map((f) => (
                <div
                  key={f}
                  className="flex h-6 flex-col items-center justify-center text-[10px] text-muted-foreground"
                >
                  <span>{f === 0 ? "空弦" : f}</span>
                  {f !== 0 && (INLAY.has(f) || f === 12) && (
                    <span className="leading-none text-stone-400">
                      {"•".repeat(f === 12 ? 2 : 1)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* 指板 */}
            <div className="overflow-hidden rounded-md bg-amber-900">
              <div className="grid" style={{ gridTemplateColumns: cols }}>
                {TUNING.map((open) =>
                  fretIdx.map((f) => {
                    const note = midiToNote(noteToMidi(open) + f);
                    const display = note.replace(/\d+$/, "");
                    const on = active === note;
                    return (
                      <div
                        key={open + f}
                        className="relative flex items-center justify-center border-r border-stone-100/15"
                        style={{ height: 38 }}
                      >
                        {/* 琴弦横线 */}
                        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-stone-200/30" />
                        {/* 上弦枕(0 品右侧) */}
                        {f === 0 && (
                          <span className="absolute right-0 top-0 h-full w-[3px] bg-stone-100/80" />
                        )}
                        {/* 音品按钮 */}
                        <button
                          type="button"
                          onClick={() => hit(note)}
                          aria-label={note}
                          className={
                            "relative z-10 flex h-6 min-w-6 items-center justify-center rounded-full text-[9px] font-semibold transition " +
                            (on
                              ? "scale-110 bg-signature text-signature-foreground ring-2 ring-white/70"
                              : "bg-white/90 text-neutral-700 hover:bg-white")
                          }
                        >
                          {display}
                        </button>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Volume2 className="size-3.5" /> 点品格上的音名听音(从上到下:6 弦 E2 → 1 弦 E4)
        </p>
      </div>
    </figure>
  );
}

export default Fretboard;
