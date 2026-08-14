# 橙月 Wiki 吉他/钢琴「入门阶」内容扩充 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为吉他与钢琴各建一条 5 步入门学习路线（共 10 篇新词条 + 2 条路线 + 1 个新组件 + 3 张线条插图），让零基础用户能从持琴/坐姿走到"弹唱第一段/弹出简单伴奏"。

**架构：** 沿用现有内容架构——词条 `src/content/entries/*.mdx`（frontmatter + MDX 正文 + 互动组件）、路线 `src/content/paths/*.mdx`（frontmatter `steps` 串词条）。新增唯一组件 `ChordDiagram`（SVG 和弦图）；3 张插图放 `public/images/` 用 `<img>` 引用。无新依赖、无新音频逻辑。

**技术栈：** Astro + MDX + React 组件（Tone.js 音频，已封装在 `audio.ts`）+ Tailwind v4 + oxlint/oxfmt。验证手段：`npm run check`（lint+fmt）、`npm run build`（含 pagefind 索引）、`npm run dev` 手动走查。本仓库无单测框架，不虚构测试基建。

**规格依据：** `docs/superpowers/specs/2026-08-12-guitar-piano-intro-content-design.md`（commit 5552764）

**分支约定：** music-wiki 仓库惯例是直接在 main 提交（见既有 git log），本计划沿用该惯例；每个任务一次 commit。

---

## 文件结构

| 文件                                                | 动作 | 职责                                         |
| --------------------------------------------------- | ---- | -------------------------------------------- |
| `src/components/interactive/ChordDiagram.tsx`       | 创建 | 可复用吉他和弦指法图（SVG）                  |
| `public/images/piano-posture.svg`                   | 创建 | 钢琴坐姿侧视图（线条图）                     |
| `public/images/piano-hand-shape.svg`                | 创建 | 钢琴手型与指法编号图（线条图）               |
| `public/images/guitar-setup-posture.svg`            | 创建 | 吉他持琴坐姿图（线条图）                     |
| `src/content/entries/guitar-setup.mdx`              | 创建 | 吉他入门 ① 持琴与调音                        |
| `src/content/entries/guitar-open-chords.mdx`        | 创建 | 吉他入门 ② 第一批开放和弦                    |
| `src/content/entries/guitar-strumming.mdx`          | 创建 | 吉他入门 ③ 扫弦与节奏型                      |
| `src/content/entries/guitar-chord-changes.mdx`      | 创建 | 吉他入门 ④ 和弦转换                          |
| `src/content/entries/guitar-first-song.mdx`         | 创建 | 吉他入门 ⑤ 第一首弹唱                        |
| `src/content/entries/piano-posture.mdx`             | 创建 | 钢琴入门 ① 坐姿手型与指法编号                |
| `src/content/entries/piano-keyboard-map.mdx`        | 创建 | 钢琴入门 ② 键盘地图与找音                    |
| `src/content/entries/piano-first-scale.mdx`         | 创建 | 钢琴入门 ③ 第一条音阶 C 大调                 |
| `src/content/entries/piano-two-hands.mdx`           | 创建 | 钢琴入门 ④ 双手协调入门                      |
| `src/content/entries/piano-first-accompaniment.mdx` | 创建 | 钢琴入门 ⑤ 简单伴奏入门                      |
| `src/content/paths/guitar-intro.mdx`                | 创建 | 吉他入门路线                                 |
| `src/content/paths/piano-intro.mdx`                 | 创建 | 钢琴入门路线                                 |
| `src/content/entries/guitar.mdx`                    | 修改 | 文末加入门路线导航；related 补 guitar-setup  |
| `src/content/entries/piano.mdx`                     | 修改 | 文末加入门路线导航；related 补 piano-posture |

---

## 关键事实基准（写内容时以此为准，来自 DESIGN.md 已核对清单）

- 吉他标准定弦 6→1 弦 = E A D G B E（E2 A2 D3 G3 B3 E4）
- 除 3 弦外每弦第 5 品 = 下一弦空弦；3 弦第 4 品 = 2 弦空弦
- 钢琴 88 键；黑键分组为「两黑、三黑」；E-F、B-C 之间无黑键
- C 大调音阶：全全半全全全半；C 调右手音阶指法 1-2-3-1-2-3-4-5
- 流行经典进行 I–V–vi–IV（C 调即 C–G–Am–F）
- 手指编号：拇指=1 … 小指=5（钢琴/吉他左手通用）

## 组件调用约定（所有任务通用）

```mdx
import { Piano } from "../../components/interactive/Piano";
import { Fretboard } from "../../components/interactive/Fretboard";
import { StaffNotation } from "../../components/interactive/StaffNotation";
import { ChordPlayer } from "../../components/interactive/ChordPlayer";
import { Metronome } from "../../components/interactive/Metronome";
import { ChordDiagram } from "../../components/interactive/ChordDiagram";
```

- `Piano` props: `startOct?=4, octaves?=2, label?`
- `Fretboard` props: `frets?=12, label?`
- `StaffNotation` props: `notes: string[]`（如 `["C4","D4"]`）, `label?`
- `ChordPlayer` props: `chords: string[][]`（每个和弦 = 音名数组，如 `["C4","E4","G4"]`）, `label`, `desc?`
- `Metronome` props: 无
- 所有组件用 `client:visible` 挂载
- 词条 frontmatter 必填：`title / titleEn / category / summary / tags / related / order`，乐器类 `category: 乐器`

---

### 任务 1：ChordDiagram 组件

**文件：**

- 创建：`src/components/interactive/ChordDiagram.tsx`

