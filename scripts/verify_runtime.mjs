// 运行时验证:无头浏览器加载首页/词条页,抓 console 错误 + 测即时搜索 + 截图
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  chromium,
} = require("C:/Users/admin/AppData/Roaming/npm/node_modules/mcp-jobs/node_modules/playwright");

const BASE = "http://localhost:4321";
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "_verify");
const fs = require("node:fs");
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

// --- 首页:即时搜索 ---
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const input = page.locator('input[aria-label="搜索"]');
await input.fill("和弦");
await page.waitForTimeout(800);
const dropdown = await page.locator("ul.absolute li a").count();
console.log(`首页即时搜索「和弦」→ 下拉结果数: ${dropdown}`);
const firstTitle =
  dropdown > 0 ? await page.locator("ul.absolute li a").first().textContent() : "(无)";
console.log(`第一条结果: ${firstTitle.trim()}`);
await page.screenshot({ path: path.join(OUT_DIR, "home-light.png") });

// --- 首页暗色 ---
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT_DIR, "home-dark.png") });
await page.evaluate(() => document.documentElement.classList.remove("dark"));

// --- 姿势图页面 ---
for (const p of ["/entries/guitar-setup/", "/entries/piano-posture/"]) {
  await page.goto(BASE + p, { waitUntil: "networkidle" });
  const imgs = await page.locator('img[src*="posture"], img[src*="hand-shape"]').all();
  for (const img of imgs) {
    const src = await img.getAttribute("src");
    const natural = await img.evaluate((el) => ({ w: el.naturalWidth, h: el.naturalHeight }));
    console.log(`${p} → ${src} 加载: ${natural.w}x${natural.h}`);
  }
  await page.screenshot({
    path: path.join(OUT_DIR, p.replace(/\//g, "_") + ".png"),
    fullPage: true,
  });
}

await browser.close();
const realErrors = errors.filter((e) => !e.includes("favicon"));
console.log(
  realErrors.length ? `\n❌ console 错误:\n${realErrors.join("\n")}` : "\n✅ 无 console 错误",
);
