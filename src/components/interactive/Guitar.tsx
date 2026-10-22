import * as React from "react";

import { track } from "@/lib/track";
import { CHORDS, GROUPS, groupChord, chordNotes, type Chord } from "@/lib/chords";
import { GuitarNeck } from "@/components/interactive/GuitarNeck";
import { transposeNote } from "@/lib/transpose";

import { playNote } from "./audio";

/** 标准定弦,低音弦在前(六弦 E2 → 一弦 E4);与 audio.ts guitar 采样的六个基准音一致,
 *  其余品位由 Tone.Sampler 按最近采样移调发出。 */
const STRINGS = ["E2", "A2", "D3", "G3", "B3", "E4"] as const;

/** -1 = 闷弦(×),0 = 空弦(○),>0 = 按品;顺序与 STRINGS 同(低→高)。 */
/** 常用和弦库:四个学习阶段分组;横按组最高到 5 品(和弦图画 5 品)。 */
/** 电脑键盘:字母排 A S D F G H J K L 依次对应九个和弦(与钢琴组件同一条手位思路)。 */
const KB_ROW = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"];
function kbChar(code: string): string {
  return code.slice(3);
}

/** 指法分组:把按品拆成「横杆(同指同品的连续弦段≥2)」与「独立圆点」。
 *  chord.barre=true 的全横按(F):最低品整杆由指 1 覆盖,其余手指画独立点。
 *  pressed 返回全部按品弦(横杆覆盖的也算),供指板联动底光用。 */
/** 单个和弦图(竖排网格:六根竖线=弦,低音在左;固定三个品格,教科书式紧凑)。
 *  把位记号:开放把位(有空弦或一品起按)顶上画加粗弦枕;高把位和弦(如 Gm/Cm)
 *  顶上是一条普通品丝,并在第一格左侧标把位数字——标 3 即图中第一格=实际第三品。
 *  横按画圆角横杆,其余按品画圆点;杆/点上标指法编号。
 *  几何:top=图顶横线;wireY(f)=第 f 格品丝;dotY(f)=第 f 格按点中心(f-1 与 f 丝之间)。 */
