import * as React from "react";

import { track } from "@/lib/track";
import { transposeNote } from "@/lib/transpose";

import { playNote } from "./audio";

/** 标准定弦,低音弦在前(六弦 E2 → 一弦 E4);与 audio.ts guitar 采样的六个基准音一致,
 *  其余品位由 Tone.Sampler 按最近采样移调发出。 */
const STRINGS = ["E2", "A2", "D3", "G3", "B3", "E4"] as const;

/** -1 = 闷弦(×),0 = 空弦(○),>0 = 按品;顺序与 STRINGS 同(低→高)。 */
type Chord = {
  name: string;
  frets: number[];
  /** 指法编号(1=食指…4=小指,0=空弦/闷弦);小圆点里的数字 */
  fingers: number[];
  /** 横按提示(如 F/Bm 的食指横按) */
  barre?: boolean;
  /** 同位异指的多按法(位置与音完全不变,只换手指分配)。
   *  指法选择是战略:空出哪根手指,决定这个和弦能怎么被装饰。
   *  variants 含默认版为第一项,其 fingers 与顶层一致。 */
  variants?: { label: string; fingers: number[]; note?: string }[];
  /** 分组(基本/七和弦/挂留加音/横按),用于分类筛选 */
  group: (typeof GROUPS)[number];
};

/** 和弦分组与展示顺序(分类筛选 chips 顺序,按学习阶段排) */
const GROUPS = ["基本", "七和弦", "挂留加音", "横按"] as const;

/** 常用和弦库:四个学习阶段分组;横按组最高到 5 品(和弦图画 5 品)。 */
const CHORDS: Chord[] = [
  // ── 基本:入门开放和弦 ──
  { name: "C", frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], group: "基本" },
  {
    name: "G",
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    variants: [
      { label: "123·留小指", fingers: [2, 1, 0, 0, 0, 3], note: "空出小拇指,可临时去够二弦三品这类加音" },
      { label: "234·留食指", fingers: [2, 3, 0, 0, 0, 4], note: "空出食指,二弦一品(C 音)随时能按;歌里要给 G 挂 C 色彩时用它" },
    ],
    group: "基本",
  },
  { name: "D", frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], group: "基本" },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], group: "基本" },
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], group: "基本" },
  {
    name: "E",
    frets: [0, 2, 2, 1, 1, 0],
    fingers: [0, 2, 3, 1, 1, 0],
    variants: [
      { label: "三指·留小指", fingers: [0, 2, 3, 1, 1, 0], note: "食指小横按压一品两弦;也是 F 大横按的前身" },
      { label: "四指", fingers: [0, 3, 4, 1, 2, 0], note: "一品两弦分给食指中指,二品两弦分给无名指小指;每弦一指,职责清楚" },
    ],
    group: "基本",
  },
  {
    name: "A",
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    variants: [
      { label: "三指", fingers: [0, 0, 1, 2, 3, 0], note: "二品三根弦各用一指;最通用的版本" },
      { label: "横按·留三指", fingers: [0, 0, 1, 1, 1, 0], note: "食指横压二品三根弦,空出中指无名指小指加音;A 型大横按的前身" },
    ],
    group: "基本",
  },
  { name: "Dm", frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], group: "基本" },
  { name: "F", frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: true, group: "基本" },
  // ── 七和弦:布鲁斯与流行的色彩主力 ──
  { name: "G7", frets: [3, 2, 0, 0, 0, 1], fingers: [2, 1, 0, 0, 0, 3], group: "七和弦" },
  { name: "C7", frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], group: "七和弦" },
  { name: "D7", frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], group: "七和弦" },
  { name: "A7", frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0], group: "七和弦" },
  { name: "E7", frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], group: "七和弦" },
  { name: "Em7", frets: [0, 2, 2, 0, 3, 0], fingers: [0, 2, 3, 0, 4, 0], group: "七和弦" },
  { name: "Am7", frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], group: "七和弦" },
  { name: "Dm7", frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], group: "七和弦" },
  { name: "B7", frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], group: "七和弦" },
  // ── 挂留/加音: Modifier 色彩 ──
  { name: "Dsus4", frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4], group: "挂留加音" },
  { name: "Dsus2", frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], group: "挂留加音" },
  { name: "Asus2", frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], group: "挂留加音" },
  { name: "Asus4", frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], group: "挂留加音" },
  { name: "Esus4", frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 1, 0, 0], group: "挂留加音" },
  { name: "Cadd9", frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], group: "挂留加音" },
  // ── 横按:F 之后的大关 ──
  { name: "Bm", frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: true, group: "横按" },
  { name: "B♭", frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], group: "横按" },
  { name: "F#m", frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: true, group: "横按" },
  { name: "Gm", frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: true, group: "横按" },
  { name: "Cm", frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: true, group: "横按" },
];

/** 电脑键盘:字母排 A S D F G H J K L 依次对应九个和弦(与钢琴组件同一条手位思路)。 */
const KB_ROW = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"];
function kbChar(code: string): string {
  return code.slice(3);
}

/** 指法分组:把按品拆成「横杆(同指同品的连续弦段≥2)」与「独立圆点」。
 *  chord.barre=true 的全横按(F):最低品整杆由指 1 覆盖,其余手指画独立点。
 *  pressed 返回全部按品弦(横杆覆盖的也算),供指板联动底光用。 */
