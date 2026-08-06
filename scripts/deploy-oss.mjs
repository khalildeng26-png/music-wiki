// 把 dist/ 上传到阿里云 OSS(S3 兼容),用桶默认域名即可国内访问(免备案)。
// 用法:npm run deploy:oss   (会先 build 再上传)
// 密钥从 .env 读取(参考 .env.example),不要提交。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const REGION = process.env.OSS_REGION; // 如 oss-cn-shanghai
const BUCKET = process.env.OSS_BUCKET;
const KEY_ID = process.env.OSS_ACCESS_KEY_ID;
const SECRET = process.env.OSS_ACCESS_KEY_SECRET;
const DIST = "dist";

if (!REGION || !BUCKET || !KEY_ID || !SECRET) {
  console.error(
    "✗ 缺少环境变量。请在项目根目录建 .env(参考 .env.example),填入:\n" +
      "  OSS_REGION / OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET",
  );
  process.exit(1);
}

const client = new S3Client({
  region: REGION,
  endpoint: `https://${REGION}.aliyuncs.com`,
  credentials: { accessKeyId: KEY_ID, secretAccessKey: SECRET },
  forcePathStyle: true,
});

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(DIST);
console.log(`上传 ${files.length} 个文件到 oss://${BUCKET} ...`);

let done = 0;
for (const file of files) {
  const rel = relative(DIST, file).split("\\").join("/");
  // 关键:每个 <dir>/index.html 额外上传一份 <dir> 别名,
  // 让 OSS 上不带斜杠的链接(如 /entries/guitar)也能直接打开。
  const keys = [rel];
  if (rel.endsWith("/index.html") && rel !== "index.html") {
    keys.push(rel.slice(0, -"/index.html".length));
  }
  const body = readFileSync(file);
  const contentType = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
  const cacheControl = rel.endsWith("index.html")
    ? "no-cache"
    : "public, max-age=31536000, immutable";
  for (const key of keys) {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
      }),
    );
  }
  done++;
  if (done % 20 === 0 || done === files.length) console.log(`  ${done}/${files.length}`);
}

console.log("✓ 上传完成。");
console.log(`访问(国内可开,HTTP): http://${BUCKET}.${REGION}.aliyuncs.com/`);
console.log("前提:Bucket 权限设为「公共读」,并开启「静态页面托管」默认首页 index.html");