function ChordDiagram({ chord }: { chord: Chord }) {
  const W = 84;
  const H = 94;
  const left = 14;
  const top = 26;
  const ROWS = 3; // 可视品格数
  const sw = (W - left - 10) / 5; // 弦距
  const fh = (H - top - 12) / ROWS; // 品距
  const x = (s: number) => left + s * sw;
  const wireY = (f: number) => top + f * fh; // 第 f 格品丝
  const dotY = (f: number) => top + (f - 0.5) * fh; // 第 f 格按点中心
  // 把位:有空弦或按品最低为 1 → 开放把位(顶线=弦枕);否则 pos=最低按品(高把位)
  const fretted = chord.frets.filter((f) => f > 0);
  const pos =
    fretted.length === 0 || Math.min(...fretted) === 1 || chord.frets.includes(0)
      ? 1
      : Math.min(...fretted);
  const vf = (f: number) => f - pos + 1; // 实际品 → 图中格
  const { bars, dots } = groupChord(chord);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {/* 品丝:第 1–3 格 */}
      {[1, 2, 3].map((f) => (
        <line
          key={f}
          x1={left}
          y1={wireY(f)}
          x2={x(5)}
          y2={wireY(f)}
          stroke="currentColor"
          strokeWidth={1}
          className="text-neutral-400 dark:text-neutral-600"
        />
      ))}
      {/* 图顶横线:开放把位=加粗弦枕;高把位=普通品丝 + 左侧把位数字 */}
      <line
        x1={left}
        y1={top}
        x2={x(5)}
        y2={top}
        stroke="currentColor"
        strokeWidth={pos === 1 ? 3.5 : 1.5}
        className={
          pos === 1
            ? "text-neutral-600 dark:text-neutral-300"
            : "text-neutral-400 dark:text-neutral-600"
        }
      />
      {pos > 1 && (
        <text
          x={left - 9}
          y={dotY(1) + 3}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          className="fill-neutral-500 dark:fill-neutral-400"
        >
          {pos}
        </text>
      )}
      {/* 弦:从图顶贯穿到第 3 格品丝 */}
      {STRINGS.map((_, s) => (
        <line
          key={s}
          x1={x(s)}
          y1={top}
          x2={x(s)}
          y2={wireY(ROWS)}
          stroke="currentColor"
          strokeWidth={1}
          className="text-neutral-400 dark:text-neutral-600"
        />
      ))}
      {/* 闷弦 × / 空弦 ○ */}
      {chord.frets.map((f, s) =>
        f === -1 ? (
          <text
            key={s}
            x={x(s)}
            y={top - 10}
            textAnchor="middle"
            fontSize="11"
            className="fill-neutral-400"
          >
            ✕
          </text>
        ) : f === 0 ? (
          <circle
            key={s}
            cx={x(s)}
            cy={top - 13}
            r={4}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            className="text-neutral-400"
          />
        ) : null,
      )}
      {/* 横杆:同指同品的连续弦段,圆角横杆上标一个指法号 */}
      {bars.map((r, i) => (
        <g key={`bar${i}`}>
          <rect
            x={x(r.s0) - 6.5}
            y={dotY(vf(r.fret)) - 6.5}
            width={x(r.s1) - x(r.s0) + 13}
            height={13}
            rx={6.5}
            className="fill-signature"
          />
          <text
            x={(x(r.s0) + x(r.s1)) / 2}
            y={dotY(vf(r.fret)) + 3}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="700"
            className="fill-signature-foreground"
          >
            {r.finger}
          </text>
        </g>
      ))}
      {/* 独立按品圆点(带指法编号) */}
      {dots.map((d) => (
        <g key={`d${d.s}`}>
          <circle cx={x(d.s)} cy={dotY(vf(d.fret))} r={6.5} className="fill-signature" />
          <text
            x={x(d.s)}
            y={dotY(vf(d.fret)) + 3}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="700"
            className="fill-signature-foreground"
          >
            {d.finger || ""}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** 指板(横排:低音弦在下);点格子发声,选中和弦的按点联动点亮。
 *  v4 实体渲染 + v5 流式长度:弦距固定,品距随容器宽度拉伸填满;
 *  品距按真实吉他递收(每品 ×2^(-1/12),高品渐窄),扩到 15 品;
 *  桌面端是一条完整琴颈,手机端自动收窄到不横滑。 */
type Props = { label?: string; headerExtra?: React.ReactNode };

/** 吉他和弦机:点和弦卡片=扫弦(下扫,或下+上交替),九个入门开放和弦 + F 小横按;
 *  指板与和弦图联动——扫过的和弦在指板上点亮按点,指板格子本身可点发声。
 *  键盘可奏(字母排对应九个和弦);「1-6-4-5」按钮连播演示进行。 */
export function Guitar({ label, headerExtra }: Props) {
  const [alt, setAlt] = React.useState(false); // 交替扫:点击=下+上
  const [showKbd, setShowKbd] = React.useState(false);
  const [activeChord, setActiveChord] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState<ReadonlySet<number>>(new Set());
  const demoRef = React.useRef<number | null>(null);
  const timersRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    try {
      setShowKbd(localStorage.getItem("guitar-kbd-guide") === "1");
    } catch {
      /* 忽略 */
    }
  }, []);

  React.useEffect(() => () => cancelDemo(), []);

  /** 点单音/扫弦时短暂点亮某根弦(视觉反馈共用一套) */
  function flashString(s: number) {
    setFlash((prev) => new Set(prev).add(s));
    window.setTimeout(
      () =>
        setFlash((prev) => {
          const nx = new Set(prev);
          nx.delete(s);
          return nx;
        }),
      200,
    );
  }

  function toggleKbd() {
    setShowKbd((v) => {
      const next = !v;
      try {
        localStorage.setItem("guitar-kbd-guide", next ? "1" : "0");
      } catch {
        /* 记不住也不影响本次会话 */
      }
      track("guitar-kbd-guide", { on: next });
      return next;
    });
  }

  /** 扫一次弦:dir=down 低→高全弦,up 高四根弦倒序;逐弦错开触发,并短暂点亮对应弦。 */
  function strum(chord: Chord, dir: "down" | "up", src: "ptr" | "kbd" = "ptr") {
    const notes: { note: string; s: number }[] = [];
    chord.frets.forEach((f, s) => {
      if (f >= 0) notes.push({ note: transposeNote(STRINGS[s], f), s });
    });
    const seq = dir === "down" ? notes : notes.slice(-4).reverse();
    const gap = dir === "down" ? 28 : 22;
    seq.forEach((n, i) => {
      window.setTimeout(() => {
        void playNote(n.note, 0.9, "guitar").catch(() => {});
        setFlash((prev) => new Set(prev).add(n.s));
        window.setTimeout(
          () =>
            setFlash((prev) => {
              const nx = new Set(prev);
              nx.delete(n.s);
              return nx;
            }),
          200,
        );
      }, i * gap);
    });
    setActiveChord(chord.name);
    track("guitar-play", { what: "chord", id: chord.name, dir, src });
  }

  /** 点击和弦卡:普通模式=下扫;交替模式=下扫 + 约 320ms 后上扫。 */
  function strumCard(chord: Chord, src: "ptr" | "kbd" = "ptr") {
    strum(chord, "down", src);
    if (alt) window.setTimeout(() => strum(chord, "up", src), 320);
  }

  /** 1-6-4-5(C–Am–F–G)连播:每和弦「下上」×2,约 84 BPM 的八分扫弦;再点一次取消。 */
  function toggleDemo() {
    if (demoRef.current !== null) {
      cancelDemo();
      return;
    }
    track("guitar-demo");
    const byName = (n: string) => CHORDS.find((c) => c.name === n)!;
    const prog = [byName("C"), byName("Am"), byName("F"), byName("G")];
    const step = 355;
    const timers: number[] = [];
    let t = 0;
    for (let r = 0; r < 2; r++) {
      for (const c of prog) {
        for (const dir of ["down", "up", "down", "up"] as const) {
          timers.push(window.setTimeout(() => strum(c, dir, "ptr"), t));
          t += step;
        }
      }
    }
    // 播完自清,按钮回到「▶」态
    timers.push(window.setTimeout(() => (demoRef.current = null), t + 400));
    demoRef.current = timers[0];
    timersRef.current = timers;
  }
  function cancelDemo() {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
    demoRef.current = null;
  }

  // 电脑键盘演奏:字母排触发当前分类的和弦扫弦
  const [group, setGroup] = React.useState<(typeof GROUPS)[number]>("基本");
  const shown = React.useMemo(() => CHORDS.filter((c) => c.group === group), [group]);
  // 键盘回调要拿到最新分类列表,用 ref 避免每次切分类重挂监听
  const shownRef = React.useRef(shown);
  shownRef.current = shown;
  React.useEffect(() => {
    const typing = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing(e.target)) return;
      const i = KB_ROW.indexOf(e.code);
      const list = shownRef.current;
      if (i < 0 || i >= list.length) return;
      e.preventDefault();
      strumCard(list[i], "kbd");
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alt]);

  // 同位异指按法选择(每和弦一个索引,0=默认;切的是手指分配,位置与音不变)
  const [variantIdx, setVariantIdx] = React.useState<Record<string, number>>({});
  function cycleVariant(c: Chord) {
    const n = c.variants?.length ?? 0;
    if (n < 2) return;
    const idx = ((variantIdx[c.name] ?? 0) + 1) % n;
    setVariantIdx((prev) => ({ ...prev, [c.name]: idx }));
    track("guitar-variant", { chord: c.name, idx, label: c.variants?.[idx]?.label });
  }
  /** 当前生效的指法:把选中的异指变体合并进和弦对象(图/指板/分组器共用) */
  function effChord(c: Chord): Chord {
    const v = c.variants?.[variantIdx[c.name] ?? 0];
    return v ? { ...c, fingers: v.fingers } : c;
  }

  const activeBase = CHORDS.find((c) => c.name === activeChord) ?? null;
  const active = activeBase ? effChord(activeBase) : null;

  return (
    <figure className="not-prose overflow-hidden rounded-xl border bg-card">
      {/* 按点弹入动画(切和弦整组重播);transform-box 让 SVG 元素以自身为原点缩放 */}
      <style>{`@keyframes gpop{from{transform:scale(.35);opacity:0}to{transform:scale(1);opacity:1}}.gpop{animation:gpop .18s ease-out;transform-origin:center;transform-box:fill-box}`}</style>
      {label && (
        <figcaption className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          <span>{label}</span>
          {headerExtra}
        </figcaption>
      )}
      <div className="p-4">
        {/* 分类筛选:按学习阶段换一组和弦 */}
        <div className="mb-2 flex flex-wrap gap-1.5" role="tablist" aria-label="和弦分组">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={group === g}
              onClick={() => {
                if (g === group) return;
                setGroup(g);
                track("guitar-chordset", { set: g });
              }}
              className={
                "rounded-full border px-2.5 py-0.5 text-xs transition active:scale-95 " +
                (group === g
                  ? "border-signature/60 bg-signature/10 font-medium text-signature"
                  : "text-muted-foreground hover:border-signature/50 hover:text-signature")
              }
            >
              {g}
            </button>
          ))}
        </div>
        {/* 和弦卡一排(窄屏横滑,只显示当前分类) */}
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          role="group"
          aria-label="常用和弦,点击扫弦"
        >
          {shown.map((c, i) => {
            const on = c.name === activeChord;
            const kbd = showKbd && i < KB_ROW.length ? kbChar(KB_ROW[i]) : undefined;
            const hasAlts = (c.variants?.length ?? 0) > 1;
            const vIdx = variantIdx[c.name] ?? 0;
            const vLabel = c.variants?.[vIdx]?.label;
            const vNote = c.variants?.[vIdx]?.note;
            return (
              <div key={c.name} className="relative shrink-0">
                {hasAlts && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleVariant(c);
                    }}
                    title={`当前按法:${vLabel ?? ""}。${vNote ?? ""}`}
                    aria-label={`切换 ${c.name} 的按法,当前 ${vLabel ?? ""}`}
                    className="absolute right-0.5 bottom-0.5 z-10 inline-flex size-4 items-center justify-center rounded-full border border-neutral-300 bg-white/95 text-[9px] leading-none text-muted-foreground transition hover:border-signature/50 hover:text-signature active:scale-90 dark:border-neutral-600 dark:bg-neutral-800/95"
                  >
                    ⇄
                  </button>
                )}
                <button
                  type="button"
                  onPointerDown={() => strumCard(c)}
                  aria-label={`${c.name} 和弦,点击扫弦`}
                  className={
                    "flex flex-col items-center rounded-lg border px-1.5 pt-1 pb-1.5 transition active:scale-95 " +
                    (on
                      ? "border-signature/70 bg-signature/10"
                      : "border-transparent bg-muted/40 hover:border-signature/40")
                  }
                >
                  <ChordDiagram chord={effChord(c)} />
                  <span
                    className={
                      "mt-0.5 text-xs font-semibold " + (on ? "text-signature" : "text-foreground")
                    }
                  >
                    {c.name}
                    {kbd && (
                      <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded border border-neutral-300 bg-white px-1 font-mono text-[9px] leading-none text-slate-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {kbd}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* 工具栏 */}
        <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setAlt((v) => !v);
              track("guitar-alt-strum", { on: !alt });
            }}
            aria-pressed={alt}
            className={
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition active:scale-95 " +
              (alt
                ? "border-signature/60 text-signature"
                : "text-muted-foreground hover:border-signature/50 hover:text-signature")
            }
          >
            ↓↑ 交替扫
          </button>
          <button
            type="button"
            onClick={toggleKbd}
            aria-pressed={showKbd}
            title="在和弦卡上显示键盘字母"
            className={
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition active:scale-95 " +
              (showKbd
                ? "border-signature/60 text-signature"
                : "text-muted-foreground hover:border-signature/50 hover:text-signature")
            }
          >
            键位
          </button>
          <button
            type="button"
            onClick={toggleDemo}
            className="inline-flex items-center gap-1 rounded-full border border-signature/60 px-2.5 py-1 font-medium text-signature transition hover:bg-signature/10 active:scale-95"
          >
            ▶ 1-6-4-5 演示
          </button>
        </div>

        {/* 指板(与和弦联动) */}
        <div className="mt-3 border-t pt-3">
          <GuitarNeck activeChord={active} flash={flash} flashString={flashString} />
        </div>
      </div>
    </figure>
  );
}

export default Guitar;
