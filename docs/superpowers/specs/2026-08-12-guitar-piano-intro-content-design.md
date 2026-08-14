# 橙月 Wiki 内容扩充：吉他与钢琴「入门阶」设计

- **日期**: 2026-08-12
- **状态**: 已获用户批准，待进入实现计划
- **范围**: 仅覆盖「入门阶」；吉他/钢琴的中阶、高阶是后续批次，不在本规格内

## 1. 背景与目标

橙月 Wiki 的乐器类内容目前偏「介绍」：`guitar.mdx`（含定弦、指板、技法概览）与 `piano.mdx`（键盘布局与学习价值）各一篇，没有从低阶到高阶的系统学习内容。吉他相关的辅助词条只有六线谱（`guitar-tab`）与电吉他（`electric-guitar`），钢琴无任何练习类词条。

本次扩充目标：**为吉他与钢琴各建立一条「入门」学习路线**，让用户能按步骤从零基础走到「能弹一点东西」。

内容形态沿用站点现有架构：词条（`src/content/entries/*.mdx`）+ 学习路线（`src/content/paths/*.mdx`，frontmatter `steps` 串联词条）。

## 2. 总体结构决策

| 决策点       | 结论                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 内容形态     | 学习路线式（仿「和声入门→和声进阶」），不加深现有单页、不做散词条                                                               |
| 阶段切分     | 初 / 中 / 高三阶；本规格只做**入门阶**                                                                                          |
| 推进策略     | 先把钢琴+吉他的入门阶跑通，验证结构与组件复用后再复制中/高阶                                                                    |
| 互动组件     | 能用现有组件就用现有组件（Piano / Fretboard / StaffNotation / ChordPlayer / Metronome / RhythmTap），仅新增 1 个 `ChordDiagram` |
| 抽象概念配图 | 手绘线条 SVG（坐姿、手型、持琴），不用 AI 生成图                                                                                |
| 和弦图       | 做成可复用组件 `ChordDiagram`（内部渲染 SVG），中高阶吉他词条可复用                                                             |

## 3. 产出清单

| 类型     | 数量  | 明细                                          |
| -------- | ----- | --------------------------------------------- |
| 新词条   | 10 篇 | 吉他 5 + 钢琴 5（见 §4、§5）                  |
| 新路线   | 2 条  | `guitar-intro`、`piano-intro`                 |
| 新组件   | 1 个  | `src/components/interactive/ChordDiagram.tsx` |
| 插图     | 3 张  | `public/images/` 下 3 个手绘线条 SVG（§7）    |
| 修改现有 | 2 篇  | `guitar.mdx`、`piano.mdx` 文末加入门路线导航  |

## 4. 吉他入门路线 `guitar-intro`

**frontmatter**:

```yaml
title: 吉他入门
description: 从持琴调音到弹唱第一段:5 步走完,你就能用四个和弦撑起一首歌。
steps: [guitar-setup, guitar-open-chords, guitar-strumming, guitar-chord-changes, guitar-first-song]
```

**5 个步骤（词条）**:

| #   | slug                   | title          | 核心内容                                                                   | 互动组件 / 插图                                            |
| --- | ---------------------- | -------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | `guitar-setup`         | 持琴与调音     | 坐姿/站姿、琴体摆放、标准调弦 EADGBE（6→1 弦）、调音器用法                 | 📷持琴坐姿图；`StaffNotation`（E2–E4 六空弦）、`Fretboard` |
| 2   | `guitar-open-chords`   | 第一批开放和弦 | Em→Am→C→G→D 按手指难度递进逐个攻克;按法与常见错误                          | `ChordDiagram`×5 + `ChordPlayer`                           |
| 3   | `guitar-strumming`     | 扫弦与节奏型   | 下扫/上扫、4/4 经典节奏型（下 下上 空上 下上）、行内扫弦箭头记法           | `Metronome`                                                |
| 4   | `guitar-chord-changes` | 和弦转换       | 转换慢的根源、保留指/锚点指、Em→Am 与 C→G 的针对性练法                     | `Metronome`                                                |
| 5   | `guitar-first-song`    | 第一首弹唱     | 用 C–G–Am–F + 节奏型拼出完整段落;关联 I–V–vi–IV（呼应 `pop-progressions`） | `ChordPlayer`                                              |

## 5. 钢琴入门路线 `piano-intro`

**frontmatter**:

```yaml
title: 钢琴入门
description: 从坐姿手型到第一次伴奏:5 步走完,你能双手弹出一段简单伴奏。
steps:
  [piano-posture, piano-keyboard-map, piano-first-scale, piano-two-hands, piano-first-accompaniment]
```

**5 个步骤（词条）**:

