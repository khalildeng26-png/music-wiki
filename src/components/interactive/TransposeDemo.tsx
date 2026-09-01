import { Play, Square } from "lucide-react";
import * as React from "react";

import { playPattern, type Pattern, type Timbre } from "./audio";
import { usePlayToggle } from "./usePlayToggle";
import { TransposePicker } from "./TransposePicker";
import { track } from "@/lib/track";

type Props = {
  /** 旋律音名(科学记法) */
  melody: string[];
  /** 和弦进行(可选;提供时旋律播完接和弦) */
  chords?: string[][];
  timbre?: Timbre;
  label?: string;
};

/** 「一键换调」演示:同一段旋律/进行,±5 半音切换对比听。
 *  供 转调 词条等需要对比调的场景使用。
 *  旋律与和弦合成一个 pattern 走 playPattern(单次打断),
 *  不能串调 playSequence+playChordProgression——后者会 stopAllAudio 掐死前者的排音。 */
export function TransposeDemo({ melody, chords, timbre = "piano", label }: Props) {
  const [semis, setSemis] = React.useState(0);
  const { playing, start, stop } = usePlayToggle();

  const SPB = 60 / 118; // 每拍 0.508s
  const melodyEvents = melody.map((n, i) => ({ t: i, notes: [n], dur: 0.85, vel: 0.8 }));
  const chordEvents = (chords ?? []).map((ch, i) => ({
    t: melody.length + 0.5 + i * 2.25,
    notes: ch,
    dur: 1.75,
    vel: 0.7,
  }));
  const pattern: Pattern = {
    bpm: 118,
    beats: melody.length + 0.5 + (chords?.length ?? 0) * 2.25 + 1,
    tracks: [{ kind: "notes", timbre, events: [...melodyEvents, ...chordEvents] }],
  };
  const totalMs = pattern.beats * SPB * 1000 + 400;

  // s 显式传调:换调重播时 setSemis 尚未提交,闭包里的 semis 是旧值
  function play(s = semis) {
    track("transpose-demo-play", { semis: s });
    void start(() => playPattern(pattern, { transpose: s }), totalMs);
  }

  // 播放中换调:立刻打断并以新调重播;没在播就只记账,等下次开播生效
  function onTranspose(v: number) {
    setSemis(v);
    if (playing) play(v);
  }

  return (
    <figure className="not-prose overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => (playing ? stop() : play())}
          aria-label={playing ? "停止" : "播放当前调"}
          aria-pressed={playing}
          title={playing ? "停止" : "播放当前调"}
          className={
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-90 " +
            (playing
              ? "play-pulse bg-signature text-signature-foreground"
              : "bg-signature/10 text-signature hover:bg-signature hover:text-signature-foreground")
          }
        >
          {playing ? <Square className="size-3.5" /> : <Play className="size-4" />}
        </button>
        {label && <div className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</div>}
      </div>
      <div className="border-t bg-muted/30 px-4 py-3">
        <TransposePicker value={semis} onChange={onTranspose} />
      </div>
      <figcaption className="border-t bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground">
        换调 = 整体平移:音与音的距离不变,只是起点变了
      </figcaption>
    </figure>
  );
}

export default TransposeDemo;
