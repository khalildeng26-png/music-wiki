import { Play, RotateCcw, Volume2 } from "lucide-react";
import * as React from "react";

import { track } from "@/lib/track";

import { playNote } from "./audio";

/** C4–B4 的 12 个半音:白键一排、黑键一排,答案按音名(不带八度)。
 *  内部一律用机器名(C#),显示时才转 ♯ 字形——noteToMidi 只认 #/b */
const WHITES = ["C", "D", "E", "F", "G", "A", "B"];
const BLACKS = ["C#", "D#", "F#", "G#", "A#"];
const ALL = [...WHITES, ...BLACKS];
const TOTAL = 10;
const show = (n: string) => n.replace("#", "♯");

/** 随机出题:与上一题不同音名,避免连续同音 */
function nextNote(prev: string | null): string {
  let n = ALL[Math.floor(Math.random() * ALL.length)];
  while (n === prev) n = ALL[Math.floor(Math.random() * ALL.length)];
  return n;
}

function verdict(score: number): string {
  if (score >= 9) return "这个成绩像绝对音感。它大多在 4–6 岁前形成,成年人极难获得——值得再测几轮排除运气。";
  if (score >= 7) return "很强的音高记忆!大概率是长期接触音乐攒下的「锚点音」在起作用。";
  if (score >= 5) return "不错的成绩。多数人靠锚点音(C 或 A)再推算其余音,这正是可以练的部分。";
  return "正常人类水平——绝对音感本来就是少数派(约万分之一),相对音感才是人人能练的真功夫。";
}

type Phase = "idle" | "asking" | "feedback" | "done";

/** 绝对音感小测:无参照听一个音,直接报名。10 题一轮,可重听。
 *  与 EarTrainer(相对音感:比较两个音)互补,这是「点名」不是「比较」。 */
export function AbsolutePitch() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [idx, setIdx] = React.useState(0);
  const [note, setNote] = React.useState<string | null>(null);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [score, setScore] = React.useState(0);

  function play(noteName: string) {
    void playNote(noteName + "4", 1.1, "piano");
  }

  function start() {
    const n = nextNote(null);
    setPhase("asking");
    setIdx(0);
    setScore(0);
    setNote(n);
    setPicked(null);
    track("absolute-pitch-start");
    play(n);
  }

  function choose(opt: string) {
    if (phase !== "asking" || !note) return;
    const correct = opt === note;
    setPicked(opt);
    if (correct) setScore((s) => s + 1);
    setPhase("feedback");
    track("absolute-pitch-answer", { note, chose: opt, correct });
  }

  function next() {
    if (idx + 1 >= TOTAL) {
      track("absolute-pitch-result", { score: score });
      setPhase("done");
      return;
    }
    const n = nextNote(note);
    setIdx((i) => i + 1);
    setNote(n);
    setPicked(null);
    setPhase("asking");
    play(n); // 「下一题」是点击手势,可立即出题
  }

  const chip = (label: string) => {
    const answered = phase === "feedback";
    const isAnswer = answered && label === note;
    const isWrong = answered && label === picked && picked !== note;
    return (
      <button
        key={label}
        type="button"
        disabled={phase !== "asking"}
        onClick={() => choose(label)}
        className={
          "min-w-10 rounded-lg border px-2.5 py-2 font-mono text-sm font-medium transition " +
          (isAnswer
            ? "border-transparent bg-green-600 text-white"
            : isWrong
              ? "border-transparent bg-red-500 text-white"
              : "bg-background hover:border-signature/50 hover:text-signature disabled:opacity-50")
        }
      >
        {show(label)}
      </button>
    );
  };

  return (
    <figure className="not-prose rounded-xl border bg-card p-5">
      <figcaption className="mb-4 text-sm text-muted-foreground">
        绝对音感小测:不给参照,听一个音直接报名。共 {TOTAL} 题,可随时重听。
      </figcaption>

      {phase === "idle" && (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-2 rounded-lg bg-signature px-4 py-2 text-sm font-medium text-signature-foreground transition hover:opacity-90"
        >
          <Volume2 className="size-4" /> 开始测试
        </button>
      )}

      {(phase === "asking" || phase === "feedback") && (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              第 {idx + 1} / {TOTAL} 题
            </span>
            <button
              type="button"
              onClick={() => note && play(note)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-signature px-3 py-1.5 text-xs font-medium text-signature-foreground transition hover:opacity-90"
            >
              <Play className="size-3.5" /> 重听
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {WHITES.map(chip)}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {BLACKS.map(chip)}
          </div>
          {phase === "feedback" && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
              <span className={picked === note ? "font-medium text-green-600" : "text-red-500"}>
                {picked === note ? "对了!" : `正确答案:${show(note ?? "")}`}
              </span>
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-signature"
              >
                <RotateCcw className="size-3.5" /> {idx + 1 >= TOTAL ? "看结果" : "下一题"}
              </button>
            </div>
          )}
        </>
      )}

      {phase === "done" && (
        <div className="flex flex-col gap-3">
          <div className="text-3xl font-display font-bold">
            {score} <span className="text-lg font-normal text-muted-foreground">/ {TOTAL}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{verdict(score)}</p>
          <button
            type="button"
            onClick={start}
            className="inline-flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-sm transition hover:border-signature/50 hover:text-signature"
          >
            <RotateCcw className="size-4" /> 再来一轮
          </button>
        </div>
      )}
    </figure>
  );
}

export default AbsolutePitch;
