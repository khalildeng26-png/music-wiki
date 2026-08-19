// 口琴系列:解析 j.html → 下载选中音 → ffmpeg 转 pcm → 实测音高
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const RAW = path.join(__dirname, "raw");
const html = fs.readFileSync("C:/Users/admin/AppData/Local/Temp/j.html", "utf8");
const players = html.match(/class="bw-player"[\s\S]*?tabindex="0"/g) ?? [];
const FF = spawnSync("node", ["-p", "require('ffmpeg-static')"], {
  encoding: "utf8",
}).stdout.trim();

const NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteOf = (midi) => NAME[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);

function detectPitch(pcm) {
  const buf = Buffer.from(pcm);
  const sr = 24000;
  const n = Math.min(Math.floor(buf.length / 2), 24000);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(i * 2) / 32768;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += x[i] * x[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.01) return null;
  // 找有声段(避开起手静音)
  let start = 0;
  for (let i = 0; i < n - 16; i++) {
    if (Math.abs(x[i]) > 0.15) {
      start = Math.max(0, i - 256);
      break;
    }
  }
  const SIZE = Math.min(16384, n - start);
  const s = x.subarray(start, start + SIZE);
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++)
    if (Math.abs(s[i]) < 0.2) {
      r1 = i;
      break;
    }
  for (let i = 1; i < SIZE / 2; i++)
    if (Math.abs(s[SIZE - i]) < 0.2) {
      r2 = SIZE - i;
      break;
    }
  const t = s.subarray(r1, r2);
  const size = t.length;
  const maxLag = Math.min(size - 2, Math.floor(sr / 70));
  const c = new Float32Array(maxLag + 2);
  for (let i = 0; i <= maxLag + 1; i++) {
    let sum = 0;
    for (let j = 0; j < size - i; j++) sum += t[j] * t[j + i];
    c[i] = sum;
  }
  let d = 0;
  while (d < maxLag && c[d] > c[d + 1]) d++;
  let maxval = -1,
    maxpos = -1;
  for (let i = d; i <= maxLag; i++)
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  if (maxpos <= 0) return null;
  const x1 = c[maxpos - 1],
    x2 = c[maxpos],
    x3 = c[maxpos + 1] ?? x2;
  const a = (x1 + x3 - 2 * x2) / 2,
    b = (x3 - x1) / 2;
  const lag = a ? maxpos - b / (2 * a) : maxpos;
  const freq = sr / lag;
  const midi = 69 + 12 * Math.log2(freq / 440);
  const nearest = Math.round(midi);
  return { freq, note: noteOf(nearest), cents: Math.round((midi - nearest) * 100) };
}

const WANT = ["4_C.wav", "4_Eb.wav", "4_Gb.wav", "4_A.wav", "5_C.wav", "5_A.wav", "3_C.wav"];
(async () => {
  for (const p of players) {
    const attr = (k) => p.match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? "";
    const title = attr("data-title");
    if (!WANT.includes(title)) continue;
    const mp3 = attr("data-mp3").replace("-lq.mp3", "-hq.mp3");
    const res = await fetch(mp3);
    if (!res.ok) {
      console.log(title, "下载失败", res.status);
      continue;
    }
    const file = path.join(RAW, "h" + title.replace(".wav", ""));
    fs.writeFileSync(file + ".mp3", Buffer.from(await res.arrayBuffer()));
    const conv = spawnSync(FF, [
      "-y",
      "-loglevel",
      "error",
      "-i",
      file + ".mp3",
      "-ac",
      "1",
      "-ar",
      "24000",
      "-f",
      "s16le",
      file + ".pcm",
    ]);
    if (conv.status !== 0) {
      console.log(title, "转码失败");
      continue;
    }
    const d = detectPitch(fs.readFileSync(file + ".pcm"));
    console.log(
      title.padEnd(9),
      d ? `${d.freq.toFixed(1)}Hz → ${d.note} (${d.cents >= 0 ? "+" : ""}${d.cents}¢)` : "未检出",
    );
  }
})();
