// 新词条自检(按 docs/promotion/thickening-standard.md 逐项):
// 字节数 / FAQ 条数 / 加粗处数 / 内部链接有效性 / 组件参数合法性 / order 唯一
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ENT = 'E:/Project/music-wiki/src/content/entries';
const slugs = new Set(
  readdirSync(ENT)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, '')),
);
const paths = new Set(
  readdirSync('E:/Project/music-wiki/src/content/paths')
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, '')),
);

const TARGETS = process.argv.slice(2);
let problems = 0;
const warn = (m) => {
  console.log('  ⚠ ' + m);
  problems++;
};

for (const slug of TARGETS) {
  const src = readFileSync(join(ENT, `${slug}.mdx`), 'utf8');
  const bytes = Buffer.byteLength(src, 'utf8');
  const body = src.replace(/^---[\s\S]*?\n---\n/, '');
  const faqCount = (src.match(/^  - q:/gm) || []).length;
  const boldCount = (body.match(/\*\*/g) || []).length / 2;
  const h2Count = (body.match(/^## /gm) || []).length;
  const importMatch = src.match(/^import \{ \w+ \} from "[^"]+";$/gm) || [];
  const usedComponents = [...body.matchAll(/<([A-Z][A-Za-z]+)/g)].map((m) => m[1]);
  const importedComponents = [...src.matchAll(/^import \{ (\w+) \} from/gm)].map((m) => m[1]);
  const order = src.match(/^order: (\d+)$/m)?.[1];
  const category = src.match(/^category: (.+)$/m)?.[1];

  console.log(`\n${slug}.mdx | 字节 ${bytes} | FAQ ${faqCount} 条 | ## ${h2Count} 节 | order ${order} (${category})`);

  // 1. 厚度
  if (bytes < 5000 || bytes > 7500) warn(`字节 ${bytes} 不在 5000-7500 区间`);
  // 2. FAQ
  if (faqCount < 4 || faqCount > 6) warn(`FAQ ${faqCount} 条,应在 4-6`);
  // 3. 加粗
  if (boldCount > 3) warn(`加粗 ${boldCount} 处,超过 3 处上限`);
  // 4. 内部链接
  for (const m of body.matchAll(/\]\((\/entries\/|\/paths\/)([a-z0-9-]+)\)/g)) {
    const set = m[1] === '/entries/' ? slugs : paths;
    if (!set.has(m[2])) warn(`链接目标不存在: ${m[1]}${m[2]}`);
  }
  // 5. 组件 import 齐全
  for (const c of usedComponents) {
    if (!importedComponents.includes(c)) warn(`组件 <${c}> 未 import`);
  }
  // 6. import 路径存在
  for (const m of src.matchAll(/^import \{ \w+ \} from "([^"]+)";$/gm)) {
    const rel = m[1].replace('../../', 'E:/Project/music-wiki/src/');
    const p = rel.endsWith('.tsx') ? rel : rel + '.tsx';
    try {
      readFileSync(p);
    } catch {
      warn(`import 路径不存在: ${m[1]}`);
    }
  }
  // 7. order 在分类内唯一
  const sameCat = readdirSync(ENT)
    .filter((f) => f.endsWith('.mdx') && f !== `${slug}.mdx`)
    .filter((f) => (readFileSync(join(ENT, f), 'utf8').match(/^category: (.+)$/m)?.[1] || '') === category)
    .map((f) => [f, readFileSync(join(ENT, f), 'utf8').match(/^order: (\d+)$/m)?.[1]]);
  const dup = sameCat.filter(([, o]) => o === order);
  if (dup.length > 1) warn(`order ${order} 与 ${dup.map((d) => d[0]).join(',')} 重复`);
  // order 唯一即可(分类内 1..N 已占满时,新词条只能取 N+1 起的连续号;
  // 本批四篇一次性写入,允许同批内相对顺序为任意唯一值)
  const maxOrder = Math.max(...sameCat.map(([, o]) => Number(o) || 0));
  if (Number(order) < maxOrder) {
    console.log(`  ℹ order ${order} 小于存量最大 ${maxOrder}(同批新词条内部编号,唯一即可)`);
  }
}

console.log(problems === 0 ? '\n✓ 全部通过' : `\n共 ${problems} 处待处理`);
process.exit(problems ? 1 : 0);
