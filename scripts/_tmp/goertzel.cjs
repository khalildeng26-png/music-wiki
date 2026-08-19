// Goertzel 八度判定:对候选频率(半频/原频/倍频)算能量,选出最强 → 确定真实八度
// 用法: node goertzel.cjs <pcm> <sr> <标注频率>
const fs = require("node:fs");
const buf = Buffer.from(fs.readFileSync(process.argv[2]));
const sr = Number(process.argv[3]);
const labeled = Number(process.argv[4]);

const n = Math.min(Math.floor(buf.length / 2), 24000); // 最多 1 秒
const x = new Float32Array(n);
for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(i * 2) / 32768;

function goertzel(freq) {
  const k = (2 * Math.PI * freq) / sr;
  const coeff = 2 * Math.cos(k);
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    s0 = x[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / (n / 2);
}

const NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteOf = (f) => {
  const midi = Math.round(69 + 12 * Math.log2(f / 440));
  return NAME[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
};
for (const f of [labeled / 4, labeled / 2, labeled, labeled * 2]) {
  console.log(`${f.toFixed(1)} Hz (${noteOf(f)}) 能量 ${goertzel(f).toFixed(3)}`);
}
