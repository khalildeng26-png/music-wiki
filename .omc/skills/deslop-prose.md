---
name: deslop-prose
description: 去除 music-wiki 词条的 AI 腔(de-AI-ify)。按 DESIGN.md §10 文风规范重写条目正文,保留交互组件与 frontmatter 元数据,改完构建验证再部署。
triggers:
  - deslop prose
  - 去AI味
  - 重写词条
  - 文风重写
  - 词条像AI
---

# Deslop Prose(橙月Wiki 词条去 AI 腔)

适用:用户说词条"一看就是 AI 写的"、要求批量/单篇重写文风时。
不适用:新增词条(新写时直接遵守规范即可,不用走重写流程)、纯事实纠错。

## 权威依据

文风规范以 `DESIGN.md §10「文风规范(去 AI 味)」` 为准(7 条)。本文件是执行流程,规范本身只在 DESIGN.md 维护,两边冲突时以 DESIGN.md 为准。

## 重写清单(逐篇执行)

1. **保元数据**:frontmatter 的 title/category/summary/tags/related/order 不动(summary 允许随文风微调,但字段必须在)。
2. **保组件**:`ChordPlayer` / `EarTrainer` / `StaffNotation` / `Metronome` / `NoteDemo` / `Piano` / `Fretboard` / `RhythmTap` 等交互组件**原样保留**(含 props、位置语义)。这是产品核心,不是"slop"。
3. **保链接**:`[文字](/entries/xxx)` 只允许改措辞,不允许改 slug;重写后 grep 检查链接目标文件存在。
4. **保事实**:数字(半音数、弦数、键数、年代)不改;不确定就查 DESIGN.md §10 的「已核对事实清单」。
5. **去 AI 味七条**(摘要,详见 DESIGN.md):
   - 加粗 ≤3 处,不做语气强调;
   - 打破"定义→分点→金句→延伸"四段模板,开头可用场景/误解/例子;
   - 每篇至少 1 个可核实的具体信息(曲名/数字/年份/人名);
   - 比喻 ≤1 个且必须承载信息;
   - 长短句混用,删"可以说/本质上/其实"空词,禁止连续排比;
   - 允许写观点与避坑;
   - "延伸:见XX"揉进正文或直接收尾,删金句引用框。
6. **字数**:重写后长度控制在原文 70%–110%,不许为去味而砍信息。

## 高危坑(曾经踩过的构建错误)

- **frontmatter summary 带直引号**(`summary: "临时借用…":…`)会让 js-yaml 解析失败,构建报 `generateError`。summary 里引用一律用「」。
- **MDX 属性里的直引号**(如 `desc="…的"光泽感"…"`)破坏 JSX 解析,属性内引用用「」。
- 音名变音记号在组件 props 里用 ASCII:`G#3` 不要 `G♯3`(noteUtils 只识别 `#`/`b`)。

## 完成门槛

1. `export PATH="/c/Users/admin/node22:$PATH" && npm run build` 通过(pagefind Indexed 页数不减少)。
2. 逐篇自查清单 1–6。
3. 部署:`bash deploy/deploy-server.sh 47.108.214.184 admin` + `npx wrangler pages deploy dist --project-name music-wiki --branch main --commit-dirty=true`。
4. commit 信息格式:`style(content): 文风重写——<范围>`。

## 批量节奏建议

- 每批 5–8 篇(一个分类或主题聚类),批与批之间部署一次,避免一次改太多难以回滚。
- 用户已确认的样本(新版):vibrato、guzheng、suspended-and-added——拿它们当风格基准线。
