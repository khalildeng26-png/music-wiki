import { spawn } from "node:child_process";
// OG 分享卡生成:起 astro dev 渲染 /og/[slug] 模板 → 无头浏览器截图 1200×630 → public/og/*.png
// 按内容哈希缓存:只有标题/摘要等变化的词条才重新截图。部署脚本会在构建前调用。
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  "..",
);
const OUT_DIR = path.join(ROOT, "public", "og");
const CACHE = path.join(ROOT, "scripts", "_og-cache.json");
const TEMPLATE_VER = "v1"; // 模板改版时递增,触发全量重截
const PORT = 4399;

// ---- 收集目标与内容哈希(直接读 frontmatter,无需起服务器) ----
function fm(file) {
  const text = readFileSync(file, "utf8");
  const get = (k) =>
    text.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1]?.replace(/^["']|["']$/g, "") ?? "";
  return {
    title: get("title"),
    titleEn: get("titleEn"),
    summary: get("summary"),
    description: get("description"),
    category: get("category"),
    steps: get("steps"),
  };
}

const entryFiles = readdirSync(path.join(ROOT, "src/content/entries")).filter((f) =>
  f.endsWith(".mdx"),
);
const pathFiles = readdirSync(path.join(ROOT, "src/content/paths")).filter((f) =>
  f.endsWith(".mdx"),
);

const targets = { index: `${TEMPLATE_VER}|橙月Wiki|会发声的音乐百科` };
for (const f of entryFiles) {
  const { title, titleEn, summary, category } = fm(path.join(ROOT, "src/content/entries", f));
  targets[f.replace(/\.mdx$/, "")] = [TEMPLATE_VER, title, titleEn, summary, category].join("|");
}
for (const f of pathFiles) {
  const { title, description, steps } = fm(path.join(ROOT, "src/content/paths", f));
  targets[f.replace(/\.mdx$/, "")] = [TEMPLATE_VER, title, description, steps].join("|");
}

const hash = (s) => createHash("md5").update(s).digest("hex").slice(0, 12);
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const todo = Object.entries(targets).filter(([slug, src]) => cache[slug] !== hash(src));

mkdirSync(OUT_DIR, { recursive: true });
// 清掉已不存在目标的旧图
for (const f of readdirSync(OUT_DIR)) {
  const slug = f.replace(/\.png$/, "");
  if (!targets[slug]) rmSync(path.join(OUT_DIR, f));
}

console.log(`OG 目标 ${Object.keys(targets).length} 个,需生成 ${todo.length} 个`);

if (todo.length === 0) process.exit(0);

// ---- 起 dev 服务器渲染模板 ----
// 先清可能残留的会话(astro 7 有 dev 会话管理;孤儿进程会占端口)
spawn("npx", ["astro", "dev", "stop"], { cwd: ROOT, shell: true, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2000));

const dev = spawn("npx", ["astro", "dev", "--port", String(PORT), "--host", "127.0.0.1"], {
  cwd: ROOT,
  shell: true,
  stdio: "ignore",
});
const waitReady = async () => {
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/og/index`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("dev 服务器 90s 未就绪");
};

try {
  await waitReady();
  const {
    chromium,
  } = require("C:/Users/admin/AppData/Roaming/npm/node_modules/mcp-jobs/node_modules/playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  let done = 0;
  for (const [slug, src] of todo) {
    await page.goto(`http://127.0.0.1:${PORT}/og/${slug}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT_DIR, `${slug}.png`) });
    cache[slug] = hash(src);
    done++;
    if (done % 20 === 0) console.log(`  … ${done}/${todo.length}`);
  }

  await browser.close();
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  console.log(`✅ OG 分享卡生成完成:${done} 张 → public/og/`);
} finally {
  // 用 astro 自己的会话管理收尾,避免孤儿进程占端口
  spawn("npx", ["astro", "dev", "stop"], { cwd: ROOT, shell: true, stdio: "ignore" });
  dev.kill();
}