- [ ] **步骤 1：创建组件文件**

```tsx
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

/** 吉他和弦指法图:竖线为弦(6→1 从左到右),横线为品丝,圆点为按弦位置,O/× 标在琴枕上方。 */
export function ChordDiagram({ name, frets, fingers, baseFret = 1, label }: Props) {
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
              <circle
                cx={strX(i)}
                cy={(fretY(f - 1) + fretY(f)) / 2}
                r={7}
                className="fill-foreground"
              />
              {fingers?.[i] ? (
                <text
                  x={strX(i)}
                  y={(fretY(f - 1) + fretY(f)) / 2 + 3.5}
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
```

- [ ] **步骤 2：lint + 格式化检查**

运行：`npm run check`
预期：无 error（如 oxfmt 改动格式，保留格式化后的版本）

- [ ] **步骤 3：构建验证（TS 类型通过）**

运行：`npm run build`
预期：构建成功（此时组件尚未被引用，只验证类型/语法）

- [ ] **步骤 4：Commit**

```bash
git add src/components/interactive/ChordDiagram.tsx
git commit -m "feat(component): ChordDiagram 吉他和弦指法图(SVG,可复用,支持指法编号与高把位)"
```

---

### 任务 2：3 张线条插图 SVG

**文件：**

- 创建：`public/images/piano-posture.svg`
- 创建：`public/images/piano-hand-shape.svg`
- 创建：`public/images/guitar-setup-posture.svg`

**约定：** SVG 通过 `<img src="/images/xxx.svg">` 引用，页面 CSS 变量**不会**透传进 `<img>`，因此颜色全部写死：线条 `#a1a1aa`（亮暗模式均清晰）、强调色 `#d97706`（琥珀）。线宽分层（以下方代码块为准）：主线稿 2~2.5，细节/参考线（琴键分隔线、虚线）1，吉他琴颈 5（粗线模拟厚度）。风格简笔示意，允许执行者在保持信息正确的前提下微调坐标。

- [ ] **步骤 1：创建 `public/images/piano-posture.svg`（坐姿侧视图）**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" role="img" aria-label="钢琴坐姿侧视图:背挺直,手肘与键盘大致同高,坐琴凳前二分之一">
  <!-- 地面 -->
  <line x1="20" y1="290" x2="460" y2="290" stroke="#a1a1aa" stroke-width="2"/>
  <!-- 钢琴琴体 -->
  <rect x="300" y="60" width="150" height="150" fill="none" stroke="#a1a1aa" stroke-width="2.5" rx="4"/>
  <!-- 键盘托板 -->
  <rect x="240" y="210" width="210" height="14" fill="none" stroke="#a1a1aa" stroke-width="2.5" rx="3"/>
  <!-- 琴键分隔线 -->
  <line x1="260" y1="210" x2="260" y2="224" stroke="#a1a1aa" stroke-width="1"/>
  <line x1="280" y1="210" x2="280" y2="224" stroke="#a1a1aa" stroke-width="1"/>
  <line x1="300" y1="210" x2="300" y2="224" stroke="#a1a1aa" stroke-width="1"/>
  <line x1="320" y1="210" x2="320" y2="224" stroke="#a1a1aa" stroke-width="1"/>
  <line x1="340" y1="210" x2="340" y2="224" stroke="#a1a1aa" stroke-width="1"/>
  <!-- 琴凳 -->
  <rect x="70" y="200" width="90" height="12" fill="none" stroke="#a1a1aa" stroke-width="2.5" rx="3"/>
  <line x1="80" y1="212" x2="80" y2="290" stroke="#a1a1aa" stroke-width="2.5"/>
  <line x1="150" y1="212" x2="150" y2="290" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 人:头 -->
  <circle cx="128" cy="88" r="20" fill="none" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 躯干(微前倾) -->
  <line x1="124" y1="108" x2="112" y2="200" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 手臂:肩→肘→手(强调色,落点在键盘面) -->
  <polyline points="122,124 168,158 250,208" fill="none" stroke="#d97706" stroke-width="2.5"/>
  <!-- 大腿→小腿→脚 -->
  <polyline points="112,200 185,238 185,290" fill="none" stroke="#a1a1aa" stroke-width="2.5"/>
  <line x1="185" y1="290" x2="206" y2="290" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 手肘高度参考虚线(肘→键盘) -->
  <line x1="168" y1="158" x2="240" y2="158" stroke="#d97706" stroke-width="1" stroke-dasharray="4 4"/>
  <!-- 标注 -->
  <text x="88" y="50" font-size="12" fill="#d97706">背挺直,头不低</text>
  <text x="130" y="146" font-size="12" fill="#d97706">手肘约与键盘同高</text>
  <text x="52" y="262" font-size="12" fill="#a1a1aa">坐琴凳前二分之一</text>
  <text x="360" y="252" font-size="12" fill="#a1a1aa">双脚平放地面</text>
