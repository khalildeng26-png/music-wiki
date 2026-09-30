import { Play, Square } from "lucide-react";
import * as React from "react";

import { track } from "@/lib/track";
import { transposeNotes } from "@/lib/transpose";

import { playSequence, type Timbre } from "./audio";
import { toAbc } from "./noteUtils";
import { TransposePicker } from "./TransposePicker";
import { usePlayToggle } from "./usePlayToggle";

type Props = {
  notes: string[];
  label?: string;
  /** 播放音色,默认钢琴。词条在哪个乐器语境下就用哪个(如 guitar* 用 guitar)。 */
  timbre?: Timbre;
  /** 谱号,默认高音;低音乐器(贝斯等)传 "bass" 免得加线满天飞 */
  clef?: "treble" | "bass";
  /** 显示一键换调选择器(默认关):开启后谱面随移调重渲染、音频同步换调——
   *  移调二期:一期只换了音频,谱面不动;这里让「读谱的人」也看见平移 */
  transpose?: boolean;
};

/** 渲染一段五线谱(abcjs),点琥珀播放键用 Tone.js 依次发声。
 *  transpose 开启时附 ±5 半音换调:abcjs 按新音高重绘谱面,播放同步换调。 */
export function StaffNotation({
  notes,
  label,
  timbre = "piano",
  clef = "treble",
  transpose,
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { playing, start, stop } = usePlayToggle();
  const [semis, setSemis] = React.useState(0);
  // 谱面展示的音(换调后随之平移);渲染 effect 与播放共用这一份
  const shown = React.useMemo(() => (semis ? transposeNotes(notes, semis) : notes), [notes, semis]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const abcjs = (await import("abcjs")).default;
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      // 固定 K:C:每个变化音显式标注升降号,换调后无需换调号记法,渲染最稳
      const key = clef === "bass" ? "K:C clef=bass" : "K:C";
      const abc = `X:1\nL:1/4\n${key}\n${shown.map(toAbc).join(" ")} |`;
      abcjs.renderAbc(ref.current, abc, {
        responsive: "resize",
        add_classes: true,
        staffwidth: Math.max(160, Math.min(560, shown.length * 46 + 40)),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [shown.join(","), clef]);

  // s 显式传调:换调重播时 setSemis 尚未提交,闭包里的 semis 是旧值(与 ChordPlayer 同款坑)
  function beginPlay(s: number) {
    track("staff-play", { label, semis: s });
    const ns = s ? transposeNotes(notes, s) : notes;
    const total = ns.length * (0.45 + 0.08) * 1000 + 300;
    void start(() => playSequence(ns, 0.45, 0.08, timbre), total);
  }

  function handlePlay() {
    if (playing) return stop();
    beginPlay(semis);
  }

  // 播放中换调:立刻打断并以新调重播;没在播就只重绘谱面,等下次开播生效
  function onTranspose(v: number) {
    setSemis(v);
    if (playing) beginPlay(v);
  }

  return (
    <figure className="not-prose overflow-hidden rounded-xl border bg-card">
      {label && (
        <figcaption className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {label}
        </figcaption>
      )}
      <div className="p-4">
        <div ref={ref} className="overflow-x-auto text-foreground" />
        <button
          type="button"
          onClick={handlePlay}
          aria-pressed={playing}
          className={
            "mt-3 inline-flex items-center gap-2 rounded-lg bg-signature px-4 py-2 text-sm font-medium text-signature-foreground transition hover:opacity-90 " +
            (playing ? "play-pulse" : "")
          }
        >
          {playing ? <Square className="size-3.5" /> : <Play className="size-4" />}
          {playing ? "停止" : "播放"}
        </button>
        {transpose && (
          <div className="mt-3 border-t pt-3">
            <TransposePicker value={semis} onChange={onTranspose} />
          </div>
        )}
      </div>
    </figure>
  );
}

export default StaffNotation;
