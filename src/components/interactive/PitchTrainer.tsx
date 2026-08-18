import { Mic, MicOff, Play } from "lucide-react";
import * as React from "react";

import { playNote } from "./audio";
import { midiToNote } from "./noteUtils";

/**
 * 自相关音高检测(Chris Wilson 的 ACF2+ 改良):
 * 只在有声段上做相关运算,并在人声基频范围(约 70Hz 以上)内找峰值,抛物线插值细化。
 * 返回基频 Hz,检测不到(太安静/无周期性)返回 -1。
 */
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.015) return -1;

  // 掐头去尾,避开首尾的瞬态
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < 0.2) {
      r1 = i;
      break;
    }
  for (let i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < 0.2) {
      r2 = SIZE - i;
      break;
    }
  const trimmed = buf.subarray(r1, r2);
  const size = trimmed.length;
  // 人声基频 ≥70Hz → 相关长度最多 sampleRate/70,大幅减少运算量
  const maxLag = Math.min(size - 2, Math.floor(sampleRate / 70));

  const c = new Float32Array(maxLag + 2);
  for (let i = 0; i <= maxLag + 1; i++) {
    let sum = 0;
    for (let j = 0; j < size - i; j++) sum += trimmed[j] * trimmed[j + i];
    c[i] = sum;
  }
  // 跳过零点附近,找全局峰值
  let d = 0;
  while (d < maxLag && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i <= maxLag; i++)
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  if (maxpos <= 0) return -1;
  // 抛物线插值细化峰位
  const x1 = c[maxpos - 1];
  const x2 = c[maxpos];
  const x3 = c[maxpos + 1] ?? x2;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const t = a ? maxpos - b / (2 * a) : maxpos;
  const freq = sampleRate / t;
  return freq > 70 && freq < 1500 ? freq : -1;
}

/** 频率 → {最近的科学音名, 偏离音分} */
function freqToNote(freq: number): { note: string; cents: number } {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const nearest = Math.round(midi);
  return { note: midiToNote(nearest), cents: Math.round((midi - nearest) * 100) };
}

type MicState = "idle" | "starting" | "on" | { error: string };

/** 唱歌音高即时反馈:开麦克风唱一个音,实时看音名与音分偏离(不记录成绩)。 */
export function PitchTrainer() {
  const [mic, setMic] = React.useState<MicState>("idle");
  const [freq, setFreq] = React.useState(-1);
  const ctxRef = React.useRef<AudioContext | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef(0);
  // 最近 3 次有效检测取中位数,压掉抖动
  const historyRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close();
    };
  }, []);

  async function startMic() {
    setMic("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      ctxRef.current = ctx;
      historyRef.current = [];
      setMic("on");

      const buf = new Float32Array(analyser.fftSize);
      let last = 0;
      const loop = (time: number) => {
        rafRef.current = requestAnimationFrame(loop);
        if (time - last < 33) return; // ~30fps 足够,省一半 CPU
        last = time;
        analyser.getFloatTimeDomainData(buf);
        const f = autoCorrelate(buf, ctx.sampleRate);
        if (f > 0) {
          const h = historyRef.current;
          h.push(f);
          if (h.length > 3) h.shift();
          setFreq([...h].sort((a, b) => a - b)[Math.floor(h.length / 2)]);
        } else {
          historyRef.current = [];
          setFreq(-1);
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setMic({ error: "无法访问麦克风——请在浏览器地址栏允许麦克风权限后重试。" });
    }
  }

  function stopMic() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    void ctxRef.current?.close();
    streamRef.current = null;
    ctxRef.current = null;
    setFreq(-1);
    setMic("idle");
  }

  const live = mic === "on";
  const detected = freq > 0 ? freqToNote(freq) : null;
  const cents = detected?.cents ?? 0;
  const inTune = Math.abs(cents) <= 10;
  // 音分指针位置:-50..+50 映射到 0%..100%,超界截断
  const pos = Math.max(0, Math.min(100, 50 + cents));

  const hint = !detected
    ? live
      ? "唱一个稳定的音(啊——),对着麦克风保持两三秒"
      : null
    : inTune
      ? "准了,保持住 ✓"
      : cents < 0
        ? "低了,稍微往上一点 ↑"
        : "高了,收一点 ↓";

  return (
    <figure className="not-prose rounded-xl border bg-card p-4">
      <figcaption className="mb-3 text-sm text-muted-foreground">
        音高反馈:开麦克风唱一个音,实时看它落在哪个音、偏了多少音分。
      </figcaption>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => (live ? stopMic() : void startMic())}
          disabled={mic === "starting"}
          aria-label={live ? "关闭麦克风" : "开启麦克风"}
          className={
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition hover:opacity-90 disabled:opacity-50 " +
            (live ? "bg-primary text-primary-foreground" : "bg-signature text-signature-foreground")
          }
        >
          {live ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">
              {detected ? detected.note : live ? "…" : "—"}
            </span>
            {detected && (
              <span className="font-mono text-sm text-muted-foreground tabular-nums">
                {Math.round(freq)} Hz
              </span>
            )}
          </div>
          {detected && (
            <div className="mt-2">
              {/* 音分表:-50¢ —— 0 —— +50¢ */}
              <div className="relative h-2 rounded-full bg-muted">
                <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <span
                  className={
                    "absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-100 " +
                    (inTune ? "bg-green-600" : "bg-signature")
                  }
                  style={{ left: `${pos}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground tabular-nums">
                <span>-50¢</span>
                <span>{cents > 0 ? `+${cents}¢` : `${cents}¢`}</span>
                <span>+50¢</span>
              </div>
            </div>
          )}
        </div>

        {detected && (
          <button
            type="button"
            onClick={() => void playNote(detected.note)}
            aria-label="播放这个音的标准音高"
            title="听听这个音的标准音高"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-signature text-signature-foreground transition hover:opacity-90"
          >
            <Play className="size-4" />
          </button>
        )}
      </div>

      {hint && (
        <div
          className={
            "mt-4 rounded-lg bg-muted/50 px-4 py-2 text-sm " +
            (detected ? (inTune ? "text-green-600" : "text-foreground") : "text-muted-foreground")
          }
        >
          {hint}
        </div>
      )}
      {typeof mic === "object" && "error" in mic && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {mic.error}
        </div>
      )}
    </figure>
  );
}

export default PitchTrainer;
