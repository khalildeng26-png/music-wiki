#!/usr/bin/env node
// 「提及未挂链」修复:按审计判定规则批量挂链
// 判定依据 thickening-standard.md v1.3/v1.4:族内成员提及必挂链、首现挂链;
// 顺带用法(泛指词/复合词/错位目标)跳过。

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "src/content/entries");
const DRY = process.argv.includes("--dry");

// ---------- 判定规则 ----------
const SKIP_ALL = new Set(["转调", "共鸣"]);

const SKIP = {
  "guitar.mdx": ["速度", "第一首弹唱"],
  "jazz.mdx": ["流行", "速度"],
  "guofeng.mdx": ["古典"],
  "harmonica.mdx": ["颤音"],
  "harmonica-setup.mdx": ["颤音"],
  "orchestra.mdx": ["速度"],
  "bass-eighth-groove.mdx": ["速度"],
  "bass-scale-fifths.mdx": ["速度"],
  "slash-chords.mdx": ["速度"],
  "guitar-strumming.mdx": ["速度"],
  "drums.mdx": ["速度"],
  "hiphop.mdx": ["速度"],
  "guitar-open-chords.mdx": ["速度"],
  "guitar-chord-changes.mdx": ["速度"],
  "jianpu.mdx": ["速度"],
  "intervals-flavor.mdx": ["速度"],
  "piano-posture.mdx": ["速度"],
  "reggae.mdx": ["速度"],
  "ukulele-chord-changes.mdx": ["速度"],
  "ukulele-open-chords.mdx": ["速度"],
  "vibrato.mdx": ["速度"],
  "live-singing.mdx": ["速度"],
  "piano.mdx": ["速度"],
  "piano-keyboard-map.mdx": ["速度"],
  "piano-two-hands.mdx": ["速度"],
  "piano-first-scale.mdx": ["速度", "第一首曲子"],
  "dynamics-and-articulation.mdx": ["速度"],
  "guzheng.mdx": ["流行", "速度"],
  "pipa.mdx": ["流行"],
  "folk.mdx": ["和弦转换"],
  "blues.mdx": ["乡村"],
  "celtic.mdx": ["乡村"],
  "rock.mdx": ["速度"],
  "secondary-dominants.mdx": ["小号"],
  "clarinet.mdx": ["流行"],
  "french-horn.mdx": ["古典"],
  "trumpet.mdx": ["古典"],
  "erhu.mdx": ["小提琴"],
  "overtone-series.mdx": ["音程"],
  "chord-substitution.mdx": ["和弦"],
  "borrowed-chords.mdx": ["和弦替换"],
};

// 速度仅在这些文件挂链(参数性讨论,含 BPM/速度区间/误区正面对比)
const SPEED_LINK = new Set([
  "waltz", "disco", "electronic", "rhythm-and-time-signature", "march",
  "note-values", "classical", "scale", "key-and-mode", "rnb", "chord",
  "funk", "bluegrass", "bossa-nova",
]);

// 复合词掩蔽:先掩蔽这些串,再匹配标题,避免“属七和弦”误挂“和弦”
const MASKS = {
  "和弦": ["三和弦", "属和弦", "主和弦", "下属和弦", "副属和弦", "强力和弦", "斜杠和弦", "借用和弦", "顺阶和弦", "延伸和弦", "和弦外音", "和弦内音", "分解和弦", "和弦进行", "和弦转换", "和弦标记", "和弦替换", "和弦版", "和弦图", "七和弦", "九和弦", "导和弦", "替代和弦", "离调和弦", "爵士和弦", "蓝调和弦", "开放和弦", "封闭和弦", "拿坡里和弦", "主属和弦", "属七和弦", "大七和弦", "小七和弦", "减七和弦", "半减七和弦", "大三和弦", "小三和弦"],
  "七和弦": ["属七和弦", "大七和弦", "小七和弦", "减七和弦", "半减七和弦", "七和弦进行"],
  "和弦进行": ["四和弦进行", "七和弦进行", "三和弦进行"],
  "音阶": ["半音阶", "全音阶"],
  "长号": ["延长号"],
  "进行曲": ["婚礼进行曲", "进行曲之王", "拉科齐进行曲", "凯旋进行曲"],
  "钢琴": ["钢琴谱", "钢琴曲集", "钢琴缩编谱", "钢琴师", "钢琴音色"],
  "箫": ["笛箫", "箫鼓"],
  "长笛": ["长笛赋"],
  "颤音": ["唇颤音"],
  "流行": ["流行于"],
  "速度": ["气流速度"],
  "古典": ["古典跨界"],
  "管弦乐队": ["民族管弦乐团"],
  "吉他": ["节奏吉他"],
  "贝斯": ["贝斯线"],
};

// 曲风标题后接 乐/音乐 时一并入链文本(爵士乐/流行音乐),乐器除外
const EXTEND = new Set(["流行", "爵士", "摇滚"]);