| #   | slug                        | title                | 核心内容                                             | 互动组件 / 插图                  |
| --- | --------------------------- | -------------------- | ---------------------------------------------------- | -------------------------------- |
| 1   | `piano-posture`             | 坐姿、手型与指法编号 | 琴凳位置、手臂高度、1–5 指编号、手型                 | 📷坐姿侧视图 + 📷手型图          |
| 2   | `piano-keyboard-map`        | 键盘地图与找音       | 两黑三黑分组定位、八度循环、中央 C 的位置            | `Piano`（startOct=3, octaves=3） |
| 3   | `piano-first-scale`         | 第一条音阶:C 大调    | 右手指法 123-12345、一个八度上下行、为什么用这个指法 | `Piano` + `StaffNotation`        |
| 4   | `piano-two-hands`           | 双手协调入门         | 左手长音 + 右手旋律的第一次合手、拆分慢练方法        | `Piano`                          |
| 5   | `piano-first-accompaniment` | 简单伴奏入门         | 左手根音 + 右手和弦,C–F–G 三和弦撑起伴奏             | `ChordPlayer` + `Piano`          |

## 6. 新组件:`ChordDiagram`

**路径**: `src/components/interactive/ChordDiagram.tsx`（与 ChordPlayer 同目录、同视觉风格）

**职责**: 渲染标准吉他和弦指法图（SVG）。竖线 = 弦（6→1 从左到右），横线 = 品丝，圆点 = 按弦位置，顶部标记 O（空弦）/ ×（不弹）。

**Props**:

```ts
type Props = {
  name: string; // 显示名,如 "Em"
  frets: number[]; // 长度 6,6 弦→1 弦的按品数,-1 = ×(不弹),0 = O(空弦)
  fingers?: number[]; // 可选,1-4 指编号标在圆点内
  baseFret?: number; // 起始品,默认 1;高把位时左上角显示 "3fr"
  label?: string; // figure 说明文字(与现有组件 caption 风格一致)
};
```

**实现约束**:

- 纯 SVG + CSS（跟随现有组件的 `figure/figcaption` 外壳与配色 token），不引入新依赖
- 客户端渲染（`client:visible`），但 SVG 本身无音频交互，轻量
- 中高阶吉他词条（大横按、七和弦）可直接复用

## 7. 插图:3 张手绘线条 SVG

**路径**: `public/images/`，命名与词条 slug 对应；风格统一为**简笔线条 + 少量琥珀色强调**（呼应站点主题）。因 SVG 经 `<img>` 引用、页面 CSS 变量不透传，颜色写死：线条 `#a1a1aa`、强调 `#d97706`——两色在亮暗模式下均清晰。线宽分层：主线稿 2~2.5，细节/参考线 1，琴颈 5。

| 文件                       | 用途            | 画面要点                                      |
| -------------------------- | --------------- | --------------------------------------------- |
| `piano-posture.svg`        | `piano-posture` | 坐姿侧视图:琴凳高度、手臂与琴键平行、背部直立 |
| `piano-hand-shape.svg`     | `piano-posture` | 手型:手指弯曲如握球、1–5 指编号、手腕不塌     |
| `guitar-setup-posture.svg` | `guitar-setup`  | 吉他持琴坐姿:琴体凹口搭右腿、琴颈略上扬       |

## 8. 现有词条修改

- `guitar.mdx`: 文末「延伸」处增加一句导航 → 「想从零开始学?走[吉他入门](/paths/guitar-intro)」；`related` 补充 `guitar-setup`
- `piano.mdx`: 同上 → `[钢琴入门](/paths/piano-intro)`；`related` 补充 `piano-posture`
- 不改动正文结构与既有内容

## 9. 规范与约束

- **词条 frontmatter** 遵循现有格式: `title / titleEn / category / summary / tags / related / order`；乐器类 `category: 乐器`；`order` 在「乐器」分类内续接现有最大值递增（该分类现有 piano=1 至 synthesizer=10，新词条从 11 起按路线步骤顺序排列：吉他入门 5 篇 11-15，钢琴入门 5 篇 16-20）
- **路线 frontmatter**: `title / description / steps`（与现有 paths 一致）
- **乐理事实** 以 DESIGN.md「已核对的低风险事实清单」为准（定弦 EADGBE、指法编号、大调音阶结构等）
- **文风规范**（DESIGN.md 中标注「暂缓」）不强制执行，不套用四段模板
- 不新增音频组件逻辑；音频全部走现有 `playNote` / 各组件既有实现

## 10. 范围外（明确不做）

- 吉他/钢琴的**中阶、高阶**词条与路线（后续批次）
- 古典吉他（尼龙弦）与贝斯的专门路线
- 真人照片、AI 生成图
- 视频内容、音频练习跟练的新机制

## 11. 验收标准

1. `npm run build` 通过，无 TS / 集合 schema 报错
2. `/paths/guitar-intro` 与 `/paths/piano-intro` 可访问，上一步/下一步导航完整
3. 10 篇词条均含 frontmatter、正文、互动组件（按 §4 §5 表格）
4. `ChordDiagram` 渲染 5 个和弦图与标准教材一致（Em/Am/C/G/D 按法正确）
5. 3 张 SVG 插图在亮/暗色模式下均清晰可辨
6. `guitar.mdx` / `piano.mdx` 出现入门路线导航链接
