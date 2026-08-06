import * as React from "react";
import { Hand, Play } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** 节奏跟打:听节拍,跟着点(或按空格),判定每拍是否踩准。 */
export function RhythmTap({ bpm = 80, beats = 8 }: { bpm?: number; beats?: number }) {
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [current, setCurrent] = React.useState(-1);
  const [hits, setHits] = React.useState(0);
  const [hint, setHint] = React.useState("准备");
  const beatInterval = 60 / bpm;

  const toneRef = React.useRef<any>(null);
  const synthRef = React.useRef<any>(null);
  const hitSetRef = React.useRef<Set<number>>(new Set());

  async function start() {
    const Tone: any = await import("tone");
    await Tone.start();
    toneRef.current = Tone;
    const transport = Tone.getTransport?.() ?? Tone.Transport;
    transport.cancel();
    transport.bpm.value = bpm;
    const synth = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 },
      volume: -12,
    }).toDestination();
    synthRef.current = synth;

    hitSetRef.current = new Set();
    setHits(0);
    setHint("跟上拍子!");
    setDone(false);
    setCurrent(-1);
    setRunning(true);

    let i = 0;
    transport.scheduleRepeat((time: number) => {
      if (i >= beats) {
        Tone.Draw.schedule(() => finish(), time);
        return;
      }
      synth.triggerAttackRelease(i === 0 ? "C6" : "G5", "32n", time);
      Tone.Draw.schedule(() => setCurrent(i), time);
      i++;
    }, beatInterval);
    transport.start();
  }

  function finish() {
    const Tone = toneRef.current;
    if (Tone) {
      const t = Tone.getTransport?.() ?? Tone.Transport;
      try {
        t.stop();
        t.cancel();
      } catch {
        /* 忽略 */
      }
    }
    synthRef.current?.dispose?.();
    synthRef.current = null;
    setRunning(false);
    setDone(true);
    setCurrent(-1);
  }

  function tap() {
    if (!running) return;
    const Tone = toneRef.current;
    if (!Tone) return;
    const transport = Tone.getTransport?.() ?? Tone.Transport;
    const pos = transport.seconds;
    const idx = Math.round(pos / beatInterval);
    const beatTime = idx * beatInterval;
    const diffMs = (pos - beatTime) * 1000;
    const adiff = Math.abs(diffMs);
    if (hitSetRef.current.has(idx)) {
      setHint("这拍已计");
    } else if (adiff <= 150) {
      hitSetRef.current.add(idx);
      setHits((h) => h + 1);
      setHint("准 ✓");
    } else {
      setHint(diffMs > 0 ? "晚了" : "早了");
    }
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (running) tap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  React.useEffect(() => {
    return () => {
      const Tone = toneRef.current;
      if (Tone) {
        const t = Tone.getTransport?.() ?? Tone.Transport;
        try {
          t.stop();
          t.cancel();
        } catch {
          /* 忽略 */
        }
      }
      synthRef.current?.dispose?.();
    };
  }, []);

  return (
    <figure className="not-prose my-8 rounded-xl border bg-card p-5">
      <figcaption className="mb-3 text-sm text-muted-foreground">
        节奏跟打:听到拍子后,跟着节拍点下面的大圆按钮(或按空格),看你能踩准几拍。BPM {bpm},共 {beats} 拍。
      </figcaption>

      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: beats }, (_, i) => (
          <span
            key={i}
            className={
              "size-3 rounded-full transition " +
              (running && current === i
                ? i === 0
                  ? "scale-150 bg-signature"
                  : "scale-125 bg-signature/70"
                : "bg-muted-foreground/25")
            }
          />
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        {!running ? (
          <button
            type="button"
            onClick={() => void start()}
            className="inline-flex items-center gap-2 rounded-full bg-signature px-6 py-3 text-sm font-medium text-signature-foreground transition hover:opacity-90"
          >
            <Play className="size-4" /> {done ? "再来一次" : "开始挑战"}
          </button>
        ) : (
          <button
            type="button"
            onClick={tap}
            className="inline-flex h-28 w-28 select-none flex-col items-center justify-center rounded-full border-4 border-signature bg-signature/10 text-signature transition active:scale-95 active:bg-signature/30"
          >
            <Hand className="size-7" />
            <span className="mt-1 text-sm font-semibold">TAP</span>
          </button>
        )}

        <div className="text-sm">
          {running ? (
            <span>
              命中 {hits} / {beats} ·{" "}
              <span className="text-muted-foreground">{hint}</span>
            </span>
          ) : done ? (
            <span>
              本轮命中 <b className="text-signature">{hits}</b> / {beats}
            </span>
          ) : (
            <span className="text-muted-foreground">点开始挑战</span>
          )}
        </div>
      </div>
    </figure>
  );
}

export default RhythmTap;
