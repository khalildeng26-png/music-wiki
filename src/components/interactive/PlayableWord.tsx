import { Play } from "lucide-react";
import * as React from "react";

import { playChord } from "./audio";

type Props = {
  word: string;
  /** 点击时播放的和弦(音名数组),默认 C 大三和弦 */
  chord?: string[];
};

/** 可点的词:嵌在大标题里,点击播放一个和弦——价值主张本身即演示。 */
export function PlayableWord({ word, chord = ["C4", "E4", "G4"] }: Props) {
  const [hit, setHit] = React.useState(false);

  async function play() {
    setHit(true);
    try {
      await playChord(chord, 1.1);
    } catch {
      /* 无声环境忽略 */
    }
    window.setTimeout(() => setHit(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={() => void play()}
      aria-label={`${word}——点一下听听`}
      className="inline-flex items-center gap-1.5 text-signature transition-transform active:scale-95"
    >
      <span className="underline decoration-signature/40 decoration-wavy underline-offset-8">
        {word}
      </span>
      <span
        className={
          "inline-flex size-6 items-center justify-center rounded-full bg-signature text-signature-foreground transition-transform " +
          (hit ? "scale-110" : "opacity-80 hover:scale-105")
        }
      >
        <Play className="size-3" />
      </span>
    </button>
  );
}

export default PlayableWord;
