import { Pause, Play } from "lucide-react";
import * as React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function tempoName(bpm: number): string {
  if (bpm < 60) return "Largo · 广板";
  if (bpm < 66) return "Larghetto · 小广板";
  if (bpm < 76) return "Adagio · 慢板";
  if (bpm < 108) return "Andante · 行板";
  if (bpm < 120) return "Moderato · 中板";
  if (bpm < 156) return "Allegro · 快板";
  if (bpm < 176) return "Vivace · 活板";
  if (bpm < 200) return "Presto · 急板";
  return "Prestissimo · 最急板";
}

/** 节拍器:Tone.js Transport 精确调度,强拍重音 + 拍点闪烁。 */
export function Metronome() {
  const [bpm, setBpm] = React.useState(80);
  const [beats, setBeats] = React.useState(4);
  const [running, setRunning] = React.useState(false);
  const [beat, setBeat] = React.useState(0);

  const bpmRef = React.useRef(bpm);
  const beatsRef = React.useRef(beats);
  bpmRef.current = bpm;
  beatsRef.current = beats;
  const toneRef = React.useRef<any>(null);
  const synthRef = React.useRef<any>(null);

  async function start() {
    const Tone: any = await import("tone");
    await Tone.start();
    toneRef.current = Tone;
    const transport = Tone.getTransport?.() ?? Tone.Transport;
    const Draw = Tone.getDraw?.() ?? Tone.Draw;
    transport.bpm.value = bpmRef.current;
    const synth = new Tone.Synth({
      // 三角波 + 快衰减:比方波干净不发糊,限幅后依然清脆
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
      volume: -4,
    }).toDestination();
    synthRef.current = synth;

    let i = 0;
    transport.scheduleRepeat((time: number) => {
      const b = beatsRef.current;
      const downbeat = i % b === 0;
      synth.triggerAttackRelease(downbeat ? "C6" : "G5", "32n", time, downbeat ? 1 : 0.65);
      Draw.schedule(() => setBeat(i % b), time);
      i++;
    }, "4n");
    transport.start();
    setRunning(true);
    setBeat(0);
  }

  function stop() {
    const Tone = toneRef.current;
    if (Tone) {
      const transport = Tone.getTransport?.() ?? Tone.Transport;
      transport.stop();
      transport.cancel();
    }
    synthRef.current?.dispose?.();
    synthRef.current = null;
    setRunning(false);
    setBeat(0);
  }

  // 运行中实时变速
  React.useEffect(() => {
    const Tone = toneRef.current;
    if (Tone && running) {
      (Tone.getTransport?.() ?? Tone.Transport).bpm.value = bpm;
    }
  }, [bpm, running]);

  // 卸载清理
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

  function toggle() {
    if (running) stop();
    else void start();
  }

  return (
    <figure className="not-prose my-8 rounded-xl border bg-card p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums">{bpm}</span>
            <span className="text-sm text-muted-foreground">BPM</span>
          </div>
          <div className="mt-1 text-sm text-signature">{tempoName(bpm)}</div>
        </div>
        <button
          type="button"
          onClick={toggle}
          className={
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition " +
            (running
              ? "bg-muted text-foreground hover:bg-muted/70"
              : "bg-signature text-signature-foreground hover:opacity-90")
          }
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "停止" : "开始"}
        </button>
      </div>

      <input
        type="range"
        min={40}
        max={208}
        step={1}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="mt-5 w-full accent-signature"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[60, 90, 120, 144].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setBpm(p)}
            className="rounded-md border bg-background px-2.5 py-1 text-xs hover:border-signature/50 hover:text-signature"
          >
            {p}
          </button>
        ))}
        <span className="mx-1 text-muted-foreground">|</span>
        <span className="text-xs text-muted-foreground">每小节</span>
        {[2, 3, 4].map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBeats(b)}
            className={
              "rounded-md border px-2.5 py-1 text-xs " +
              (beats === b ? "border-signature/50 text-signature" : "hover:border-signature/50")
            }
          >
            {b} 拍
          </button>
        ))}
      </div>

      {/* 拍点 */}
      <div className="mt-5 flex items-center gap-2">
        {Array.from({ length: beats }, (_, i) => (
          <span
            key={i}
            className={
              "size-3 rounded-full transition " +
              (running && beat === i
                ? i === 0
                  ? "scale-150 bg-signature"
                  : "scale-125 bg-signature/70"
                : "bg-muted-foreground/30")
            }
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {running ? `第 ${beat + 1} 拍` : "点开始"}
        </span>
      </div>
    </figure>
  );
}

export default Metronome;