</svg>
```

- [ ] **步骤 2：创建 `public/images/piano-hand-shape.svg`（手型与指法编号）**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 280" role="img" aria-label="钢琴手型:手指自然弯曲如握球,指尖触键,手腕不塌,拇指到小指编号 1 到 5">
  <!-- 底部:一段白键 -->
  <g stroke="#a1a1aa" stroke-width="2" fill="none">
    <rect x="44" y="200" width="56" height="64"/>
    <rect x="100" y="200" width="56" height="64"/>
    <rect x="156" y="200" width="56" height="64"/>
    <rect x="212" y="200" width="56" height="64"/>
    <rect x="268" y="200" width="56" height="64"/>
    <rect x="324" y="200" width="56" height="64"/>
    <rect x="380" y="200" width="56" height="64"/>
  </g>
  <!-- 黑键示意(两黑一组) -->
  <g fill="#a1a1aa">
    <rect x="86" y="200" width="28" height="38" rx="2"/>
    <rect x="142" y="200" width="28" height="38" rx="2"/>
  </g>
  <!-- 手掌:拱形 -->
  <path d="M 120 128 Q 240 56 360 128" fill="none" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 手腕保持虚线 -->
  <line x1="96" y1="150" x2="384" y2="150" stroke="#d97706" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="392" y="154" font-size="12" fill="#d97706">手腕不塌</text>
  <!-- 五指:弯曲落向键面 -->
  <g fill="none" stroke="#a1a1aa" stroke-width="2.5">
    <path d="M 140 126 Q 122 158 116 196"/>
    <path d="M 186 108 Q 176 152 172 196"/>
    <path d="M 234 100 Q 232 150 230 196"/>
    <path d="M 286 104 Q 292 152 296 196"/>
    <path d="M 336 120 Q 350 156 354 196"/>
  </g>
  <!-- 指尖编号圆 1-5(拇指→小指) -->
  <g font-size="13" font-weight="600" text-anchor="middle">
    <circle cx="116" cy="184" r="12" fill="#d97706"/>
    <text x="116" y="189" fill="#ffffff">1</text>
    <circle cx="172" cy="184" r="12" fill="#d97706"/>
    <text x="172" y="189" fill="#ffffff">2</text>
    <circle cx="230" cy="184" r="12" fill="#d97706"/>
    <text x="230" y="189" fill="#ffffff">3</text>
    <circle cx="296" cy="184" r="12" fill="#d97706"/>
    <text x="296" y="189" fill="#ffffff">4</text>
    <circle cx="354" cy="184" r="12" fill="#d97706"/>
    <text x="354" y="189" fill="#ffffff">5</text>
  </g>
  <text x="120" y="36" font-size="12" fill="#a1a1aa">手指自然弯曲,像虚握一个球;指尖(不是指肚)触键</text>
</svg>
```

- [ ] **步骤 3：创建 `public/images/guitar-setup-posture.svg`（持琴坐姿）**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" role="img" aria-label="吉他持琴坐姿:琴体凹口搭在右大腿上,琴颈略上扬,身体放松坐直">
  <!-- 地面 -->
  <line x1="20" y1="290" x2="460" y2="290" stroke="#a1a1aa" stroke-width="2"/>
  <!-- 凳子 -->
  <rect x="210" y="200" width="110" height="12" fill="none" stroke="#a1a1aa" stroke-width="2.5" rx="3"/>
  <line x1="222" y1="212" x2="222" y2="290" stroke="#a1a1aa" stroke-width="2.5"/>
  <line x1="308" y1="212" x2="308" y2="290" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 人:头 -->
  <circle cx="268" cy="78" r="20" fill="none" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 躯干(坐直) -->
  <line x1="264" y1="98" x2="258" y2="200" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 大腿(向右前) -->
  <line x1="258" y1="200" x2="176" y2="228" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 小腿+脚 -->
  <line x1="176" y1="228" x2="172" y2="290" stroke="#a1a1aa" stroke-width="2.5"/>
  <line x1="172" y1="290" x2="150" y2="290" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 吉他琴体:下凹大、上凹小,搭在大腿上 -->
  <ellipse cx="182" cy="222" rx="46" ry="38" fill="none" stroke="#d97706" stroke-width="2.5"/>
  <ellipse cx="208" cy="190" rx="28" ry="23" fill="none" stroke="#d97706" stroke-width="2.5"/>
  <!-- 音孔 -->
  <circle cx="196" cy="208" r="11" fill="none" stroke="#d97706" stroke-width="2"/>
  <!-- 琴颈:向左上微扬 -->
  <line x1="186" y1="172" x2="92" y2="118" stroke="#d97706" stroke-width="5"/>
  <!-- 琴头 -->
  <rect x="74" y="104" width="22" height="14" rx="3" transform="rotate(-30 85 111)" fill="none" stroke="#d97706" stroke-width="2.5"/>
  <!-- 左手扶琴颈 -->
  <path d="M 236 132 Q 168 120 108 124" fill="none" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 右手搭琴体 -->
  <path d="M 252 128 Q 232 168 210 198" fill="none" stroke="#a1a1aa" stroke-width="2.5"/>
  <!-- 标注 -->
  <text x="40" y="88" font-size="12" fill="#d97706">琴颈略上扬,约 30°</text>
  <text x="230" y="260" font-size="12" fill="#a1a1aa">琴体凹口搭右大腿</text>
  <text x="330" y="120" font-size="12" fill="#a1a1aa">坐直不驼背,琴靠身上而不是人趴琴上</text>
</svg>
```

- [ ] **步骤 4：本地预览验证**

运行：`npm run dev`，浏览器打开 `http://localhost:4321/images/piano-posture.svg`（其余两张同理）。
预期：三张图都能打开、元素位置合理、文字不溢出画布。坐标不合理处直接微调 SVG。

- [ ] **步骤 5：Commit**

```bash
git add public/images/piano-posture.svg public/images/piano-hand-shape.svg public/images/guitar-setup-posture.svg
git commit -m "feat(assets): 入门阶线条插图——钢琴坐姿/钢琴手型/吉他持琴坐姿(SVG,亮暗通用配色)"
```

---

### 任务 3：吉他入门词条 ① ②（持琴调音 + 开放和弦）

**文件：**

