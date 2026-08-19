import { Volume2 } from "lucide-react";
import * as React from "react";

import { playNote } from "./audio";

const CHROM = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

type Key = { note: string; black: boolean; whiteBefore: number };

function buildKeys(startOct: number, octaves: number): { keys: Key[]; whiteCount: number } {
  const keys: Key[] = [];
  let whiteCount = 0;
  for (let o = 0; o < octaves; o++) {
    for (const n of CHROM) {
      const black = n.length === 2;
      keys.push({ note: `${n}${startOct + o}`, black, whiteBefore: whiteCount });
      if (!black) whiteCount += 1;
    }
  }
  // 末尾补一个高音 C,让键盘收尾干净
  keys.push({ note: `C${startOct + octaves}`, black: false, whiteBefore: whiteCount });
  return { keys, whiteCount: whiteCount + 1 };
}

type Props = {
  startOct?: number;
  octaves?: number;
  label?: string;
  /** 键长(px),默认 160(词条内紧凑);首屏等展示场景传 256 更像真琴 */
  keyHeight?: number;
  /** 最小宽度(px),默认 440;宽场景可调大让键更舒展 */
  minWidth?: number;
};

/** 虚拟钢琴:点琴键用 Tone.js 发声,琥珀高亮当前键。 */
export function Piano({
  startOct = 4,
  octaves = 2,
  label,
  keyHeight = 160,
  minWidth = 440,
}: Props) {
  const [active, setActive] = React.useState<string | null>(null);
  const { keys, whiteCount } = React.useMemo(
    () => buildKeys(startOct, octaves),
    [startOct, octaves],
  );
  const whiteW = 100 / whiteCount;
  const blackW = whiteW * 0.62;

  async function hit(note: string) {
    setActive(note);
    try {
      // 虚拟钢琴键 → 永远用钢琴音色
      await playNote(note, 0.9, "piano");
    } catch {
      /* 忽略 */
    }
    window.setTimeout(() => setActive((a) => (a === note ? null : a)), 250);
  }

  const whites = keys.filter((k) => !k.black);
  const blacks = keys.filter((k) => k.black);

  return (
    <figure className="not-prose overflow-hidden rounded-xl border bg-card">
      {label && (
        <figcaption className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {label}
        </figcaption>
      )}
      <div className="p-4">
        <div className="overflow-x-auto pb-2">
          <div className="relative mx-auto" style={{ height: keyHeight, minWidth }}>
            {/* 白键 */}
            <div className="flex h-full">
              {whites.map((k) => {
                const on = active === k.note;
                const isC = k.note.startsWith("C");
                return (
                  <button
                    key={k.note}
                    type="button"
                    onClick={() => hit(k.note)}
                    aria-label={k.note}
                    className={
                      "flex flex-1 flex-col items-center justify-end rounded-b-md border border-t-0 pb-2 text-[10px] transition " +
                      (on
                        ? "bg-signature text-signature-foreground"
                        : "bg-white text-slate-400 hover:bg-slate-100")
                    }
                  >
                    {isC && <span className={on ? "" : "text-slate-500"}>{k.note}</span>}
                  </button>
                );
              })}
            </div>
            {/* 黑键 */}
            <div className="absolute inset-x-0 top-0 h-[62%]">
              {blacks.map((k) => {
                const on = active === k.note;
                const left = k.whiteBefore * whiteW - blackW / 2;
                return (
                  <button
                    key={k.note}
                    type="button"
                    onClick={() => hit(k.note)}
                    aria-label={k.note}
                    className={
                      "absolute top-0 rounded-b-md transition " +
                      (on ? "bg-signature" : "bg-neutral-900 hover:bg-neutral-700")
                    }
                    style={{ left: `${left}%`, width: `${blackW}%`, height: "100%" }}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Volume2 className="size-3.5" /> 点任意琴键听音(白键上标了每个 C 的位置)
        </p>
      </div>
    </figure>
  );
}

export default Piano;
