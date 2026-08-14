import mysql from "mysql2/promise";
// 音乐百科 · 反馈后端 v2(MySQL 版,Node >= 18)
// POST /api/feedback            提交反馈 → 写入 MySQL feedbacks 表
// GET  /api/feedback/list?key=  查看最近 100 条(需管理员密钥)
import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 8089);
const ADMIN_KEY = process.env.FEEDBACK_ADMIN_KEY || "";
const DB = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "musicwiki",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "music_wiki",
  connectionLimit: 4,
};
const MAX_MSG = 1000;
const MAX_CONTACT = 200;

let pool = null;
function getPool() {
  if (!pool) pool = mysql.createPool(DB);
  return pool;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "POST" && url.pathname === "/api/feedback") {
    const chunks = [];
    let size = 0;
    let overflow = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > 8192) {
        overflow = true;
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("close", () => {
      if (overflow) {
        res.statusCode = 413;
        res.end(JSON.stringify({ ok: false, error: "too large" }));
      }
    });
    req.on("end", () => {
      if (overflow) return;
      (async () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
          const message = String(data.message ?? "")
            .trim()
            .slice(0, MAX_MSG);
          if (!message) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ ok: false, error: "empty" }));
          }
          await getPool().execute(
            "INSERT INTO feedbacks (message, contact, page, ip) VALUES (?, ?, ?, ?)",
            [
              message,
              String(data.contact ?? "")
                .trim()
                .slice(0, MAX_CONTACT),
              String(data.page ?? "").slice(0, 200),
              String(req.headers["x-forwarded-for"] ?? "")
                .split(",")[0]
                .trim() ||
                req.socket.remoteAddress ||
                "",
            ],
          );
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: "db" }));
        }
      })();
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/feedback/list") {
    if (!ADMIN_KEY || url.searchParams.get("key") !== ADMIN_KEY) {
      res.statusCode = 403;
      return res.end(JSON.stringify({ ok: false, error: "forbidden" }));
    }
    (async () => {
      try {
        const [rows] = await getPool().execute(
          "SELECT message, contact, page, ip, created_at AS time FROM feedbacks ORDER BY id DESC LIMIT 100",
        );
        res.end(JSON.stringify({ ok: true, items: rows }));
      } catch {
        res.end(JSON.stringify({ ok: true, items: [] }));
      }
    })();
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`feedback api (mysql) listening on 127.0.0.1:${PORT}`);
});