// ---------- 扫描(与 link-audit 一致) ----------
const files = readdirSync(DIR).filter((f) => f.endsWith(".mdx")).sort();
const titleMap = new Map();
const slugTitle = new Map();
for (const f of files) {
  const slug = f.replace(/\.mdx$/, "");
  const raw = readFileSync(join(DIR, f), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  const tm = m[1].match(/^title:\s*(.+)$/m);
  if (!tm) continue;
  let title = tm[1].trim();
  if (title.startsWith('"') && title.endsWith('"')) title = title.slice(1, -1);
  titleMap.set(title, slug);
  slugTitle.set(slug, title);
}
const sortedTitles = [...titleMap.keys()].sort((a, b) => b.length - a.length);

function visibleLines(body) {
  const lines = body.split(/\r?\n/);
  const out = [];
  let inFence = false;
  let inJsx = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^import\s/.test(line)) continue;
    if (!inJsx && /^\s*<[A-Z]/.test(line)) inJsx = true;
    if (inJsx) {
      if (/\/>\s*$/.test(line) || /<\/[A-Za-z]/.test(line)) inJsx = false;
      continue;
    }
    if (/^#{1,6}\s/.test(line)) continue;
    out.push({ text: line, idx: i });
  }
  return out;
}

// 行内保护区:已有链接与行内代码
function protectedSpans(text) {
  const spans = [];
  for (const m of text.matchAll(/\[[^\]]*\]\([^)]*\)/g)) spans.push([m.index, m.index + m[0].length]);
  for (const m of text.matchAll(/`[^`]*`/g)) spans.push([m.index, m.index + m[0].length]);
  return spans;
}

// 在单个可体行中找标题的可挂链出现位置(避开保护区与复合词)
function findOccurrence(text, title, spans, masks) {
  const blocked = [...spans];
  for (const mk of masks) {
    let from = 0;
    while (true) {
      const p = text.indexOf(mk, from);
      if (p < 0) break;
      blocked.push([p, p + mk.length]);
      from = p + mk.length;
    }
  }
  let from = 0;
  while (true) {
    const p = text.indexOf(title, from);
    if (p < 0) return -1;
    const end = p + title.length;
    const inBlock = blocked.some(([s, e]) => p < e && end > s);
    if (!inBlock) return p;
    from = p + 1;
  }
}

let linked = 0;
const skipped = [];
const manual = [];

for (const f of files) {
  const slug = f.replace(/\.mdx$/, "");
  const selfTitle = slugTitle.get(slug);
  const raw = readFileSync(join(DIR, f), "utf8");
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fmLines = fm ? fm[0].split(/\r?\n/).length : 0;
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const lines = body.split(/\r?\n/);
  const vis = visibleLines(body);

  const linkedHere = new Set();
  for (const m of body.matchAll(/\[[^\]]*\]\(\/entries\/([a-z0-9-]+)\)/g)) linkedHere.add(m[1]);

  const targets = new Map(); // title -> {done, slug}
  for (const { text } of vis) {
    const masked = text.replace(/\[[^\]]*\]\([^)]*\)/g, "▓");
    let i = 0;
    while (i < masked.length) {
      let hit = null;
      for (const t of sortedTitles) {
        if (t === selfTitle) continue;
        if (masked.startsWith(t, i)) { hit = t; break; }
      }
      if (hit) {
        i += hit.length;
        if (!targets.has(hit)) {
          targets.set(hit, { done: linkedHere.has(titleMap.get(hit)), slug: titleMap.get(hit) });
        }
      } else i++;
    }
  }

  for (const [title, st] of targets) {
    if (st.done) continue;
    const reason = [];
    if (SKIP_ALL.has(title)) reason.push("全局跳过");
    if ((SKIP[f] || []).includes(title)) reason.push("文件级跳过");
    if (title === "速度" && !SPEED_LINK.has(slug)) reason.push("速度非白名单");
    if (reason.length) { skipped.push(`${f}: ${title} (${reason.join("/")})`); continue; }

    const masks = MASKS[title] || [];
    let applied = false;
    for (const { idx } of vis) {
      const text = lines[idx];
      const spans = protectedSpans(text);
      const p = findOccurrence(text, title, spans, masks);
      if (p < 0) continue;
      let end = p + title.length;
      if (EXTEND.has(title)) {
        if (text.startsWith("音乐", end)) end += 2;
        else if (text.startsWith("乐", end) && !text.startsWith("乐器", end)) end += 1;
      }
      const linkedText = text.slice(p, end);
      lines[idx] = text.slice(0, p) + `[${linkedText}](/entries/${st.slug})` + text.slice(end);
      applied = true;
      linked++;
      break;
    }
    if (!applied) manual.push(`${f}: ${title} (无可挂链位置)`);
  }

  if (!DRY) {
    const out = raw.slice(0, raw.length - body.length) + lines.join("\n");
    writeFileSync(join(DIR, f), out);
  }
}

console.log(`挂链: ${linked},跳过: ${skipped.length},需手动: ${manual.length}`);
if (manual.length) { console.log("\n—— 需手动处理 ——"); for (const m of manual) console.log("  " + m); }
if (DRY) console.log("(dry run,未写入)");
