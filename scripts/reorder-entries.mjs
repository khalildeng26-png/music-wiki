// order 顺延(修正版):一次性算出每个分类的最终顺序再写回,避免多次插值造成跳号。
// 规则:新词条插到指定锚点之后,同分类其余词条保持相对次序依次后移。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ENT = 'E:/Project/music-wiki/src/content/entries';

/** 插入计划:[分类, 锚点slug, 新词条slug]
 *  弓弦家族:大提琴/中提琴紧跟小提琴(音高序:小提琴 > 中提琴 > 大提琴)
 *  单簧管族:萨克斯紧跟单簧管 */
const PLAN = [
  ['乐器', 'violin', 'cello'],
  ['乐器', 'violin', 'viola'],
  ['乐器', 'clarinet', 'saxophone'],
  ['曲风', 'punk', 'metal'],
];

const files = readdirSync(ENT).filter((f) => f.endsWith('.mdx'));
const docs = files.map((f) => {
  const src = readFileSync(join(ENT, f), 'utf8');
  return {
    file: f,
    category: src.match(/^category: (.+)$/m)?.[1]?.trim() || '',
    order: parseFloat(src.match(/^order: ([\d.]+)$/m)?.[1] || '0'),
    src,
  };
});

for (const [category, afterSlug, insertSlug] of PLAN) {
  const cat = docs.filter((d) => d.category === category).sort((a, b) => a.order - b.order);
  const anchorIdx = cat.findIndex((d) => d.file === `${afterSlug}.mdx`);
  const insertIdx = cat.findIndex((d) => d.file === `${insertSlug}.mdx`);
  if (anchorIdx < 0) throw new Error(`锚点不存在: ${category}/${afterSlug}`);
  if (insertIdx < 0) throw new Error(`待插入不存在: ${insertSlug}`);
  // 取出待插入项,插到锚点后(同批多次插入时,后插的排在先插的前面,故用 anchorIdx+1 递增)
  const moved = cat.splice(insertIdx, 1)[0];
  const newIdx = cat.findIndex((d) => d.file === `${afterSlug}.mdx`) + 1;
  cat.splice(newIdx, 0, moved);
  // 写回连续 order(保留小数位特性:记谱分类不在 PLAN 里,不受影响)
  cat.forEach((d, i) => {
    d.order = i + 1;
  });
}

// 校验:分类内唯一 + 连续
const byCat = {};
for (const d of docs) (byCat[d.category] ||= []).push(d);
let bad = 0;
for (const [cat, list] of Object.entries(byCat)) {
  const orders = list.map((d) => d.order).sort((a, b) => a - b);
  const dup = orders.filter((o, i) => i > 0 && o === orders[i - 1]);
  if (dup.length) {
    console.log(`❌ ${cat}: order 重复 ${dup.join(',')}`);
    bad++;
    continue;
  }
  const isInt = orders.every((o) => Number.isInteger(o));
  if (isInt) {
    const expected = orders.map((_, i) => i + 1);
    if (orders.join(',') !== expected.join(',')) {
      console.log(`❌ ${cat}: order 不连续`);
      bad++;
      continue;
    }
  }
  console.log(`✓ ${cat}: ${list.length} 篇,order 唯一${isInt ? '且连续' : '(含小数)'}`);
}

// 写回
let changed = 0;
for (const d of docs) {
  const next = d.src.replace(/^order: [\d.]+$/m, `order: ${d.order}`);
  if (next !== d.src) {
    writeFileSync(join(ENT, d.file), next);
    changed++;
  }
}
console.log(`\n改动 ${changed} 个文件`);
for (const cat of ['乐器', '曲风']) {
  const list = byCat[cat].sort((a, b) => a.order - b.order);
  console.log(`\n${cat}:`);
  console.log(list.map((d) => `${d.order}:${d.file.replace('.mdx', '')}`).join('  '));
}
process.exit(bad ? 1 : 0);
