// Freesound 搜索页解析 v2:从 .bw-player 的 data-* 属性提取 标题|时长|预览链接
// 用法: node fs-search.cjs <html 文件路径>
const fs = require("node:fs");
const html = fs.readFileSync(process.argv[2], "utf8");

const players = html.match(/class="bw-player"[\s\S]*?tabindex="0"/g) ?? [];
for (const p of players.slice(0, 15)) {
  const attr = (k) => p.match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? "";
  const title = attr("data-title");
  const dur = Number(attr("data-duration") || 0).toFixed(1);
  const user = attr("data-username");
  const mp3 = attr("data-mp3").replace("-lq.mp3", "-hq.mp3");
  console.log([dur + "s", user, title, mp3].join(" | "));
}