- 创建：`src/content/entries/guitar-setup.mdx`
- 创建：`src/content/entries/guitar-open-chords.mdx`

- [ ] **步骤 1：创建 `guitar-setup.mdx`**

frontmatter（原样使用）：

```yaml
---
title: 持琴与调音
titleEn: Holding & Tuning
category: 乐器
summary: 学吉他的第 0 步:把琴拿稳、把音调准。标准定弦 EADGBE、调音器用法、坐姿站姿一次讲清。
tags: [乐器, 吉他, 入门, 调音]
related: [guitar, guitar-tab, guitar-open-chords]
order: 11
---
```

正文结构与组件（按此骨架写正文，语言遵循站点既有文风——短句、有具体信息、不套模板；参考 `guitar.mdx` 现有写法）：

1. 开头：为什么第一步是调音而不是学和弦——琴不准，练出的音准感是错的。
2. **持琴坐姿**：插入插图 `<img src="/images/guitar-setup-posture.svg" alt="吉他持琴坐姿示意" className="not-prose my-6 w-full max-w-md mx-auto rounded-xl border" />`；要点：琴体凹口搭右大腿、琴颈略上扬约 30°、坐直、琴贴身上不是人趴琴上。站姿用背带同理，琴不要挂太低。
3. **标准定弦**：6→1 弦 = E A D G B E（E2 A2 D3 G3 B3 E4），插入：
   `<StaffNotation client:visible notes={["E2", "A2", "D3", "G3", "B3", "E4"]} label="标准空弦音:6 弦 E2 → 1 弦 E4。" />`
4. **调音器怎么用**：夹式调音器看指针居中；没调音器时用「5 品法则」相对调音——除 3 弦外每弦第 5 品 = 下一弦空弦，3 弦是第 4 品 = 2 弦空弦。插入：
   `<Fretboard client:visible label="对照调音:点品格听音,把相邻两根弦调到同音。" />`
5. **常见坑**：拧弦轴方向（宁松勿紧防断弦）、新弦会跑音要多调几遍、调音从低音弦往高音弦调。
6. 收尾一句自然过渡：琴准了，下一步按出第一批和弦。

- [ ] **步骤 2：创建 `guitar-open-chords.mdx`**

frontmatter（原样使用）：

```yaml
---
title: 第一批开放和弦
titleEn: First Open Chords
category: 乐器
summary: Em、Am、C、G、D——按手指难度递进的五个开放和弦,附指法图与常见按错排查。拿下它们就能弹大量流行歌。
tags: [乐器, 吉他, 入门, 和弦]
related: [guitar-setup, chord]
order: 12
---
```

正文结构与组件：

1. 开头：什么是开放和弦（用到空弦、在第一至三品内），为什么按 Em→Am→C→G→D 的顺序学（手指负担递增）。
2. **和弦图怎么读**：先用一张 Em 图讲清读法——竖线是弦（左起 6 弦）、横线是品、圆点是按弦手指（点内数字=指法编号）、顶部 O=空弦 ×=不弹。
3. **五个和弦逐个讲**，每个一节，和弦图两两并排（用 `ChordDiagram` 的 inline-block 特性）：

```mdx
import { ChordDiagram } from "../../components/interactive/ChordDiagram";
import { ChordPlayer } from "../../components/interactive/ChordPlayer";

<ChordDiagram
  name="Em"
  frets={[0, 2, 2, 0, 0, 0]}
  fingers={[0, 2, 3, 0, 0, 0]}
  label="Em:5 弦、4 弦第 2 品,最简单的大横按之前的起点。"
/>
<ChordDiagram
  name="Am"
  frets={[-1, 0, 2, 2, 1, 0]}
  fingers={[0, 0, 2, 3, 1, 0]}
  label="Am:6 弦不弹(×)。"
/>
<ChordDiagram
  name="C"
  frets={[-1, 3, 2, 0, 1, 0]}
  fingers={[0, 3, 2, 0, 1, 0]}
  label="C:注意 6 弦不弹。"
/>
<ChordDiagram
  name="G"
  frets={[3, 2, 0, 0, 0, 3]}
  fingers={[3, 2, 0, 0, 0, 4]}
  label="G:3-2-4 指法,换到 C 时手型顺。"
/>
<ChordDiagram
  name="D"
  frets={[-1, -1, 0, 2, 3, 2]}
  fingers={[0, 0, 0, 1, 3, 2]}
  label="D:只弹 4-3-2-1 四根弦。"
/>

<ChordPlayer client:visible chords={[["E2", "B2", "E3", "G3", "B3", "E4"], ["A2", "E3", "A3", "C4", "E4"], ["C3", "E3", "G3", "C4", "E4"], ["G2", "B2", "D3", "G3", "B3", "G4"], ["D3", "A3", "D4", "F#4"]} label="依次听五个和弦:Em → Am → C → G → D。" desc="点播放,对照手型记住每个和弦的「长相」与「听感」。" />
```

4. 每个和弦一节的内容要点：按法口诀（哪根手指哪个品）、常见错误排查（碰哑邻弦=手指要立起来用指尖；有杂音=按在品丝后方贴近品丝；6 弦/5 弦的 × 怎么避开）。
5. **自检方法**：一根一根拨弦听，每根都要响得干净（arpeggiate 检查）。
6. 收尾过渡：和弦按住了，接下来让它们发出节奏。

- [ ] **步骤 3：构建验证**

运行：`npm run check && npm run build`
预期：无 error。

- [ ] **步骤 4：本地走查**

