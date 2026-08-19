// 从 sfzinstruments/aliexpress-erhu 的 SFZ 映射挑锚点采样,输出下载清单到 erhu_picks.json
const fs = require("node:fs");
const path = require("node:path");
const HERE = __dirname;
const txt = fs.readFileSync(path.join(HERE, "erhu_map.sfz"), "utf8");
const regions = [
  ...txt.matchAll(/sample=(\S+)\s+lokey=(\d+)\s+hikey=(\d+)[\s\S]*?pitch_keycenter=(\d+)/g),
];
const NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const toNote = (m) => NAME[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const list = regions
  .filter((r) => r[1].includes("rr1"))
  .map((r) => ({
    file: r[1].replace(/\\/g, "/").split("/").pop(),
    midi: Number(r[4]),
    note: toNote(Number(r[4])),
  }))
  .sort((a, b) => a.midi - b.midi);
console.log("音高范围:", list[0].note, "-", list[list.length - 1].note, "/", list.length, "音");
const idx = [0, 0.2, 0.4, 0.6, 0.8, 0.999].map((f) =>
  Math.min(list.length - 1, Math.floor(list.length * f)),
);
const picks = [...new Set(idx)].map((i) => list[i]);
console.log("锚点:", picks.map((p) => p.note).join(" "));
fs.writeFileSync(path.join(HERE, "erhu_picks.json"), JSON.stringify(picks));
