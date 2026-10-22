import React from "react";
import { playNote } from "@/components/interactive/audio";
import { track } from "@/lib/track";
import { groupChord, STRINGS, type Chord } from "@/lib/chords";
import { transposeNote } from "@/lib/transpose";

/** 琴颈指板(横置 SVG):六弦 × N 品,点击格子弹单音。
 *  从和弦机(Guitar)抽出共用,和弦反查(ChordFinder)也用它——新增:
 *  - onCellClick:格子点击回调(反查用;不传则只弹音)
 *  - selected:被选中的格子键("s:f"),画琥珀高亮圈
 *  注意:词条里直接用的格子版指板是 Fretboard.tsx(支持 tuning),别混 */
export function GuitarNeck({
  activeChord,
  flash,
  flashString,
  onCellClick,
  selected,
}: {
  activeChord: Chord | null;
  /** 正在扫弦时被点亮的弦序(短促高亮) */
  flash: ReadonlySet<number>;
  /** 点单音时让对应弦也闪一下(反馈) */
  flashString: (s: number) => void;
  /** 格子点击回调(和弦反查用);不传则只弹音 */
  onCellClick?: (s: number, f: number) => void;
  /** 被选中的格子键集合("s:f"),画琥珀高亮圈 */
  selected?: ReadonlySet<string>;
}) {
  const SH = 30; // 弦距(固定)
  const NUT = 54; // 弦枕 x 位
  const TAIL = 24; // 右端琴桥+余量
  const RATIO = Math.pow(2, -1 / 12); // 品距递收率 ≈0.944
  const MIN_W = 330; // 手机保底(更窄则容器横滑)
  const DEF_W = 720; // SSR/无 JS 时的假设宽度
  const H = 6 * SH + 34;
  const sy = (s: number) => 14 + (5 - s) * SH; // 低音弦在下方
  const midY = (sy(2) + sy(3)) / 2;
  const NUMS = [0, 3, 5, 7, 9, 12, 15];
  // 弦径:缠弦(低三根)明显更粗,像真琴的张力梯度
  const GAUGE = [5, 4.4, 3.8, 3.2, 2.7, 2.4];

  // 容器实测宽度 → 品距几何;ResizeObserver 跟随(首页/词条/全屏宽度不同)
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [cw, setCw] = React.useState(DEF_W);
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((es) => {
      for (const e of es) setCw(Math.max(MIN_W, Math.round(e.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // 手机端(<480px 容器)默认 9 品:格子热区宽裕一倍;更宽恢复 15 品
  const FRETS = cw < 480 ? 9 : 15;

  // 品丝位置:pos[0]=弦枕,pos[f]=累加递收品距;首品品距由可用宽度反解
  const geom = React.useMemo(() => {
    const avail = Math.max(cw, MIN_W) - NUT - TAIL;
    let sum = 0;
    for (let i = 0; i < FRETS; i++) sum += Math.pow(RATIO, i);
    const fs0 = avail / sum;
    const pos: number[] = [NUT];
    for (let f = 1; f <= FRETS; f++) pos.push(pos[f - 1] + fs0 * Math.pow(RATIO, f - 1));
    return { pos, W: pos[FRETS] + TAIL };
  }, [cw]);
  const fx = (f: number) => geom.pos[f];
  const cx = (f: number) => (f === 0 ? NUT - 19 : (geom.pos[f - 1] + geom.pos[f]) / 2);
  const neck = {
    x: NUT - 8,
    y: sy(5) - 17,
    w: fx(FRETS) - NUT + 16,
    h: sy(0) - sy(5) + 34,
  };

  // 指法分组(横杆+独立点);pressed=全部按品弦,供格底光用
  const grp = activeChord ? groupChord(activeChord) : { bars: [], dots: [], pressed: [] };
  const muted = new Set<number>();
  if (activeChord) activeChord.frets.forEach((f, s) => f === -1 && muted.add(s));

  async function pluck(s: number, f: number) {
    track("guitar-play", { what: "note", id: `${s}-${f}`, src: "ptr" });
    flashString(s);
    try {
      await playNote(transposeNote(STRINGS[s], f), 0.8, "guitar");
    } catch {
      /* 忽略 */
    }
  }

  /** 单主题层的琴颈全部绘制(dark=false 亮色系 / true 暗色系)。
   *  用两层各画一遍(而不是换 fill 类)是因为 url(#id) 渐变引用无法随 Tailwind 类切换。 */
  function neckLayer(dark: boolean) {
    const k = dark ? "D" : ""; // 渐变 id 后缀
    return (
      <g filter={`url(#gshadow${k})`}>
        {/* 琴头:深色木头块(画在琴颈下面,交叠处被琴颈压住) */}
        <rect
          x={2}
          y={sy(5) - 24}
          width={NUT + 4}
          height={sy(0) - sy(5) + 48}
          rx={16}
          fill={dark ? "#1C1610" : "#332616"}
          stroke={dark ? "rgba(255,225,180,0.10)" : "rgba(0,0,0,0.25)"}
          strokeWidth={1}
        />
        {/* 琴颈木面 */}
        <rect
          x={neck.x}
          y={neck.y}
          width={neck.w}
          height={neck.h}
          rx={12}
          fill={`url(#wood${k})`}
          stroke={dark ? "rgba(255,235,200,0.10)" : "rgba(110,70,25,0.22)"}
          strokeWidth={1}
        />
        {/* 木纹(分形噪声,极低透明度,只求「有机」不求明显) */}
        <rect
          x={neck.x}
          y={neck.y}
          width={neck.w}
          height={neck.h}
          rx={12}
          fill={`url(#wood${k})`}
          filter={`url(#grain${k})`}
          clipPath={`url(#neckclip${k})`}
        />
        {/* 琴颈上缘高光,压出体积 */}
        <rect
          x={neck.x}
          y={neck.y}
          width={neck.w}
          height={10}
          rx={5}
          fill="#FFFFFF"
          opacity={dark ? 0.04 : 0.18}
        />
        {/* 品丝:金属条 */}
        {Array.from({ length: FRETS }, (_, i) => i + 1).map((f) => (
          <rect
            key={f}
            x={fx(f) - 2}
            y={sy(5) - 13}
            width={4}
            height={sy(0) - sy(5) + 26}
            rx={2}
            fill={`url(#metal${k})`}
          />
        ))}
        {/* 弦枕:骨质条 */}
        <rect
          x={NUT - 4}
          y={sy(5) - 13}
          width={8}
          height={sy(0) - sy(5) + 26}
          rx={4}
          fill={dark ? "#CFC6B4" : "#F7EFDD"}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={0.6}
        />
        {/* 右端琴桥小鞍 */}
        <rect
          x={fx(FRETS) + 4}
          y={sy(5) - 12}
          width={5}
          height={sy(0) - sy(5) + 24}
          rx={2.5}
          fill={`url(#metal${k})`}
        />
        {/* 镶嵌记号:贝母径向渐变,3/5/7/9 单点、12 双点 */}
        {[3, 5, 7, 9].map((f) => (
          <circle key={f} cx={cx(f)} cy={midY} r={6.2} fill={`url(#pearl${k})`} />
        ))}
        {FRETS >= 12 && (
          <>
            <circle cx={cx(12)} cy={midY - 9} r={6.2} fill={`url(#pearl${k})`} />
            <circle cx={cx(12)} cy={midY + 9} r={6.2} fill={`url(#pearl${k})`} />
          </>
        )}
        {/* 和弦位置格底光:药丸形常亮,与悬停热区同形,一眼锁定「按这里」 */}
        {grp.pressed.map(({ s: s2, fret: f2 }) => (
          <rect
            key={`gl-${s2}-${f2}`}
            x={fx(f2 - 1) + 2}
            y={sy(s2) - 13}
            width={fx(f2) - fx(f2 - 1) - 4}
            height={26}
            rx={13}
            fill="#E8590C"
            opacity={0.16}
          />
        ))}
        {/* 弦:缠弦青铜、素弦钢色;被点亮的弦整根变琥珀 */}
        {STRINGS.map((_, s) => {
          const on = flash.has(s);
          const g = s <= 2 ? `url(#bronze${k})` : `url(#steel${k})`;
          const h = on ? GAUGE[s] + 1.4 : GAUGE[s];
          return (
            <rect
              key={s}
              x={22}
              y={sy(s) - h / 2}
              width={fx(FRETS) + 6 - 22}
              height={h}
              rx={h / 2}
              fill={on ? "#E8590C" : g}
              opacity={on ? 0.95 : 1}
            />
          );
        })}
        {/* 弦钮:奶白旋钮+弦名字母(高音 e 小写);点亮的弦其钮也闪琥珀 */}
        {STRINGS.map((n, s) => (
          <g key={s}>
            <circle
              cx={16}
              cy={sy(s)}
              r={8.5}
              fill={flash.has(s) ? "#E8590C" : dark ? "#3A332A" : "#E9DFC8"}
              stroke={dark ? "rgba(255,235,200,0.18)" : "rgba(90,70,40,0.35)"}
              strokeWidth={1}
            />
            <text
              x={16}
              y={sy(s) + 3.5}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="700"
              fill={flash.has(s) ? "#FFF7ED" : dark ? "#D6CDBB" : "#6B5B3E"}
            >
              {s === 5 ? "e" : n[0]}
            </text>
          </g>
        ))}
        {/* 和弦联动按点(弹入动画,key 绑和弦名):横杆+独立点,光晕+指法编号 */}
        <g key={`dots-${activeChord?.name ?? "none"}`} className="gpop">
          {grp.bars.map((r) => (
            <g key={`bar-${r.s0}-${r.s1}-${r.fret}`}>
              <rect
                x={cx(r.fret) - 8}
                y={sy(r.s1) - 8}
                width={16}
                height={sy(r.s0) - sy(r.s1) + 16}
                rx={8}
                fill={`url(#dot${k})`}
              />
              <text
                x={cx(r.fret)}
                y={(sy(r.s0) + sy(r.s1)) / 2 + 3.5}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="800"
                fill="#FFF7ED"
              >
                {r.finger}
              </text>
            </g>
          ))}
          {grp.dots.map((d) => (
            <g key={`${d.s}-${d.fret}`}>
              <circle cx={cx(d.fret)} cy={sy(d.s)} r={17} fill="#E8590C" opacity={0.16} />
              <circle cx={cx(d.fret)} cy={sy(d.s)} r={11} fill={`url(#dot${k})`} />
              <text
                x={cx(d.fret)}
                y={sy(d.s) + 3.5}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="800"
                fill="#FFF7ED"
              >
                {d.finger || ""}
              </text>
            </g>
          ))}
        </g>
        {/* 和弦空弦标记 ○(琥珀环,与闷弦 ✕ 配对) */}
        {activeChord?.frets.map((fr, s2) =>
          fr === 0 ? (
            <circle
              key={`op-${s2}`}
              cx={cx(0)}
              cy={sy(s2)}
              r={5.5}
              fill="none"
              stroke="#E8590C"
              strokeWidth={2.4}
            />
          ) : null,
        )}
        {/* 闷弦提示 ×(空弦区) */}
        {[...muted].map((s) => (
          <text
            key={s}
            x={cx(0)}
            y={sy(s) + 4}
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill="rgba(120,113,108,0.85)"
          >
            ✕
          </text>
        ))}
      </g>
    );
  }

  const defs = (
    <defs>
      {/* 亮色系 */}
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F6EBD4" />
        <stop offset="0.55" stopColor="#EFDFBE" />
        <stop offset="1" stopColor="#E3CDA2" />
      </linearGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#98A0AA" />
        <stop offset="0.5" stopColor="#E9EDF2" />
        <stop offset="1" stopColor="#8C939D" />
      </linearGradient>
      <linearGradient id="bronze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8A6A42" />
        <stop offset="0.5" stopColor="#E2C48E" />
        <stop offset="1" stopColor="#7C5C36" />
      </linearGradient>
      <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7A7A78" />
        <stop offset="0.5" stopColor="#F2F2EF" />
        <stop offset="1" stopColor="#83837F" />
      </linearGradient>
      <radialGradient id="pearl">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.7" stopColor="#F0E3C8" />
        <stop offset="1" stopColor="#D3BC8E" />
      </radialGradient>
      <radialGradient id="dot" cx="0.35" cy="0.3" r="1">
        <stop offset="0" stopColor="#FF9E66" />
        <stop offset="0.55" stopColor="#F06A1F" />
        <stop offset="1" stopColor="#C74A0B" />
      </radialGradient>
      <filter id="gshadow" x="-4%" y="-12%" width="108%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#8A5A1E" floodOpacity="0.22" />
      </filter>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.005 0.11" numOctaves="3" seed="7" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.10  0.7 0 0 0 -0.62"
        />
      </filter>
      <clipPath id="neckclip">
        <rect x={neck.x} y={neck.y} width={neck.w} height={neck.h} rx={12} />
      </clipPath>
      {/* 暗色系(加 D 后缀) */}
      <linearGradient id="woodD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3A2C1B" />
        <stop offset="0.55" stopColor="#2E2213" />
        <stop offset="1" stopColor="#241A0E" />
      </linearGradient>
      <linearGradient id="metalD" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4E545D" />
        <stop offset="0.5" stopColor="#9AA3AE" />
        <stop offset="1" stopColor="#464C55" />
      </linearGradient>
      <linearGradient id="bronzeD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6E5330" />
        <stop offset="0.5" stopColor="#D3B384" />
        <stop offset="1" stopColor="#5F4527" />
      </linearGradient>
      <linearGradient id="steelD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5E5E5C" />
        <stop offset="0.5" stopColor="#E9E9E4" />
        <stop offset="1" stopColor="#656562" />
      </linearGradient>
      <radialGradient id="pearlD">
        <stop offset="0" stopColor="#EDE8DC" />
        <stop offset="0.7" stopColor="#C9BFA5" />
        <stop offset="1" stopColor="#8F856C" />
      </radialGradient>
      <radialGradient id="dotD" cx="0.35" cy="0.3" r="1">
        <stop offset="0" stopColor="#FFA36B" />
        <stop offset="0.55" stopColor="#F06A1F" />
        <stop offset="1" stopColor="#B8450A" />
      </radialGradient>
      <filter id="gshadowD" x="-4%" y="-12%" width="108%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000000" floodOpacity="0.55" />
      </filter>
      <filter id="grainD">
        <feTurbulence type="fractalNoise" baseFrequency="0.005 0.11" numOctaves="3" seed="7" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.9  0 0 0 0 0.78  0 0 0 0 0.55  0.5 0 0 0 -0.6"
        />
      </filter>
      <clipPath id="neckclipD">
        <rect x={neck.x} y={neck.y} width={neck.w} height={neck.h} rx={12} />
      </clipPath>
    </defs>
  );

  return (
    <div className="overflow-x-auto pb-1" ref={wrapRef}>
      <div
        className="relative mx-auto"
        style={{ minWidth: geom.W, height: H }}
        role="group"
        aria-label="吉他指板,点格子发声"
      >
        <svg width={geom.W} height={H} viewBox={`0 0 ${geom.W} ${H}`} className="absolute inset-0">
          {defs}
          {/* 主题双渲染:亮/暗各一层实体琴颈 */}
          <g className="dark:hidden">{neckLayer(false)}</g>
          <g className="hidden dark:block">{neckLayer(true)}</g>
          {/* 品号:只标记号位(按当前品数截断),12 品加重 */}
          {NUMS.filter((f) => f <= FRETS).map((f) => (
            <text
              key={f}
              x={cx(f)}
              y={H - 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight={f === 12 ? 700 : 400}
              className="fill-neutral-400 dark:fill-neutral-500"
            >
              {f}
            </text>
          ))}
        </svg>
        {/* 点击层:每弦每品一枚圆角热区(随递收品距逐格定位),悬停有琥珀药丸 */}
        {STRINGS.map((_, s) =>
          Array.from({ length: FRETS + 1 }, (_, f) => {
            const left = f === 0 ? NUT - 34 : fx(f - 1) + 2;
            const width = f === 0 ? 30 : fx(f) - fx(f - 1) - 4;
            return (
              <React.Fragment key={`${s}-${f}`}>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`${STRINGS[s]} 弦第 ${f} 品`}
                  title={`${transposeNote(STRINGS[s], f)}`}
                  onPointerDown={() => {
                    void pluck(s, f);
                    onCellClick?.(s, f);
                  }}
                  className="absolute rounded-full transition hover:bg-signature/25 active:bg-signature/40"
                  style={{ left, top: sy(s) - 13, width: Math.max(width, 18), height: 26 }}
                />
                {selected?.has(`${s}:${f}`) && (
                  <span
                    className="pointer-events-none absolute rounded-full border-2 border-signature bg-signature/25"
                    style={{ left, top: sy(s) - 15, width: Math.max(width, 18) + 4, height: 30 }}
                  />
                )}
              </React.Fragment>
            );
          }),
        )}
      </div>
    </div>
  );
}
