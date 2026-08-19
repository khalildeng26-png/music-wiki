// 实测音频文件的基频(自相关 ACF2+,与 PitchTrainer 同源算法)
// 用法: node pitch.cjs <pcm 文件> <采样率>
// pcm 由 ffmpeg 输出: -ac 1 -ar <sr> -f s16le
const fs = require("node:fs");
const buf = Buffer.from(fs.readFileSync(process.argv[2]));
const sr = Number(process.argv[3] || 24000);
const SIZE = 16384;
const samples = new Float32Array(SIZE);
for (let i = 0; i < SIZE; i++) samples[i] = buf.readInt16LE(i * 2) / 32768;

// —— 以下与 PitchTrainer.autoCorrelate 相同 ——
let rms = 0;
for (let i = 0; i < SIZE; i++) rms += samples[i] * samples[i];
rms = Math.sqrt(rms / SIZE);
if (rms < 0.015) {
  console.log("静音/太轻,无法检测");
  process.exit(0);
}
let r1 = 0;
let r2 = SIZE - 1;
for (let i = 0; i < SIZE / 2; i++)
  if (Math.abs(samples[i]) < 0.2) {
    r1 = i;
    break;
  }
for (let i = 1; i < SIZE / 2; i++)
  if (Math.abs(samples[SIZE - i]) < 0.2) {
    r2 = SIZE - i;
    break;
  }
const t = samples.subarray(r1, r2);
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
let maxval = -1;
let maxpos = -1;
for (let i = d; i <= maxLag; i++)
  if (c[i] > maxval) {
    maxval = c[i];
    maxpos = i;
  }
if (maxpos <= 0) {
  console.log("未检出");
  process.exit(0);
}
const x1 = c[maxpos - 1];
const x2 = c[maxpos];
const x3 = c[maxpos + 1] ?? x2;
const a = (x1 + x3 - 2 * x2) / 2;
const b = (x3 - x1) / 2;
const lag = a ? maxpos - b / (2 * a) : maxpos;
const freq = sr / lag;
const NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const midi = 69 + 12 * Math.log2(freq / 440);
const nearest = Math.round(midi);
const note = NAME[((nearest % 12) + 12) % 12] + (Math.floor(nearest / 12) - 1);
console.log(`${freq.toFixed(1)} Hz → ${note} (偏差 ${((midi - nearest) * 100).toFixed(0)} 音分)`);