function groupChord(chord: Chord): {
  bars: { s0: number; s1: number; fret: number; finger: number }[];
  dots: { s: number; fret: number; finger: number }[];
  pressed: { s: number; fret: number }[];
} {
  const pairs = chord.frets
    .map((f, s) => ({ s, f, g: chord.fingers[s] }))
    .filter((p) => p.f > 0)
    .sort((a, b) => a.s - b.s);
  const bars: { s0: number; s1: number; fret: number; finger: number }[] = [];
  const dots: { s: number; fret: number; finger: number }[] = [];
  if (chord.barre) {
    const fret = Math.min(...pairs.map((p) => p.f));
    bars.push({ s0: pairs[0].s, s1: pairs[pairs.length - 1].s, fret, finger: 1 });
    for (const p of pairs) if (p.g !== 1) dots.push({ s: p.s, fret: p.f, finger: p.g });
  } else {
    for (let i = 0; i < pairs.length;) {
      let j = i;
      while (
        j + 1 < pairs.length &&
        pairs[j + 1].s === pairs[j].s + 1 &&
        pairs[j + 1].g === pairs[i].g &&
        pairs[j + 1].f === pairs[i].f
      )
        j++;
      if (j > i)
        bars.push({ s0: pairs[i].s, s1: pairs[j].s, fret: pairs[i].f, finger: pairs[i].g });
      else dots.push({ s: pairs[i].s, fret: pairs[i].f, finger: pairs[i].g });
      i = j + 1;
    }
  }
  return { bars, dots, pressed: pairs.map((p) => ({ s: p.s, fret: p.f })) };
}

/** 和弦的实际音(低→高,跳过闷弦);空弦加 0 个半音,按品加对应半音。 */
function chordNotes(c: Chord): string[] {
  const out: string[] = [];
  c.frets.forEach((f, i) => {
    if (f >= 0) out.push(transposeNote(STRINGS[i], f));
  });
  return out;
}

/** 单个和弦图(竖排网格:六根竖线=弦,低音在左;弦枕在顶 + 五条品丝,共五个品格)。
 *  几何约定:wireY(f)=第 f 品品丝的 y;弦枕单独画在 top(不与品丝重叠——
 *  此前品丝从 1 起画又被弦枕盖住一根,导致实际只有 N-1 个品格的 bug 即源于此);
 *  第 f 品的按点中心 = dotY(f),坐在第 f-1 与第 f 品丝之间。
 *  横按画圆角横杆(E 的食指小横按/F 的全横按),其余按品画圆点;杆/点上标指法编号。 */
function ChordDiagram({ chord }: { chord: Chord }) {
  const W = 84;
  const H = 140;
  const left = 14;
  const top = 26;
  const sw = (W - left - 10) / 5; // 弦距
  const fh = (H - top - 12) / 5; // 品距(五个品格)
  const x = (s: number) => left + s * sw;
  const wireY = (f: number) => top + f * fh; // 第 f 品品丝
  const dotY = (f: number) => top + (f - 0.5) * fh; // 第 f 品按点中心
  const { bars, dots } = groupChord(chord);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {/* 品丝:第 1–5 品 */}
      {[1, 2, 3, 4, 5].map((f) => (
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
      {/* 上弦枕(加粗,独立于品丝) */}
      <line
        x1={left}
        y1={top}
        x2={x(5)}
        y2={top}
        stroke="currentColor"
        strokeWidth={3.5}
        className="text-neutral-600 dark:text-neutral-300"
      />
      {/* 弦:从弦枕贯穿到第 5 品品丝 */}
      {STRINGS.map((_, s) => (
        <line
          key={s}
          x1={x(s)}
          y1={top}
          x2={x(s)}
          y2={wireY(5)}
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
            y={dotY(r.fret) - 6.5}
            width={x(r.s1) - x(r.s0) + 13}
            height={13}
            rx={6.5}
            className="fill-signature"
          />
          <text
            x={(x(r.s0) + x(r.s1)) / 2}
            y={dotY(r.fret) + 3}
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
          <circle cx={x(d.s)} cy={dotY(d.fret)} r={6.5} className="fill-signature" />
          <text
            x={x(d.s)}
            y={dotY(d.fret) + 3}
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
function Fretboard({
  activeChord,
  flash,
  flashString,
}: {
  activeChord: Chord | null;
  /** 正在扫弦时被点亮的弦序(短促高亮) */
  flash: ReadonlySet<number>;
  /** 点单音时让对应弦也闪一下(反馈) */
  flashString: (s: number) => void;
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
              <button
                key={`${s}-${f}`}
                type="button"
                tabIndex={-1}
                aria-label={`${STRINGS[s]} 弦第 ${f} 品`}
                title={`${transposeNote(STRINGS[s], f)}`}
                onPointerDown={() => void pluck(s, f)}
                className="absolute rounded-full transition hover:bg-signature/25 active:bg-signature/40"
                style={{ left, top: sy(s) - 13, width: Math.max(width, 18), height: 26 }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

type Props = { label?: string };

/** 吉他和弦机:点和弦卡片=扫弦(下扫,或下+上交替),九个入门开放和弦 + F 小横按;
 *  指板与和弦图联动——扫过的和弦在指板上点亮按点,指板格子本身可点发声。
 *  键盘可奏(字母排对应九个和弦);「1-6-4-5」按钮连播演示进行。 */
export function Guitar({ label }: Props) {
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
        <figcaption className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {label}
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
          <Fretboard activeChord={active} flash={flash} flashString={flashString} />
        </div>
      </div>
    </figure>
  );
}

export default Guitar;
