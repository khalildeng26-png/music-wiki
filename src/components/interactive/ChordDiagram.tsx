import * as React from "react";

type Props = {
  /** 和弦名,如 "Em" */
  name: string;
  /** 长度 6,顺序为 6 弦(低 E)→1 弦(高 E);-1 = 不弹(×),0 = 空弦(O) */
  frets: number[];
  /** 可选,指法编号 1-4,顺序同 frets(0 或不传 = 不标) */
  fingers?: number[];
  /** 起始品位,默认 1(第一品位,即琴枕位置);高把位和弦传实际品数 */
  baseFret?: number;
  /** 图注文字 */
  label?: string;
};

const FRET_COUNT = 4; // 纵向固定展示 4 个品格
const W = 132;
const H = 150;
const GRID_LEFT = 26;
const GRID_TOP = 34;
const STR_GAP = 16;
const FRET_GAP = 26;

const strX = (i: number) => GRID_LEFT + i * STR_GAP;
const fretY = (j: number) => GRID_TOP + j * FRET_GAP;
/** 按弦圆点的纵坐标:第 f 品的中心(上、下品丝之间) */
const dotY = (f: number) => (fretY(f - 1) + fretY(f)) / 2;

/** 吉他和弦指法图:竖线为弦(6→1 从左到右),横线为品丝,圆点为按弦位置,O/× 标在琴枕上方。 */
export function ChordDiagram({ name, frets, fingers, baseFret = 1, label }: Props) {
  if (frets.length !== 6) {
    console.warn(
      `[ChordDiagram] "${name}" 的 frets 必须是 6 元素数组(顺序 6 弦→1 弦),实际长度 ${frets.length}`,
    );
  }
  return (
    <figure className="not-prose my-6 inline-block overflow-hidden rounded-xl border bg-card align-top">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-32"
        role="img"
        aria-label={`${name} 和弦图`}
      >
        <text
          x={W / 2}
          y={20}
          textAnchor="middle"
          className="fill-foreground text-sm font-semibold"
        >
          {name}
        </text>
        {/* 品丝横线;baseFret=1 时最上边线画粗,代表琴枕 */}
        {Array.from({ length: FRET_COUNT + 1 }, (_, j) => (
          <line
            key={`f${j}`}
            x1={GRID_LEFT}
            y1={fretY(j)}
            x2={strX(5)}
            y2={fretY(j)}
            className="stroke-foreground"
            strokeWidth={j === 0 && baseFret === 1 ? 3.5 : 1}
          />
        ))}
        {/* 琴弦竖线 */}
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={`s${i}`}
            x1={strX(i)}
            y1={GRID_TOP}
            x2={strX(i)}
            y2={fretY(FRET_COUNT)}
            className="stroke-foreground"
            strokeWidth={1}
          />
        ))}
        {/* 琴枕上方:空弦 O / 不弹 × */}
        {frets.map((f, i) =>
          f === 0 ? (
            <circle
              key={`o${i}`}
              cx={strX(i)}
              cy={GRID_TOP - 10}
              r={4}
              fill="none"
              className="stroke-foreground"
              strokeWidth={1.5}
            />
          ) : f === -1 ? (
            <text
              key={`x${i}`}
              x={strX(i)}
              y={GRID_TOP - 5}
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              ×
            </text>
          ) : null,
        )}
        {/* 按弦圆点(带可选指法编号) */}
        {frets.map((f, i) =>
          f > 0 ? (
            <g key={`d${i}`}>
              <circle cx={strX(i)} cy={dotY(f)} r={7} className="fill-foreground" />
              {fingers?.[i] ? (
                <text
                  x={strX(i)}
                  y={dotY(f) + 3.5}
                  textAnchor="middle"
                  className="fill-card text-[9px]"
                >
                  {fingers[i]}
                </text>
              ) : null}
            </g>
          ) : null,
        )}
        {/* 高把位标记 */}
        {baseFret > 1 ? (
          <text x={10} y={fretY(0) + 16} className="fill-foreground text-[10px]">
            {baseFret}fr
          </text>
        ) : null}
      </svg>
      {label ? (
        <figcaption className="border-t bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default ChordDiagram;
