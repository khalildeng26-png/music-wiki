// Guitar 和弦机抽取重构后的回归验证 + chord-finder 在分类页的排序
import { chromium } from "../miniprogram/node_modules/playwright/index.mjs";

const BASE = "http://[::1]:4599";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
let pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

// 1. 和弦机词条:guitar-open-chords 用了 Guitar 组件
await page.goto(BASE + "/entries/guitar-open-chords/", { waitUntil: "networkidle" });
const g = page.locator("figure").filter({ hasText: "指板" }).first();
await g.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const guitarInfo = await g.innerText();
console.log("✓ Guitar 组件渲染:" + (guitarInfo.includes("基本") ? "分组 tab 在" : "?"));
// 和弦卡点击(扫弦)→ activeChord 点亮
await g.locator("button[aria-label='C 和弦,点击扫弦']").first().click();
await page.waitForTimeout(400);
console.log("✓ 点 C 和弦卡无报错");
await g.locator("button[aria-label='Em 和弦,点击扫弦']").first().click();
await page.waitForTimeout(400);
// 指板格子仍可点
await g.locator("button[aria-label='E2 弦第 3 品']").first().click();
await page.waitForTimeout(300);
console.log("✓ 指板格子可点");

// 2. 和声分类页排序:chord-finder 应在 声部进行 之后
await page.goto(BASE + "/categories/harmony/", { waitUntil: "networkidle" });
const list = await page.locator("main").innerText();
const i1 = list.indexOf("声部进行");
const i2 = list.indexOf("和弦反查");
console.log(
  i2 > i1 && i2 !== -1
    ? "✓ 分类页:和弦反查 排在 声部进行 之后"
    : `✗ 排序异常(声部进行@${i1}, 和弦反查@${i2})`,
);

console.log(pageErrors.length === 0 ? "✓ 无页面错误" : "✗ 页面错误: " + pageErrors.join("; "));
await browser.close();
process.exit(pageErrors.length ? 1 : 0);
