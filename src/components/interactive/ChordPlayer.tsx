import { Play } from "lucide-react";
import * as React from "react";

import { playChordProgression, type Timbre } from "./audio";

type Props = {
  chords: string[][];
  label: string;
  desc?: string;
  /** 播放音色,默认钢琴。 */
  timbre?: Timbre;
};

/** 和弦播放器:点一下依次奏响一串和弦(用于终止式、转位、进行示范)。 */
export function ChordPlayer({ chords, label, desc, timbre = "piano" }: Props) {
  const [playing, setPlaying] = React.useState(false);

  async function handle() {
    if (playing) return;
    setPlaying(true);
    const dur = 0.9;
    const gap = 0.25;
    try {
      await playChordProgression(chords, dur, gap, timbre);
    } catch {
      /* 忽略 */
    }
    window.setTimeout(() => setPlaying(false), chords.length * (dur + gap) * 1000 + 300);
  }

  return (
    <div className="not-prose my-3 flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <button
        type="button"
        onClick={() => void handle()}
        disabled={playing}
        aria-label={label}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-signature text-signature-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        <Play className="size-4" />
      </button>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
    </div>
  );
}

export default ChordPlayer;