运行：`npm run dev`，打开 `/entries/guitar-setup` 与 `/entries/guitar-open-chords`。
预期：页面渲染正常；5 个和弦图形状与教材一致（Em 两个点在第 2 品、C 有 × 在 6 弦等）；ChordPlayer 点击出声；亮色/暗色模式下图与文字清晰。

- [ ] **步骤 5：Commit**

```bash
git add src/content/entries/guitar-setup.mdx src/content/entries/guitar-open-chords.mdx
git commit -m "feat(content): 吉他入门①②——持琴与调音+第一批开放和弦(Em/Am/C/G/D 和弦图)"
```

---

### 任务 4：吉他入门词条 ③ ④ ⑤（扫弦 + 和弦转换 + 第一首弹唱）

**文件：**

- 创建：`src/content/entries/guitar-strumming.mdx`
- 创建：`src/content/entries/guitar-chord-changes.mdx`
- 创建：`src/content/entries/guitar-first-song.mdx`

- [ ] **步骤 1：创建 `guitar-strumming.mdx`**

frontmatter：

```yaml
---
title: 扫弦与节奏型
titleEn: Strumming Patterns
category: 乐器
summary: 右手是吉他的发动机:下扫上扫怎么发力,4/4 最常用的节奏型怎么读怎么练,节拍器怎么配合。
tags: [乐器, 吉他, 入门, 节奏]
related: [guitar-open-chords, rhythm-and-time-signature, guitar-chord-changes]
order: 13
---
```

正文骨架：

1. 开头：右手决定律动，同一个和弦不同扫法完全是两首歌。
2. **发力**：手腕甩动为主、小臂跟随，拨片握法（拇指+食指侧面，露出尖端约 5mm），下扫用手腕「抖落水滴」的感觉。
3. **记法**：↓=下扫 ↑=上扫 ×或「空」=手继续摆动但不碰弦。正文用此记号写节奏型。
4. **三个节奏型递进**（每个用一行记号 + 一句练法）：
   - 入门：`↓ ↓ ↓ ↓`（每拍一下）
   - 进阶：`↓ × ↑ × ↓ ↑`
   - 流行万能型：`↓ ↓ ↑ × ↑ ↓ ↑`（4/4 两拍一组循环，大量华语流行伴奏就是它）
5. **节拍器配合**：插入 `<Metronome client:visible />`，练法：先 60 bpm 每拍一下，稳了再 70、80；手腕持续上下摆动像钟摆，「空」只是不碰弦而不是手停住。
6. 收尾过渡：右手会扫了，剩下的难关是左手换和弦的速度。

- [ ] **步骤 2：创建 `guitar-chord-changes.mdx`**

frontmatter：

```yaml
---
title: 和弦转换
titleEn: Chord Changes
category: 乐器
summary: 弹唱卡壳九成卡在换和弦:为什么慢、保留指与锚点指怎么用、Em→Am 与 C→G 的针对性练法。
tags: [乐器, 吉他, 入门, 和弦]
related: [guitar-open-chords, guitar-strumming, guitar-first-song]
order: 14
---
```

正文骨架：

1. 开头：换和弦慢的真相不是手慢，是手指「各自为政」——要一次成型而不是一根一根找。
2. **一次成型**：练习时先在空中摆好手型再落指；落指要同时。
3. **保留指**：两和弦间有同弦同品的手指不动。例：Am→C，1 指（2 弦 1 品）原地不动，只移 2、3 指。
4. **锚点指**：没有保留指时找一根「引导指」先落位。例：C→G 用 3-2-4 指法时，手型整体平移感强。
5. **两个针对性练习**：
   - Em→Am：只用 1 拍切换，节拍器 60 起，每组 1 分钟；插入 `<Metronome client:visible />`
   - C→G→C：用上文 G 的 3-2-4 指法体会手型平移。
6. **量化进步**：1 分钟内 Em↔Am 切换次数（初学 30 次及格、60 次良好），每天记个数。
7. 收尾过渡：左手右手都就位，下一步合起来弹唱一段。

- [ ] **步骤 3：创建 `guitar-first-song.mdx`**

frontmatter：

```yaml
---
title: 第一首弹唱
titleEn: Your First Song
category: 乐器
summary: 用 C、G、Am、F(可简化)四个和弦加一个节奏型,拼出完整的弹唱段落——这就是流行乐最常用的 I–V–vi–IV。
tags: [乐器, 吉他, 入门, 弹唱]
related: [guitar-chord-changes, pop-progressions, chord-progression]
order: 15
---
```

正文骨架：

1. 开头：弹唱 = 和弦进行 + 节奏型 + 嘴，今天只练前三样。
2. **进行**：C → G → Am → F，每和弦一小节（4 拍）。F 是大横按，入门替代方案：先用 Fmaj7（x 3 3 2 1 0），并点明 F 是后面「大横按」关卡的预告。插入两个 ChordDiagram（C 与 Fmaj7）+ ChordPlayer 听完整进行：
   `<ChordPlayer client:visible chords={[["C4", "E4", "G4"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"]]} label="C → G → Am → F,每和弦一拍听一遍。" />`
3. **节奏型**：套用任务 3 写的「流行万能型」`↓ ↓ ↑ × ↑ ↓ ↑`；先不唱、只扫；稳了跟节拍器 `<Metronome client:visible />`。
4. **拼段落**：给一个 8 小节结构示例：`| C | G | Am | F | C | G | F | C |`，说明这就是无数流行歌的骨架。
5. **点破乐理**：这四个和弦在 C 大调里是 I–V–vi–IV，链接 [流行经典进行](/entries/pop-progressions)——「你不是在学一首歌，是在学一个模板」。
6. 收尾：入门五步走完；想继续，下一关是大横按 F（中阶路线预告，不写链接——中阶路线尚不存在，只留文字）。

