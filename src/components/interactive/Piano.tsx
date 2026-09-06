import { Keyboard as KeyboardIcon, Maximize2, X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

import { track } from "@/lib/track";
import { transposeNote } from "@/lib/transpose";

import { playNote } from "./audio";
import { noteToMidi } from "./noteUtils";

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

// 电脑键盘演奏布局(virtual-piano 惯例),按绝对音高映射(基准 C4,不随组件起始八度漂移):
// 字母排 A S D F…=白键,W E T Y U…=上排错位黑键,覆盖 C4–F5;
// 数字排 1–7 按半音阶补完 F#5–C6(数字排本无黑白错位,当半音阶弹最顺)。
// semi 为相对 C4 的半音数:D#=3、F#=6、G#=8、A#=10、F#5=18、C6=24。
const KB_BINDINGS: [string, number][] = [
  ["KeyA", 0], ["KeyS", 2], ["KeyD", 4], ["KeyF", 5], ["KeyG", 7], ["KeyH", 9],
  ["KeyJ", 11], ["KeyK", 12], ["KeyL", 14], ["Semicolon", 16], ["Quote", 17],
  ["KeyW", 1], ["KeyE", 3], ["KeyT", 6], ["KeyY", 8], ["KeyU", 10],
  ["KeyO", 13], ["KeyP", 15],
  ["Digit1", 18], ["Digit2", 19], ["Digit3", 20], ["Digit4", 21],
  ["Digit5", 22], ["Digit6", 23], ["Digit7", 24],
];

/** 绑定键的展示字母(印在琴键上的徽章) */
function kbChar(code: string): string {
  if (code === "Semicolon") return ";";
  if (code === "Quote") return "'";
  if (code.startsWith("Digit")) return code.slice(5);
  return code.slice(3);
}

/** 琴键组:多指触控按下即响(pointerdown),可同时按多个键奏和弦;
 *  click 仅作键盘/读屏激活的兜底(与 pointerdown 按时间窗去重,防一键双响)。
 *  电脑键盘可演奏(键盘属性):字母按键映射琴键,按住发声、松开熄灭,
 *  多键同按即和弦;焦点在输入框/文本域时不抢键。
 *  showKbd:键位引导——在琴键上印出对应的电脑键盘字母(白键底部徽章/黑键下部)。 */
function Keyboard({
  startOct,
  octaves,
  minWidth,
  keyboardEnabled = true,
  showKbd = false,
}: {
  startOct: number;
  octaves: number;
  minWidth?: number;
  /** 键盘映射开关;全屏时内联键盘关掉,防止两个实例双响 */
  keyboardEnabled?: boolean;
  /** 在琴键上显示键盘字母引导(与键盘映射同开同关:不响应键盘的实例也不标) */
  showKbd?: boolean;
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

  // 暗色模式监听:主题类挂在 <html> 上,可中途切换,MutationObserver 保持同步
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // 夜光琴键(仅暗色):按音高定色,C=0°红起每半音 30°,八度循环——同键同色,
  // 弹音阶会在琴键上扫出一道彩虹,颜色可视化音高方向;亮色模式保持品牌琥珀。
  // 黄绿~青区段(45°–210°)背景偏亮,文字用深色保对比度
  function pitchColor(note: string): { bg: string; fg: string } | null {
    if (!dark) return null;
    const hue = (((noteToMidi(note) % 12) + 12) % 12) * 30;
    return {
      bg: `hsl(${hue} 85% 55%)`,
      fg: hue >= 45 && hue < 210 ? "#1c1917" : "#ffffff",
    };
  }

  const whiteW = 100 / whiteCount;
  const blackW = whiteW * 0.62;
  // 白键保底 44px(触控标准),多八度时键盘自动横向滚动;全屏模式传 0 恰好铺满
  const minW = minWidth ?? whiteCount * 44;

  // 立即熄灭单个键(pointercancel、键盘 keyup 与定时器共用)
  function clearKey(note: string) {
    setActive((prev) => {
      if (!prev.has(note)) return prev;
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }

  async function hit(note: string) {
    track("piano-play", { note, src: "ptr" });
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

  // code → 音名 的映射(键盘演奏与键位引导共用一份);绝对基准 C4,
  // 组件音域外的绑定静默丢弃(如低音区起点的琴挂不上高音数字排)
  const codeNote = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const [code, semi] of KB_BINDINGS) {
      const n = `${CHROM[semi % 12]}${4 + Math.floor(semi / 12)}`;
      if (idxOf.has(n)) m.set(code, n);
    }
    return m;
  }, [idxOf]);
  // 音名 → 展示字母(印在琴键徽章上)。Shift+键 = 降一个八度:低八度琴键
  // 显示 ⇧ 前缀(如 C3 显示 ⇧A),仅在琴域内且无直接绑定的键才补 shift 标注
  const kbdLabel = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const [code, note] of codeNote) m.set(note, kbChar(code));
    for (const [code, note] of codeNote) {
      const low = transposeNote(note, -12);
      if (idxOf.has(low) && !m.has(low)) m.set(low, "⇧" + kbChar(code));
    }
    return m;
  }, [codeNote, idxOf]);

  // 电脑键盘演奏:按下发声+点亮(不设 250ms 熄灭,按住持续亮),松开熄灭;
  // Shift+键降一个八度(域外忽略);失焦兜底全灭(切窗口时按住的键不会卡亮)。
  // heldNotes 记住每个物理键实际触发的音——先松 Shift 再松键也能正确熄灭
  React.useEffect(() => {
    if (!keyboardEnabled) return;
    const held = new Map<string, string>();
    const typing = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing(e.target)) return;
      let note = codeNote.get(e.code);
      if (!note) return;
      if (e.shiftKey) {
        note = transposeNote(note, -12);
        if (!idxOf.has(note)) return;
      }
      e.preventDefault();
      held.set(e.code, note);
      setActive((p) => new Set(p).add(note));
      track("piano-play", { note, src: "kbd", shift: e.shiftKey });
      void playNote(note, 0.9, "piano").catch(() => {});
    };
    const up = (e: KeyboardEvent) => {
      const note = held.get(e.code);
      if (note) {
        held.delete(e.code);
        clearKey(note);
      }
    };
    const onBlur = () => {
      held.clear();
      setActive(new Set());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", onBlur);
    };
  }, [codeNote, idxOf, keyboardEnabled]);

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
            const pc = on ? pitchColor(k.note) : null;
            const kbd = showKbd && keyboardEnabled ? kbdLabel.get(k.note) : undefined;
            return (
              <button
                key={k.note}
                type="button"
                onPointerDown={() => onPointerDownKey(k.note)}
                onPointerCancel={() => clearKey(k.note)}
                onClick={() => onClickKey(k.note)}
                aria-label={k.note}
                {...keyA11y(k.note)}
                style={pc ? { backgroundColor: pc.bg, color: pc.fg } : undefined}
                className={
                  // 键体固定白色,分隔线不能用主题 border(暗色下是浅色,贴白键会隐形)
                  "flex flex-1 flex-col items-center justify-end rounded-b-md border border-t-0 border-x-neutral-300 pb-2 text-[10px] transition " +
                  (on
                    ? "bg-signature text-signature-foreground"
                    : "bg-white text-slate-400 hover:bg-slate-100")
                }
              >
                {kbd && (
                  <span className="mb-1 inline-flex h-4 min-w-4 items-center justify-center rounded border border-neutral-300 bg-white px-1 font-mono text-[9px] leading-none text-slate-500">
                    {kbd}
                  </span>
                )}
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
            const pc = on ? pitchColor(k.note) : null;
            const kbd = showKbd && keyboardEnabled ? kbdLabel.get(k.note) : undefined;
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
                style={
                  pc
                    ? { left: `${left}%`, width: `${blackW}%`, height: "100%", backgroundColor: pc.bg }
                    : { left: `${left}%`, width: `${blackW}%`, height: "100%" }
                }
              >
                {kbd && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0.5 text-center font-mono text-[9px] leading-none text-white/70">
                    {kbd}
                  </span>
                )}
              </button>
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
  // 键位引导:在琴键上印电脑键盘字母;SSR 后从 localStorage 恢复记忆(放 effect 里,防注水错配)
  const [showKbd, setShowKbd] = React.useState(false);
  React.useEffect(() => {
    try {
      setShowKbd(localStorage.getItem("piano-kbd-guide") === "1");
    } catch {
      /* 忽略 */
    }
  }, []);

  function toggleKbd() {
    setShowKbd((v) => {
      const next = !v;
      try {
        localStorage.setItem("piano-kbd-guide", next ? "1" : "0");
      } catch {
        /* 记不住也不影响本次会话 */
      }
      track("piano-kbd-guide", { on: next });
      return next;
    });
  }

  const portrait = dims ? dims.h > dims.w : false;

  function openFullscreen() {
    track("piano-fullscreen");
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
          <Keyboard
            startOct={startOct}
            octaves={octaves}
            minWidth={minWidth}
            keyboardEnabled={!expanded}
            showKbd={showKbd}
          />
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleKbd}
              aria-pressed={showKbd}
              title="在琴键上显示键盘字母"
              className={
                "hidden shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition active:scale-95 md:inline-flex " +
                (showKbd
                  ? "border-signature/60 text-signature"
                  : "text-muted-foreground hover:border-signature/50 hover:text-signature")
              }
            >
              <KeyboardIcon className="size-3.5" /> 键位
            </button>
            <button
              type="button"
              onClick={openFullscreen}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-signature/50 hover:text-signature active:scale-95"
              aria-label="全屏演奏,手机请横屏"
              title="全屏演奏(手机横屏更宽)"
            >
              <Maximize2 className="size-3.5" /> 全屏演奏
            </button>
          </span>
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
                <span className="flex items-center gap-2">
                  {/* 全屏里琴底栏不可见,键位开关在这里也要有一个 */}
                  <button
                    type="button"
                    onClick={toggleKbd}
                    aria-pressed={showKbd}
                    title="在琴键上显示键盘字母"
                    className={
                      "hidden shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition active:scale-95 md:inline-flex " +
                      (showKbd
                        ? "border-signature/60 text-signature"
                        : "text-muted-foreground hover:border-signature/50 hover:text-signature")
                    }
                  >
                    <KeyboardIcon className="size-3.5" /> 键位
                  </button>
                  <button
                    type="button"
                    onClick={closeFullscreen}
                    aria-label="退出全屏演奏"
                    className="inline-flex size-8 items-center justify-center rounded-full border text-muted-foreground transition hover:border-signature/50 hover:text-signature active:scale-95"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              </div>
              <div className="flex-1 p-3">
                <Keyboard startOct={3} octaves={3} minWidth={0} showKbd={showKbd} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </figure>
  );
}

export default Piano;
