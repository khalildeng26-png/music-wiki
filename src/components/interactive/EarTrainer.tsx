import { Play, RotateCcw } from "lucide-react";
import * as React from "react";

import { playChord, playSequence } from "./audio";
import { midiToNote, noteToMidi } from "./noteUtils";

type Mode = "interval" | "chord";

const INTERVALS = [
  { label: "小三度", semis: 3 },
  { label: "大三度", semis: 4 },
  { label: "纯四度", semis: 5 },
  { label: "纯五度", semis: 7 },
  { label: "纯八度", semis: 12 },
];
const ROOTS = ["C4", "D4", "E4", "F4", "G4"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Question = {
  notes: string[];
  answer: string;
  options: string[];
  chord: boolean;
};

function makeQuestion(mode: Mode): Question {
  const root = rand(ROOTS);
  if (mode === "chord") {
    const major = Math.random() < 0.5;
    const notes = major
      ? [root, midiToNote(noteToMidi(root) + 4), midiToNote(noteToMidi(root) + 7)]
      : [root, midiToNote(noteToMidi(root) + 3), midiToNote(noteToMidi(root) + 7)];
    return {
      notes,
      answer: major ? "大三和弦" : "小三和弦",
      options: ["大三和弦", "小三和弦"],
      chord: true,
    };
  }
  const iv = rand(INTERVALS);
  return {
    notes: [root, midiToNote(noteToMidi(root) + iv.semis)],
    answer: iv.label,
    options: INTERVALS.map((i) => i.label),
    chord: false,
  };
}

function play(q: Question) {
  if (q.chord) void playChord(q.notes);
  else void playSequence(q.notes, 0.6, 0.05);
}

/** 练耳:听音程(旋律)或和弦(大/小三),选答案,即时反馈。 */
export function EarTrainer({ mode = "interval" }: { mode?: Mode }) {
  const [q, setQ] = React.useState<Question>(() => makeQuestion(mode));
  const [picked, setPicked] = React.useState<string | null>(null);

  React.useEffect(() => {
    const nq = makeQuestion(mode);
    setQ(nq);
    setPicked(null);
  }, [mode]);

  const answered = picked !== null;
  const correct = picked === q.answer;

  function choose(opt: string) {
    if (answered) return;
    setPicked(opt);
  }

  function next() {
    const nq = makeQuestion(mode);
    setQ(nq);
    setPicked(null);
    play(nq); // 下一题是点击手势,可立即播放新题
  }

  return (
    <figure className="not-prose rounded-xl border bg-card p-5">
      <figcaption className="mb-4 text-sm text-muted-foreground">
        {mode === "chord"
          ? "听辨和弦:这是大三和弦还是小三和弦?"
          : "听辨音程:先后响起的两个音,是什么音程?"}
      </figcaption>

      <button
        type="button"
        onClick={() => play(q)}
        className="inline-flex items-center gap-2 rounded-lg bg-signature px-4 py-2 text-sm font-medium text-signature-foreground transition hover:opacity-90"
      >
        <Play className="size-4" /> {answered ? "再听一遍" : "播放"}
      </button>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {q.options.map((opt) => {
          const isAnswer = answered && opt === q.answer;
          const isWrong = answered && opt === picked && !correct;
          return (
            <button
              key={opt}
              type="button"
              disabled={answered}
              onClick={() => choose(opt)}
              className={
                "rounded-lg border px-3 py-2 text-sm font-medium transition " +
                (isAnswer
                  ? "border-transparent bg-green-600 text-white"
                  : isWrong
                    ? "border-transparent bg-red-500 text-white"
                    : "bg-background hover:border-signature/50 hover:text-signature disabled:opacity-50")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
          <span className={correct ? "font-medium text-green-600" : "text-red-500"}>
            {correct ? "对了!" : `正确答案:${q.answer}`}
          </span>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-signature"
          >
            <RotateCcw className="size-3.5" /> 下一题
          </button>
        </div>
      )}
    </figure>
  );
}

export default EarTrainer;
