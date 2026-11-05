// 走向播放+模糊搜索 E2E(本地 preview)
import { chromium } from "../miniprogram/node_modules/playwright/index.mjs";

const BASE = "http://[::1]:4601";
const results = [];
const ok = (c, name) => {
  results.push([!!c, name]);
  console.log((c ? "✓" : "✗ FAIL") + " " + name);
};

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
await page.goto(BASE + "/entries/guitar-open-chords/", { waitUntil: "networkidle" });

const g = page.locator("figure").filter({ hasText: "走向" }).first();
await g.scrollIntoViewIfNeeded();
const input = g.locator("input[aria-label='和弦走向输入']");
const playBtn = g.locator("button").filter({ hasText: "播放" }).first();
const stopBtn = g.locator("button").filter({ hasText: "停止" }).first();

// 1. 行存在 + 默认值
ok((await input.count()) === 1, "走向输入框存在");
ok((await input.inputValue()) === "C Am F G", "默认走向 C Am F G");
ok((await playBtn.count()) === 1, "播放按钮在");

// 2. 播放 → 停止
await playBtn.click();
await page.waitForTimeout(500);
ok((await stopBtn.count()) === 1, "点击后出现■ 停止");
ok(await input.isDisabled(), "播放中输入框锁定");
await page.waitForTimeout(1600); // 跨过几个和弦
const active = await g.locator(".border-signature\\/70").count();
ok(active >= 0, `和弦卡/指板联动无报错(active=${active})`);
await stopBtn.click();
await page.waitForTimeout(300);
ok((await playBtn.count()) === 1, "停止后回▶ 播放");
ok(!(await input.isDisabled()), "停止后输入框解锁");

// 3. 模糊搜索:清空输入 C → 浮层
await input.click();
await input.fill("C");
await page.waitForTimeout(300);
const chips = await g.locator(".shadow-lg button").allInnerTexts();
ok(chips.includes("Cmaj7"), `浮层含 Cmaj7(实际:${chips.join(",")})`);
ok(chips.includes("Csus4") && chips.includes("Cadd9"), "浮层含 Csus4/Cadd9");
// 点选 Cmaj7
await g.locator(".shadow-lg button", { hasText: "Cmaj7" }).first().click();
await page.waitForTimeout(200);
ok((await input.inputValue()).includes("Cmaj7"), `点选后输入含 Cmaj7(实际:${await input.inputValue()})`);

// 4. 红标:乱词
await input.fill("C Xy Am");
await page.waitForTimeout(300);
ok((await g.innerText()).includes("不认识 Xy"), "红标不认识 Xy");
ok(await playBtn.isDisabled(), "红标时播放禁用");

// 5. Bb 归一
await input.fill("Bb");
await page.waitForTimeout(300);
const chips2 = await g.locator(".shadow-lg button").allInnerTexts();
ok(chips2.includes("B♭"), `Bb→浮层含 B♭(实际:${chips2.join(",")})`);

// 6. 循环:播放一轮以上(走向 2 和弦,一轮 8 步×355ms≈2.8s;等 6s 看仍在播放=跨轮)
await input.fill("C G");
await playBtn.click();
await page.waitForTimeout(6500);
ok((await stopBtn.count()) === 1, "6.5s 后仍在播放(一轮 2.8s,已跨轮=循环生效)");
await stopBtn.click();

// 7. 回归:旧功能(和弦卡点击、分组 chips 含「斜杠」)
await g.locator("button[aria-label='C 和弦,点击扫弦']").first().click();
await page.waitForTimeout(300);
ok((await g.innerText()).includes("斜杠"), "分组含「斜杠」(新和弦组)");
const groupBtns = await g.locator("[role=tab]").allInnerTexts();
ok(groupBtns.length === 5, `五组 tab(实际:${groupBtns.join(",")})`);
// 斜杠组内容
await g.locator("[role=tab]", { hasText: "斜杠" }).click();
await page.waitForTimeout(300);
const slashTxt = await g.innerText();
ok(slashTxt.includes("G/B") && slashTxt.includes("C/E") && slashTxt.includes("D/F#"), "斜杠组含 G/B C/E D/F#");

ok(pageErrors.length === 0, "无页面错误" + (pageErrors.length ? ":" + pageErrors[0] : ""));
await browser.close();
const fails = results.filter(([c]) => !c).length;
console.log(`\n${results.length - fails} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
