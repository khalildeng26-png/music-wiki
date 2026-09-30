import fs from "node:fs";
const s = fs.readFileSync("src/lib/genrePatterns.ts", "utf8");
const anchor = "// 演示时长:vamp 型曲风";
if (!s.includes(anchor)) {
  console.error("anchor not found");
  process.exit(1);
}
const block = fs.readFileSync("scripts/_tmp/btier-patterns.txt", "utf8");
fs.writeFileSync("src/lib/genrePatterns.ts", s.replace(anchor, block + anchor, 1));
console.log("patterns-inserted");
