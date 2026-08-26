// 验证本轮 UI 改动:暗色钢琴键分隔 / 今日词条整卡可点 / 搜索模糊召回
// 用法:node scripts/_tmp/verify-ui.mjs [baseUrl](默认 http://127.0.0.1:4321)
const {
  chromium,
} = require("C:/Users/admin/AppData/Roaming/npm/node_modules/mcp-jobs/node_modules/playwright");

const BASE = process.argv[2] || "http://127.0.0.1:4321";
const OUT = "scripts/_tmp/shots";
const fs = require("node:fs");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const log = (...a) => console.log("[verify]", ...a);

  // ---------- 1. 首页:暗色钢琴 ----------
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(600);
  const piano = page.locator("section >> nth=0 >> figure").first();
  await piano.screenshot({ path: `${OUT}/piano-dark.png` });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.waitForTimeout(300);
  await piano.screenshot({ path: `${OUT}/piano-light.png` });
  log("piano screenshots saved");

  // ---------- 2. 搜索:吉他乐理 ----------
  await page.fill('input[aria-label="搜索"]', "吉他乐理");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/search-dropdown.png` });
  const dropdownItems = await page.locator("ul.absolute > li").allTextContents();
  log(
    "dropdown results:",
    dropdownItems.map((t) => t.trim().replace(/\s+/g, " ")),
  );

  // ---------- 3. 今日词条整卡点击 ----------
  const dailyHref = await page.evaluate(() =>
    document.querySelector("a.group[href^='/entries/']")?.getAttribute("href"),
  );
  // 今日词条卡:外层是 <a>,里面有「今日词条」徽标
  const dailyCard = page.locator("a", { hasText: "今日词条" }).first();
  const cardHref = await dailyCard.getAttribute("href");
  // 点卡片空白处(标题右侧的 hook 文本区域),不该点到播放键
  await page.locator("a", { hasText: "每天换一篇" }).first().click({ timeout: 5000 });
  await page.waitForLoadState("networkidle");
  log("daily card href:", cardHref, "| landed on:", new URL(page.url()).pathname);
  const cardNavOk =
    new URL(page.url()).pathname.replace(/\/$/, "") === (cardHref || "").replace(/\/$/, "");

  // ---------- 4. /search 页 ----------
  await page.goto(BASE + "/search?q=" + encodeURIComponent("吉他乐理"), {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/search-page.png`, fullPage: false });
  const count = await page.locator("ul > li").count();
  const firstTitle = (await page.locator("ul > li").first().textContent())?.trim();
  log("search page results:", count, "| first:", firstTitle?.replace(/\s+/g, " "));

  // 结果断言
  const searchOk = count > 0;
  log("SUMMARY:", {
    pianoShots: true,
    dropdownCount: dropdownItems.length,
    dailyCardNavOk: cardNavOk,
    searchPageOk: searchOk,
  });

  await browser.close();
  if (!cardNavOk || !searchOk || dropdownItems.length === 0) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