- [ ] **步骤 4：构建 + 走查**

运行：`npm run check && npm run build`，再 `npm run dev` 打开三篇词条逐页检查渲染与音频。
预期：无 error；节奏型记号在正文中清晰可读；ChordPlayer/Metronome 正常。

- [ ] **步骤 5：Commit**

```bash
git add src/content/entries/guitar-strumming.mdx src/content/entries/guitar-chord-changes.mdx src/content/entries/guitar-first-song.mdx
git commit -m "feat(content): 吉他入门③④⑤——扫弦节奏型+和弦转换+第一首弹唱(C-G-Am-F)"
```

---

### 任务 5：吉他入门路线 + guitar.mdx 导航

**文件：**

- 创建：`src/content/paths/guitar-intro.mdx`
- 修改：`src/content/entries/guitar.mdx`

- [ ] **步骤 1：创建 `src/content/paths/guitar-intro.mdx`**

```mdx
---
title: 吉他入门
description: 从持琴调音到弹唱第一段:5 步走完,你就能用四个和弦撑起一首歌。每一步都带能听、能跟练的组件。
steps: [guitar-setup, guitar-open-chords, guitar-strumming, guitar-chord-changes, guitar-first-song]
---

吉他是最容易「先出声」的乐器之一:五个开放和弦加一个节奏型,就能给一大半流行歌伴奏。这条路线把入门拆成 5 步——先把琴拿稳调准,再按出 Em、Am、C、G、D,然后让右手学会节奏,左手学会快速换和弦,最后把它们拼成第一段弹唱。每步建议练到「不用想也能做」再往下走,通常一步两三天到一周。
```

- [ ] **步骤 2：修改 `src/content/entries/guitar.mdx`**

两处改动：

a) frontmatter `related` 行改为：

```yaml
related: [guitar-tab, electric-guitar, bass, guitar-setup]
```

b) 文末最后一行（当前为「延伸:看 [六线谱 TAB](/entries/guitar-tab) 学读吉他谱;了解 [电吉他](/entries/electric-guitar) 和 [贝斯](/entries/bass)。」）替换为：

```mdx
想从零开始系统地学?走 [吉他入门](/paths/guitar-intro) 路线,从持琴调音一路练到第一首弹唱。读谱部分看 [六线谱 TAB](/entries/guitar-tab);家族其他成员看 [电吉他](/entries/electric-guitar) 和 [贝斯](/entries/bass)。
```

- [ ] **步骤 3：构建 + 走查**

运行：`npm run check && npm run build && npm run dev`
检查：`/paths/guitar-intro` 可访问，5 步导航完整、上一步/下一步按钮正确；`/entries/guitar` 文末出现路线链接。

- [ ] **步骤 4：Commit**

```bash
git add src/content/paths/guitar-intro.mdx src/content/entries/guitar.mdx
git commit -m "feat(paths): 吉他入门路线(5 步)+guitar 词条加路线导航"
```

---

### 任务 6：钢琴入门词条 ① ②（坐姿手型 + 键盘地图）

**文件：**

- 创建：`src/content/entries/piano-posture.mdx`
- 创建：`src/content/entries/piano-keyboard-map.mdx`

- [ ] **步骤 1：创建 `piano-posture.mdx`**

frontmatter：

```yaml
---
title: 坐姿、手型与指法编号
titleEn: Posture, Hand Shape & Finger Numbers
category: 乐器
summary: 钢琴的第 0 步:坐多远多高、手怎么摆、五根手指的编号 1-5。谱子上的指法数字读的就是这套编号。
tags: [乐器, 钢琴, 入门, 手型]
related: [piano, piano-keyboard-map]
order: 16
---
```

正文骨架：

1. 开头：钢琴谱上的数字 1-5 不是音,是手指——先认手指再认音。
2. **坐姿**：插图 `<img src="/images/piano-posture.svg" alt="钢琴坐姿侧视图" className="not-prose my-6 w-full max-w-md mx-auto rounded-xl border" />`；要点：坐琴凳前二分之一、双脚平放、背挺直、手肘约与键盘同高（琴凳高度调节的意义）、身体对准中央 C 附近（键盘中点偏右的 E-F 位置）。
3. **手型**：插图 `<img src="/images/piano-hand-shape.svg" alt="钢琴手型与指法编号" className="not-prose my-6 w-full max-w-md mx-auto rounded-xl border" />`；要点：手指自然弯曲如虚握球、指尖触键不是指肚、手腕与前臂大致水平不塌不拱。
4. **指法编号**：双手对称，拇指=1、食指=2、中指=3、无名指=4、小指=5；用一个简单表格列出；说明谱上「右手 1 指弹 C」这类标注的含义。
5. **常见坑**：折指（第一关节塌陷）、手腕塌、耸肩。
6. 收尾过渡：坐姿手型就位,下一步认识脚下这片键盘。

- [ ] **步骤 2：创建 `piano-keyboard-map.mdx`**

frontmatter：

```yaml
---
title: 键盘地图与找音
titleEn: Keyboard Map
category: 乐器
summary: 88 键看着吓人,其实只有 12 个音在循环:用两黑三黑的分组定位任何音,找到中央 C 你就有了坐标原点。
tags: [乐器, 钢琴, 入门, 键盘]
related: [piano-posture, pitch-and-note-names]
order: 17
---
```

正文骨架：

