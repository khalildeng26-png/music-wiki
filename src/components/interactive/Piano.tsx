import { Maximize2, X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

import { track } from "@/lib/track";

import { playNote } from "./audio";

const CHROM = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

type Key = { note: string; black: boolean; whiteBefore: number };

function buildKeys(startOct: number, octaves: number): { keys: Key[]; whiteCount: number } {
  const keys: Key[] = [];
  let whiteCount = 0;
  for (let o = 0; o < octaves; o++) {
    for (const n of CHROM) {
      const black = n.length === 2;
      keys.push({ note: `${n}${startOct + o}`, black, whiteBefore: whiteCount });
      if (!black) whiteCount += 1;
    }
  }
  // 末尾补一个高音 C,让键盘收尾干净
  keys.push({ note: `C${startOct + octaves}`, black: false, whiteBefore: whiteCount });
  return { keys, whiteCount: whiteCount + 1 };
}

/** 琴键组:多指触控按下即响(pointerdown),可同时按多个键奏和弦;
 *  click 仅作键盘/读屏激活的兜底(与 pointerdown 按时间窗去重,防一键双响)。 */
function Keyboard({
  startOct,
  octaves,
  minWidth,
}: {
  startOct: number;
  octaves: number;
  minWidth?: number;
}) {
  // 和弦会同时亮起多个键,高亮必须是集合
  const [active, setActive] = React.useState<ReadonlySet<string>>(new Set());
  const { keys, whiteCount } = React.useMemo(
    () => buildKeys(startOct, octaves),
    [startOct, octaves],
  );
  // roving tabindex:当前可 Tab 到的琴键下标(按音高顺序,与视觉左右一致)
  const [focusIdx, setFocusIdx] = React.useState(0);
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const idxOf = React.useMemo(() => new Map(keys.map((k, i) => [k.note, i])), [keys]);
  // pointerdown 已发声的键,随后的兼容 click 在时间窗内忽略(键盘/读屏无 pointerdown,照常响)
  const pointerHits = React.useRef(new Map<string, number>());

  const whiteW = 100 / whiteCount;
  const blackW = whiteW * 0.62;
  // 白键保底 44px(触控标准),多八度时键盘自动横向滚动;全屏模式传 0 恰好铺满
  const minW = minWidth ?? whiteCount * 44;

  // 立即熄灭单个键(pointercancel 与定时器共用)
  function clearKey(note: string) {
    setActive((prev) => {
      if (!prev.has(note)) return prev;
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }

  async function hit(note: string) {
    track("piano-play", { note });
    setActive((prev) => {
      const next = new Set(prev);
      next.add(note);
      return next;
    });
    // 熄灭定时器必须先于音频 await 注册:playNote 首次要加载采样,弱网/失败时
    // 这个 await 会挂很久甚至不返回——排在后面高亮就永不熄灭(移动端滚动卡高亮的根因)
    window.setTimeout(() => clearKey(note), 250);
    try {
      // 虚拟钢琴键 → 永远用钢琴音色
      await playNote(note, 0.9, "piano");
    } catch {
      /* 忽略 */
    }
  }

  function onPointerDownKey(note: string) {
    pointerHits.current.set(note, performance.now());
    void hit(note);
  }

  function onClickKey(note: string) {
    const t = pointerHits.current.get(note);
    if (t !== undefined && performance.now() - t < 600) return;
    void hit(note);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp")
      next = Math.min(focusIdx + 1, keys.length - 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(focusIdx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = keys.length - 1;
    if (next === null) return;
    e.preventDefault();
    setFocusIdx(next);
    btnRefs.current[next]?.focus();
  }

  // 琴键共享的键盘可达属性;focus 时接管 Tab 停点,保持"焦点在哪停点在哪"
  const keyA11y = (note: string) => {
    const i = idxOf.get(note)!;
    return {
      tabIndex: i === focusIdx ? 0 : -1,
      onFocus: () => setFocusIdx(i),
      onKeyDown,
      ref: (el: HTMLButtonElement | null) => {
        btnRefs.current[i] = el;
      },
    };
  };

  const whites = keys.filter((k) => !k.black);
  const blacks = keys.filter((k) => k.black);

  return (
    <div className="h-full overflow-x-auto pb-2">
      <div
        className="relative mx-auto h-full"
        style={{ minWidth: minW }}
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- 琴键组是复合控件,group+aria-label 是正解;fieldset 的图例/边框语义不符
        role="group"
        aria-label="虚拟钢琴键盘"
      >
        {/* 白键 */}
        <div className="flex h-full">
          {whites.map((k) => {
            const on = active.has(k.note);
            const isC = k.note.startsWith("C");
            return (
              <button
                key={k.note}
                type="button"
                onPointerDown={() => onPointerDownKey(k.note)}
                onPointerCancel={() => clearKey(k.note)}
                onClick={() => onClickKey(k.note)}
                aria-label={k.note}
                {...keyA11y(k.note)}
                className={
                  // 键体固定白色,分隔线不能用主题 border(暗色下是浅色,贴白键会隐形)
                  "flex flex-1 flex-col items-center justify-end rounded-b-md border border-t-0 border-x-neutral-300 pb-2 text-[10px] transition " +
                  (on
                    ? "bg-signature text-signature-foreground"
                    : "bg-white text-slate-400 hover:bg-slate-100")
                }
              >
                {isC && <span className={on ? "" : "text-slate-500"}>{k.note}</span>}
              </button>
            );
          })}
        </div>
        {/* 黑键 */}
        {/* 黑键层:容器不吃指针(否则白键上 62% 区域点击被拦),黑键自身恢复可点 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[62%]">
          {blacks.map((k) => {
            const on = active.has(k.note);
            const left = k.whiteBefore * whiteW - blackW / 2;
            return (
              <button
                key={k.note}
                type="button"
                onPointerDown={() => onPointerDownKey(k.note)}
                onPointerCancel={() => clearKey(k.note)}
                onClick={() => onClickKey(k.note)}
                aria-label={k.note}
                {...keyA11y(k.note)}
                className={
                  "pointer-events-auto absolute top-0 rounded-b-md transition " +
                  (on ? "bg-signature" : "bg-neutral-900 hover:bg-neutral-700")
                }
                style={{ left: `${left}%`, width: `${blackW}%`, height: "100%" }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

type Props = {
  startOct?: number;
  octaves?: number;
  label?: string;
  /** 键长(px),默认 160(词条内紧凑);首屏等展示场景传 256 更像真琴 */
  keyHeight?: number;
  /** 键盘区最小宽度(px);不传则按每白键 ≥44px 触控标准自适应(超出容器自动横滑) */
  minWidth?: number;
};

/** 虚拟钢琴:点琴键用 Tone.js 发声,琥珀高亮当前键,支持多指同按的和弦。
 *  键盘可达:整个键盘只占一个 Tab 停点(roving tabindex),← → 移动、Enter/Space 发声。
 *  「全屏演奏」把键盘铺满屏幕并尝试锁定横屏;锁不了的环境(iOS)用 CSS 旋转兜底。 */
export function Piano({ startOct = 4, octaves = 2, label, keyHeight = 160, minWidth }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  // 展开时的视口尺寸:竖屏状态下要把键盘旋转 90°,需要实时 w/h;null = 未展开(SSR 安全)
  const [dims, setDims] = React.useState<{ w: number; h: number } | null>(null);

  const portrait = dims ? dims.h > dims.w : false;

  function openFullscreen() {
    track("piano-fullscreen", {});
    // 先量尺寸再展开,避免首帧未旋转的闪烁
    setDims({ w: window.innerWidth, h: window.innerHeight });
    setExpanded(true);
    // 全屏 + 锁横屏都需要用户手势,趁点击还没结束立刻申请;不支持的环境(iOS)静默走 CSS 旋转兜底
    try {
      const orientation = screen.orientation as
        | (ScreenOrientation & { lock?: (o: string) => Promise<void> })
        | undefined;
      const fs = document.documentElement.requestFullscreen?.();
      if (fs) fs.then(() => orientation?.lock?.("landscape")?.catch(() => {})).catch(() => {});
    } catch {
      /* 忽略 */
    }
  }

  function closeFullscreen() {
    setExpanded(false);
    setDims(null);
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      (screen.orientation as { unlock?: () => void })?.unlock?.();
    } catch {
      /* 忽略 */
    }
  }

  React.useEffect(() => {
    if (!expanded) return;
    const measure = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("keydown", onEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <figure className="not-prose overflow-hidden rounded-xl border bg-card">
      {label && (
        <figcaption className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {label}
        </figcaption>
      )}
      <div className="p-4">
        <div style={{ height: keyHeight }}>
          <Keyboard startOct={startOct} octaves={octaves} minWidth={minWidth} />
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={openFullscreen}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-signature/50 hover:text-signature active:scale-95"
            aria-label="全屏演奏,手机请横屏"
            title="全屏演奏(手机横屏更宽)"
          >
            <Maximize2 className="size-3.5" /> 全屏演奏
          </button>
        </div>
      </div>
      {expanded &&
        dims &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] bg-background"
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- 全屏覆盖层走 portal+fixed 自管显隐;原生 dialog 的 showModal/顶层图层行为反而碍事
            role="dialog"
            aria-modal="true"
            aria-label="全屏钢琴演奏"
          >
            {/* 竖屏时整个面板(含顶栏)旋转 90°:宽=视口高、高=视口宽,一转手机即回正 */}
            <div
              className="absolute flex flex-col"
              style={
                portrait
                  ? {
                      top: "50%",
                      left: "50%",
                      width: dims.h,
                      height: dims.w,
                      transform: "translate(-50%, -50%) rotate(90deg)",
                    }
                  : { inset: 0 }
              }
            >
              <div className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="text-xs text-muted-foreground">
                  {portrait ? "把手机横过来,琴键更宽更好弹" : "全屏演奏中"}
                </span>
                <button
                  type="button"
                  onClick={closeFullscreen}
                  aria-label="退出全屏演奏"
                  className="inline-flex size-8 items-center justify-center rounded-full border text-muted-foreground transition hover:border-signature/50 hover:text-signature active:scale-95"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 p-3">
                <Keyboard startOct={3} octaves={3} minWidth={0} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </figure>
  );
}

export default Piano;
