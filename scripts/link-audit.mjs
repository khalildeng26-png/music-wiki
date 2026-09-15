#!/usr/bin/env node
// 全站「提及未挂链」审计
// 规则:thickening-standard.md v1.3/v1.4——族内成员提及必挂链,术语首现挂链
// 扫描正文(排除 frontmatter/import/代码块/JSX块/标题/已有链接),报告每个 (文件,目标词条) 的首次未挂链提及
// 用法:node scripts/link-audit.mjs [--verbose]

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "src/content/entries");
const verbose = process.argv.includes("--verbose");

// 1. 建立 标题→slug 映射
const files = readdirSync(DIR).filter((f) => f.endsWith(".mdx")).sort();
const titleMap = new Map(); // title -> slug
const slugTitle = new Map(); // slug -> title
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

// 别名(正文常见叫法 → 目标词条)
const ALIASES = new Map([
  ["R&B", "rnb"],
  ["R&B ", null], // 占位防误配
]);
titleMap.set("R&B", "rnb");

// 标题按长度降序,长词优先匹配(爵士乐 先于 爵士)
const sortedTitles = [...titleMap.keys()].sort((a, b) => b.length - a.length);

// 去 frontmatter,取正文
function body0(raw) {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

// 2. 逐文件扫描
const findings = []; // {file, line, title, slug, context}
const linkedStats = new Map(); // slug -> 被挂链次数

for (const f of files) {
  const slug = f.replace(/\.mdx$/, "");
  const selfTitle = slugTitle.get(slug);
  const raw = readFileSync(join(DIR, f), "utf8");

  // 本文件已挂链的目标集合(正文链接;frontmatter 的 related 不算)
  const linkedHere = new Set();
  for (const m of body0(raw).matchAll(/\[[^\]]*\]\(\/entries\/([a-z0-9-]+)\)/g)) {
    linkedHere.add(m[1]);
  }

  // 去 frontmatter
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

  const lines = body.split(/\r?\n/);
  const visible = []; // {text, line} 只保留可挂链的正文行
  let inFence = false;
  let inJsx = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^import\s/.test(line)) continue;
    // JSX 块:<大写组件 开起,/> 或 </X> 关闭
    if (!inJsx && /^\s*<[A-Z]/.test(line)) inJsx = true;
    if (inJsx) {
      if (/\/>\s*$/.test(line) || /<\/[A-Za-z]/.test(line)) inJsx = false;
      continue;
    }
    // 标题行不挂链
    if (/^#{1,6}\s/.test(line)) continue;
    visible.push({ text: line, line: ln });
  }

  // 统计已挂链
  for (const m of raw.matchAll(/\[[^\]]*\]\(\/entries\/([a-z0-9-]+)\)/g)) {
    linkedStats.set(m[1], (linkedStats.get(m[1]) || 0) + 1);
  }

  // 每个目标:正文提及且通篇零挂链,才报(报首次提及位置作为修复点)
  const seen = new Set();
  for (const { text, line } of visible) {
    // 屏蔽已有 markdown 链接的整体
    const masked = text.replace(/\[[^\]]*\]\([^)]*\)/g, "▓");
    let i = 0;
    while (i < masked.length) {
      let hit = null;
      for (const t of sortedTitles) {
        if (t === selfTitle) continue;
        if (masked.startsWith(t, i)) {
          hit = t;
          break;
        }
      }
      if (hit) {
        i += hit.length;
        if (!seen.has(hit)) {
          seen.add(hit);
          if (!linkedHere.has(titleMap.get(hit))) {
            findings.push({
              file: f,
              line: line,
              title: hit,
              slug: titleMap.get(hit),
              context: text.trim().slice(0, 90),
            });
          }
        }
      } else {
        i++;
      }
    }
  }
}

// 3. 输出
const byFile = new Map();
for (const fd of findings) {
  if (!byFile.has(fd.file)) byFile.set(fd.file, []);
  byFile.get(fd.file).push(fd);
}

console.log(`词条总数: ${files.length},标题数: ${titleMap.size}`);
console.log(`含未挂链提及的文件: ${byFile.size},总提及点(每文件每目标首次): ${findings.length}\n`);

for (const [f, list] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`■ ${f} (${list.length})`);
  for (const fd of list) {
    console.log(`  L${fd.line} ${fd.title} → /entries/${fd.slug}`);
    if (verbose) console.log(`      …${fd.context}`);
  }
}

// 无词条的高频概念(供待建清单)——仅 verbose 时提示交叉核对
if (verbose) {
  console.log("\n—— 被挂链最多的目标(前 20) ——");
  for (const [s, n] of [...linkedStats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${slugTitle.get(s) || s}(/entries/${s}): ${n}`);
  }
}