1. 开头：88 键 = 7 个多组「12 音循环」，先学会在一组里找音，全盘通用。
2. **黑键分组**：两黑一组、三黑一组交替；E-F、B-C 之间没有黑键（它们本来就是半音）。插入：
   `<Piano client:visible startOct={3} octaves={3} label="三个八度(C3–C6)。先找「两黑」组:它左边的白键是 C。" />`
3. **锚点找音法**：两黑左边的白键 = C；三黑左边的白键 = F。从 C 往右依次 D E F G A B。
4. **中央 C**：C4，88 键钢琴上大约在琴锁/logo 正下方，是左右手的分界坐标。可在组件说明里引导用户点它。
5. **八度**：同名音之间隔 12 个半音，听感「一样高但更亮/更低」；用组件点两个 C4/C5 对比。
6. 收尾过渡：会找音了,下一步让手指按顺序走一遍 C 大调。

- [ ] **步骤 3：构建 + 走查**

运行：`npm run check && npm run build && npm run dev`
检查：两篇页面渲染、两张插图显示正常（亮/暗模式）、Piano 组件可点按出声。

- [ ] **步骤 4：Commit**

```bash
git add src/content/entries/piano-posture.mdx src/content/entries/piano-keyboard-map.mdx
git commit -m "feat(content): 钢琴入门①②——坐姿手型与指法编号+键盘地图找音"
```

---

### 任务 7：钢琴入门词条 ③ ④ ⑤（音阶 + 双手 + 伴奏）

**文件：**

- 创建：`src/content/entries/piano-first-scale.mdx`
- 创建：`src/content/entries/piano-two-hands.mdx`
- 创建：`src/content/entries/piano-first-accompaniment.mdx`

- [ ] **步骤 1：创建 `piano-first-scale.mdx`**

frontmatter：

```yaml
---
title: 第一条音阶:C 大调
titleEn: First Scale: C Major
category: 乐器
summary: 全白键的 C 大调音阶是钢琴的第一条跑道:右手指法 1-2-3-1-2-3-4-5,练它顺便练了「穿指」这个核心动作。
tags: [乐器, 钢琴, 入门, 音阶]
related: [piano-keyboard-map, scale, piano-two-hands]
order: 18
---
```

正文骨架：

1. 开头：C 大调 = 全白键，结构「全全半全全全半」——E-F、B-C 两处天然是半音，所以不需要黑键。
2. **指法**：右手一个八度上行 1-2-3-1-2-3-4-5（C-D-E-F-G-A-B-C），下行反过来。为什么 3 指后是「穿指」（1 指从 3 指下方穿过到 F），这是钢琴指法的第一个核心动作。
3. **听与看**：
   `<Piano client:visible label="跟着键盘点一遍 C 大调:C D E F G A B C。" />`
   `<StaffNotation client:visible notes={["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]} label="C 大调音阶,上行一个八度。" />`
4. **练法**：先单手、极慢、每个音站稳再抬；穿指时手腕保持平稳不拱起；目标不是快而是均匀。
5. **常见坑**：4 指无力（天生弱指，单独多练）、手型弹着弹着塌掉。
6. 收尾过渡：一只手跑顺了,下一关是让两只手一起工作。

- [ ] **步骤 2：创建 `piano-two-hands.mdx`**

frontmatter：

```yaml
---
title: 双手协调入门
titleEn: First Two-Hand Steps
category: 乐器
summary: 钢琴最难也最迷人的一步——两只手同时干不同的事。从「左手长音+右手旋律」开始,把合手拆成可练的小动作。
tags: [乐器, 钢琴, 入门, 双手]
related: [piano-first-scale, piano-first-accompaniment]
order: 19
---
```

正文骨架：

1. 开头：合手不是「两只手各弹各的再拼起来」，而是大脑先建立一个「双手剧本」。
2. **第一个合手练习**：左手每 4 拍换一个长音（C2→G2→F2→C2），右手同时弹 C 大调音阶。给出逐拍对齐表（正文表格：拍号 1234 | 左手 C2 保持 | 右手 C D E F）。
3. `<Piano client:visible startOct={2} octaves={4} label="四个八度(C2–C6):左手在低音区按长音,右手在中音区走音阶。" />`
4. **练法三步**：先左手单独练到不用想 → 右手单独 → 极慢合手（节拍器 50-60 bpm），出错就退回单手。强调「慢到不会错」的速度才是练习速度。
5. **为什么难**：左右手节奏不同步时大脑会「串行处理」，练习的本质是把它练成「并行」——靠重复,不靠聪明。
6. 收尾过渡：双手能协作了,最后一步——用它们做出「伴奏感」。

- [ ] **步骤 3：创建 `piano-first-accompaniment.mdx`**

frontmatter：

```yaml
---
title: 简单伴奏入门
titleEn: First Accompaniment
category: 乐器
summary: 左手根音、右手和弦:C、F、G 三个和弦就能撑起一段伴奏。会了它,你已经能给简单的旋律配伴奏。
tags: [乐器, 钢琴, 入门, 伴奏, 和弦]
related: [piano-two-hands, chord, guitar-first-song]
order: 20
---
```

正文骨架：

1. 开头：钢琴伴奏的最小公式 = 左手弹根音 + 右手弹三和弦。
2. **三个和弦**（C 调的 I、IV、V 级）：C = C-E-G、F = F-A-C、G = G-B-D，右手位置都在中央 C 附近一个手掌内。
   `<ChordPlayer client:visible chords={[["C4", "E4", "G4"], ["F4", "A4", "C5"], ["G4", "B4", "D5"], ["C4", "E4", "G4"]]} label="C → F → G → C:左手根音 + 右手和弦的听感。" />`
   `<Piano client:visible label="试着在键盘上同时按下 C-E-G 三个键。" />`
