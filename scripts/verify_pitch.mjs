// 一次性验证:PitchTrainer 端到端(无头浏览器 + Chrome 伪麦克风音调)
// 三路交叉验证:组件显示 vs 页内独立 FFT 峰值 vs 采样序列稳定性
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/admin/AppData/Roaming/npm/node_modules/mcp-jobs/node_modules/playwright",
);

const BASE = "http://localhost:4321";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "_verify");

const browser = await chromium.launch({
  headless: true,
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(BASE + "/entries/pitch-training", { waitUntil: "networkidle" });

const fig = page.locator("figure", { hasText: "音高反馈" });
const micBtn = fig.locator('button[aria-label="开启麦克风"]');
await micBtn.scrollIntoViewIfNeeded();
await micBtn.waitFor({ state: "visible", timeout: 10000 });
await page.waitForTimeout(600);
await micBtn.click();

// 连续采样组件读数(音名 + Hz)
const readings = [];
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(700);
  const note = await fig.locator(".font-display").first().textContent();
  const hz = await fig.locator(".tabular-nums").first().textContent().catch(() => "");
  readings.push(`${note?.trim()}|${hz?.trim()}`);
}
console.log("组件读数序列:", readings);

// 页内独立 FFT 峰值(与组件不同的算法,交叉验证伪麦克风真实频率)
const fftHz = await page.evaluate(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const an = ctx.createAnalyser();
  an.fftSize = 8192;
  ctx.createMediaStreamSource(stream).connect(an);
  await new Promise((r) => setTimeout(r, 200));
  const d = new Float32Array(an.frequencyBinCount);
  an.getFloatFrequencyData(d);
  let best = -Infinity;
  let bin = 0;
  for (let i = 1; i < d.length; i++)
    if (d[i] > best) {
      best = d[i];
      bin = i;
    }
  stream.getTracks().forEach((t) => t.stop());
  void ctx.close();
  return (bin * ctx.sampleRate) / an.fftSize;
});
console.log("独立 FFT 峰值:", Math.round(fftHz), "Hz");

await page.screenshot({ path: `${OUT}/pitch-trainer.png` });
console.log("console 错误:", errors.length ? errors : "无");
await browser.close();
