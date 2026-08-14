import { Play, RotateCcw } from "lucide-react";
import * as React from "react";

import { playNote } from "./audio";
import { LETTERS, toAbc } from "./noteUtils";

function randomNote(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)] + "4";
}

/** 认音练习:看谱上的一个音,选它的音名,即时反馈(不记录成绩)。 */
export function NoteDemo() {
  const [target, setTarget] = React.useState<string>(randomNote);
  const [picked, setPicked] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const abcjs = (await import("abcjs")).default;
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      abcjs.renderAbc(ref.current, `X:1\nL:1/4\nK:C\n${toAbc(target)}`, {
        add_classes: true,
        staffwidth: 150,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [target]);

  const correctLetter = target[0];
  const answered = picked !== null;
  const correct = picked === correctLetter;

  function pick(l: string) {
    if (answered) return;
    setPicked(l);
    void playNote(target);
  }

  return (
    <figure className="not-prose my-8 rounded-xl border bg-card p-4">
      <figcaption className="mb-3 text-sm text-muted-foreground">
        认音练习:谱上这个音的音名是?
      </figcaption>
      <div className="flex items-center gap-4">
        <div ref={ref} className="text-foreground" />
        <button
          type="button"
          onClick={() => void playNote(target)}
          aria-label="播放这个音"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-signature text-signature-foreground transition hover:opacity-90"
        >
          <Play className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {LETTERS.map((l) => {
          const isAnswer = answered && l === correctLetter;
          const isWrongPick = answered && l === picked && !correct;
          return (
            <button
              key={l}
              type="button"
              disabled={answered}
              onClick={() => pick(l)}
              className={
                "inline-flex size-10 items-center justify-center rounded-lg border text-sm font-semibold transition " +
                (isAnswer
                  ? "border-transparent bg-green-600 text-white"
                  : isWrongPick
                    ? "border-transparent bg-red-500 text-white"
                    : "bg-background hover:border-signature/50 hover:text-signature disabled:opacity-50")
              }
            >
              {l}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
          <span className={correct ? "font-medium text-green-600" : "text-red-500"}>
            {correct ? "对了!" : `正确答案是 ${correctLetter}`}
          </span>
          <button
            type="button"
            onClick={() => {
              setTarget(randomNote());
              setPicked(null);
            }}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-signature"
          >
            <RotateCcw className="size-3.5" /> 下一题
          </button>
        </div>
      )}
    </figure>
  );
}

export default NoteDemo;