3. **左手**：每个和弦换的时候，左手弹一次它的根音（C2/F2/G2），4 拍一换。
4. **合起来**：进行 `| C | F | G | C |`，左手根音每小节 1 拍（或 1、3 拍各一次），右手和弦落在第 1 拍。给出对齐表。
5. **升级预告**：右手分解（把和弦拆成 1-5-8 的分解音型）会让伴奏立刻「流动」起来——留给下一阶。
6. 收尾：入门五步走完——你已经会坐、会找音、会跑音阶、会合手、会伴奏骨架。

- [ ] **步骤 4：构建 + 走查**

运行：`npm run check && npm run build && npm run dev`
检查：三篇渲染正常；StaffNotation/Piano/ChordPlayer 出声；亮暗模式无异常。

- [ ] **步骤 5：Commit**

```bash
git add src/content/entries/piano-first-scale.mdx src/content/entries/piano-two-hands.mdx src/content/entries/piano-first-accompaniment.mdx
git commit -m "feat(content): 钢琴入门③④⑤——C 大调音阶+双手协调+简单伴奏(C-F-G)"
```

---

### 任务 8：钢琴入门路线 + piano.mdx 导航

**文件：**

- 创建：`src/content/paths/piano-intro.mdx`
- 修改：`src/content/entries/piano.mdx`

- [ ] **步骤 1：创建 `src/content/paths/piano-intro.mdx`**

```mdx
---
title: 钢琴入门
description: 从坐姿手型到第一次伴奏:5 步走完,你能双手弹出一段简单伴奏。每一步都带能点、能听的键盘组件。
steps:
  [piano-posture, piano-keyboard-map, piano-first-scale, piano-two-hands, piano-first-accompaniment]
---

钢琴是把乐理「摊开给你看」的乐器:音高、音程、和弦在键盘上都看得见摸得着。这条路线不急着弹曲子,先把地基打牢——坐对手型、认清 88 键、跑通第一条音阶、学会双手协作,最后用三个和弦做出第一段伴奏。出口标准不是「弹得多快」,而是「手知道自己在干什么」。每步建议练到不用想也能做再往下走。
```

- [ ] **步骤 2：修改 `src/content/entries/piano.mdx`**

两处改动：

a) frontmatter `related` 行改为：

```yaml
related: [staff-notation, scale, piano-posture]
```

b) 文末（当前最后一行为 `> 学音乐,钢琴几乎是最好的"可视化教具"。`）之后追加一段：

```mdx
想从零开始动手学?走 [钢琴入门](/paths/piano-intro) 路线——从坐姿手型到第一段伴奏,5 步走完。
```

- [ ] **步骤 3：构建 + 走查**

运行：`npm run check && npm run build && npm run dev`
检查：`/paths/piano-intro` 5 步导航完整；`/entries/piano` 文末出现路线链接。

- [ ] **步骤 4：Commit**

```bash
git add src/content/paths/piano-intro.mdx src/content/entries/piano.mdx
git commit -m "feat(paths): 钢琴入门路线(5 步)+piano 词条加路线导航"
```

---

### 任务 9：全站终验

**文件：** 无新增修改（发现问题才改）

- [ ] **步骤 1：全量静态检查与构建**

运行：`npm run check && npm run build`
预期：无 error、无 warning 级 schema 问题；pagefind 索引生成成功。

- [ ] **步骤 2：两条路线端到端走查**

运行：`npm run dev`，依次打开：

- `/paths/guitar-intro`：从第 1 步点到第 5 步，确认「上一步/下一步」链通、5 篇词条的组件全部渲染出声（ChordDiagram 5 图、ChordPlayer、Metronome、Fretboard、StaffNotation）
- `/paths/piano-intro`：同样走一遍（插图 2 张、Piano 组件 4 处、ChordPlayer 1 处、StaffNotation 1 处）
- 切换暗色模式重走一遍，确认 SVG 插图、和弦图、组件在暗色下清晰
- `/entries/guitar`、`/entries/piano` 确认新增导航存在且链接有效
- 首页搜索框搜「扫弦」「手型」，确认新词条被索引命中

- [ ] **步骤 3：对照规格验收标准逐条核对**

对照 `docs/superpowers/specs/2026-08-12-guitar-piano-intro-content-design.md` §11 的 6 条验收标准，逐条确认。

- [ ] **步骤 4：收尾 Commit（如有走查修复）**

```bash
git add -A
git commit -m "fix(content): 入门阶走查修复(如无可跳过此步)"
```

若步骤 2/3 未产生任何修改，跳过本步，以任务 8 的 commit 为最终状态。

---

## 计划自检记录

1. **规格覆盖度**：§3 产出清单 10 词条/2 路线/1 组件/3 插图/2 修改 → 任务 1-8 全覆盖；§9 规范 → 「组件调用约定」「关键事实基准」+ 各任务 frontmatter；§11 验收标准 → 任务 9。无遗漏。
2. **占位符扫描**：无 TODO/待定；所有代码块完整；正文部分给出 frontmatter、组件调用与逐节内容要点（正文行文由执行者按站点文风完成，属内容创作而非代码占位）。
3. **类型一致性**：ChordDiagram props（name/frets/fingers/baseFret/label）在任务 1 定义、任务 3 使用一致；组件 props 与代码库现有定义核对过（Piano startOct/octaves/label；ChordPlayer chords/label/desc；StaffNotation notes/label；Fretboard frets/label；Metronome 无 props）；order 编号 4-13 连续不冲突。
