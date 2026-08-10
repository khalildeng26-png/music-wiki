// 音乐百科 · 反馈后端(极简,无依赖,Node >= 18)
// POST /api/feedback            提交反馈 → 追加到 JSONL 文件
// GET  /api/feedback/list?key=  查看最近 100 条(需管理员密钥)
import { createServer } from "node:http";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";

const DIR = process.env.FEEDBACK_DIR || "/var/www/music-wiki-feedback";
const ADMIN_KEY = process.env.FEEDBACK_ADMIN_KEY || "";
const PORT = Number(process.env.PORT || 8089);
const MAX_MSG = 1000;
const MAX_CONTACT = 200;

mkdirSync(DIR, { recursive: true });

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "POST" && url.pathname === "/api/feedback") {
    let body = "";
    let overflow = false;
    req.on("data", (c) => {
      body += c;
      if (body.length > 8192) {
        overflow = true;
        req.destroy();
      }
    });
    req.on("close", () => {
      if (overflow) {
        res.statusCode = 413;
        res.end(JSON.stringify({ ok: false, error: "too large" }));
      }
    });
    req.on("end", () => {
      if (overflow) return;
      try {
        const data = JSON.parse(body || "{}");
        const message = String(data.message ?? "")
          .trim()
          .slice(0, MAX_MSG);
        if (!message) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: "empty" }));
        }
        const record = {
          message,
          contact: String(data.contact ?? "").trim().slice(0, MAX_CONTACT),
          page: String(data.page ?? "").slice(0, 200),
          time: String(data.time ?? new Date().toISOString()),
          ip: req.socket.remoteAddress,
        };
        const file = `${DIR}/feedback-${new Date()
          .toISOString()
          .slice(0, 7)}.jsonl`;
        appendFileSync(file, JSON.stringify(record) + "\n");
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: "bad json" }));
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/feedback/list") {
    if (!ADMIN_KEY || url.searchParams.get("key") !== ADMIN_KEY) {
      res.statusCode = 403;
      res.end(JSON.stringify({ ok: false, error: "forbidden" }));
      return;
    }
    try {
      const files = readdirSync(DIR)
        .filter((f) => f.endsWith(".jsonl"))
        .sort();
      const items = files.flatMap((f) =>
        readFileSync(`${DIR}/${f}`, "utf-8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((l) => JSON.parse(l)),
      );
      res.end(JSON.stringify({ ok: true, items: items.slice(-100) }));
    } catch {
      res.end(JSON.stringify({ ok: true, items: [] }));
    }
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`feedback api listening on 127.0.0.1:${PORT}`);
});
