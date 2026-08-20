// 姿势插画背景统一:从边缘洪泛填充,把背景连通区替换成站点页面底色。
// 用法:node scripts/_tmp/fix-posture-bg.cjs   (处理 public/images/*-posture.png / *-hand-shape.png)
const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

// ---- OKLCH -> sRGB(与 global.css 的 --background: oklch(0.965 0.022 85) 一致)----
function oklchToSrgb(L, C, Hdeg) {
  const H = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  let R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const enc = (c) =>
    Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
  return [enc(R), enc(G), enc(B)];
}

const TARGET = oklchToSrgb(0.965, 0.022, 85);
console.log("target page bg sRGB:", TARGET);

const DIR = path.join(__dirname, "..", "..", "public", "images");
const FILES = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".png") && /posture|hand-shape/.test(f));

for (const file of FILES) {
  const p = path.join(DIR, file);
  const png = PNG.sync.read(fs.readFileSync(p));
  const { width: W, height: H, data } = png;

  // 1. 边缘平均色 = 该图背景色
  let sr = 0,
    sg = 0,
    sb = 0,
    n = 0;
  const sample = (x, y) => {
    const i = (y * W + x) * 4;
    sr += data[i];
    sg += data[i + 1];
    sb += data[i + 2];
    n++;
  };
  for (let x = 0; x < W; x += 7) {
    sample(x, 0);
    sample(x, H - 1);
  }
  for (let y = 0; y < H; y += 7) {
    sample(0, y);
    sample(W - 1, y);
  }
  const bg = [sr / n, sg / n, sb / n];
  const distBg = Math.hypot(bg[0] - TARGET[0], bg[1] - TARGET[1], bg[2] - TARGET[2]);
  // 容差:覆盖自身背景抖动 + 与目标色的距离,再留一点余量(不吃插画内部的近色)
  const tol = Math.max(26, Math.round(distBg) + 14);

  // 2. 从四条边 BFS,只重染与背景连通的像素
  const seen = new Uint8Array(W * H);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const idx = y * W + x;
    if (seen[idx]) return;
    const i = idx * 4;
    const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    if (d > tol) return;
    seen[idx] = 1;
    queue.push(idx);
  };
  for (let x = 0; x < W; x++) {
    push(x, 0);
    push(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    push(0, y);
    push(W - 1, y);
  }
  let filled = 0;
  while (queue.length) {
    const idx = queue.pop();
    const i = idx * 4;
    data[i] = TARGET[0];
    data[i + 1] = TARGET[1];
    data[i + 2] = TARGET[2];
    filled++;
    const x = idx % W;
    const y = (idx / W) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  fs.writeFileSync(p, PNG.sync.write(png));
  const pct = ((filled / (W * H)) * 100).toFixed(1);
  console.log(
    `${file}: bg avg(${bg.map((v) => v.toFixed(0))}) tol=${tol} filled=${pct}%`,
  );
}
console.log("done");
