// ChordFinder 组件 E2E:点格子→答案、同音异名、清空。跑在 preview 产物上。
import { chromium } from "../miniprogram/node_modules/playwright/index.mjs";

const BASE = "http://[::1]:4599";
const results = [];
const ok = (c, name) => {
  results.push([!!c, name]);
  console.log((c ? "✓" : "✗ FAIL") + " " + name);
};

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
await page.goto(BASE + "/entries/chord-finder/", { waitUntil: "networkidle" });

// 指板容器与格子按钮
const neck = page.locator("figure").filter({ hasText: "和弦反查" }).first();
await neck.scrollIntoViewIfNeeded();
const cell = (s, f) => neck.locator(`button[aria-label="${["E2","A2","D3","G3","B3","E4"][s]} 弦第 ${f} 品"]`);

// 答案区文本
const answer = () => neck.locator(".text-2xl").first().innerText().catch(() => "");

// 1. 初始提示文案
ok((await neck.innerText()).includes("答案会出现在这里"), "初始态有引导文案");

// 2. 点 C 标准按位 x32010:弦1品3、弦2品2、弦3品0、弦4品1、弦5品0
await cell(1, 3).click();
await cell(2, 2).click();
await cell(3, 0).click();
await cell(4, 1).click();
await cell(5, 0).click();
await page.waitForTimeout(300);
const a1 = await answer();
ok(a1.includes("C"), `点 C 按位 → 答案含 C(实际「${a1}」)`);
ok((await neck.innerText()).includes("标准按法"), "标注标准按法");

// 3. 已选音 chips = 5
ok((await neck.locator("button.font-mono").count()) === 5, "已选 5 个音 chips");

// 4. 清空
await neck.locator("button", { hasText: "清空" }).click();
await page.waitForTimeout(200);
ok((await neck.innerText()).includes("答案会出现在这里"), "清空回到引导文案");

// 5. 同音异名:Dsus2 = x x 0 2 3 0 (弦2空、弦3品2、弦4品3、弦5空)
await cell(2, 0).click();
await cell(3, 2).click();
await cell(4, 3).click();
await cell(5, 0).click();
await page.waitForTimeout(300);
const a2 = await answer();
ok(a2.includes("Dsus2"), `Dsus2 按位 → 首选 Dsus2(实际「${a2}」)`);

// 6. 改一格 → Asus4(弦1空 加入,弦4品3 保留…实际 x02230:弦1空、弦2品2、弦3品2、弦4品3、弦5空)
await neck.locator("button", { hasText: "清空" }).click();
await cell(1, 0).click();
await cell(2, 2).click();
await cell(3, 2).click();
await cell(4, 3).click();
await cell(5, 0).click();
await page.waitForTimeout(300);
const a3 = await answer();
ok(a3.includes("Asus4"), `Asus4 按位 → 首选 Asus4(实际「${a3}」)`);

// 7. 截图存档
await neck.screenshot({ path: "/tmp/chordfinder-final.png" });

// 8. 加音实验:C 的 2 弦从 1 品挪到 3 品(C→D)→ Cadd9
await neck.locator("button", { hasText: "清空" }).click();
await cell(1, 3).click();
await cell(2, 2).click();
await cell(3, 0).click();
await cell(4, 3).click();
await cell(5, 0).click();
await page.waitForTimeout(300);
const a4 = await answer();
ok(a4.includes("Cadd9"), `C 的 2 弦挪 3 品(C→D)→ Cadd9(实际「${a4}」)`);

// 9. 缺音:只点 C 的根音+五音(弦1品3=C、弦3空=G)
await neck.locator("button", { hasText: "清空" }).click();
await cell(1, 3).click();
await cell(3, 0).click();
await page.waitForTimeout(300);
const a5 = await answer();
ok(a5.includes("差一点") || (await neck.innerText()).includes("缺"), `两音 → 缺音话术(实际「${a5}」)`);

await browser.close();
const fails = results.filter(([c]) => !c).length;
console.log(`\n${results.length - fails} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
