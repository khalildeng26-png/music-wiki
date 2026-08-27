import { Play, Square } from "lucide-react";
import * as React from "react";

import { playChordProgression, type Timbre } from "./audio";
import { usePlayToggle } from "./usePlayToggle";
import { TransposePicker } from "./TransposePicker";
import { transposeChords } from "@/lib/transpose";

type Props = {
  chords: string[][];
  label: string;
  desc?: string;
  /** 播放音色,默认钢琴。 */
  timbre?: Timbre;
  /** 显示一键换调选择器(默认关:仅移调教学等需要对比调的场景开) */
  transpose?: boolean;
};

/** 和弦播放器:点一下依次奏响一串和弦(用于终止式、转位、进行示范)。
 *  播放中再点=停止;其他地方开始播放会自动打断并复位这里。
 *  transpose 开启时附 ±5 半音换调(采样舒适区),原调名随偏移换算显示。 */
export function ChordPlayer({ chords, label, desc, timbre = "piano", transpose }: Props) {
  const { playing, start, stop } = usePlayToggle();
  const [semis, setSemis] = React.useState(0);

  function handle() {
    if (playing) return stop();
    const dur = 0.9;
    const gap = 0.25;
    const play = transposeChords(chords, semis);
    void start(
      () => playChordProgression(play, dur, gap, timbre),
      chords.length * (dur + gap) * 1000 + 300,
    );
  }

  return (
    <div className="not-prose my-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handle}
          aria-label={playing ? `停止:${label}` : label}
          aria-pressed={playing}
          title={playing ? "停止" : label}
          className={
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-signature text-signature-foreground transition hover:opacity-90 " +
            (playing ? "play-pulse" : "")
          }
        >
          {playing ? <Square className="size-3.5" /> : <Play className="size-4" />}
        </button>
        <div>
          <div className="text-sm font-medium">{label}</div>
          {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
        </div>
      </div>
      {transpose && (
        <div className="mt-3 border-t pt-3">
          <TransposePicker value={semis} onChange={setSemis} />
        </div>
      )}
    </div>
  );
}

export default ChordPlayer;
