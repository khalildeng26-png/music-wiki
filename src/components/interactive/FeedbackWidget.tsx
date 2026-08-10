import * as React from "react";
import { Check, MessageSquareHeart, Send, X } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// TODO(server): 服务器就绪后填入后端地址,如 "https://api.xxx.com/api/feedback"
const FEEDBACK_ENDPOINT = "";
const OUTBOX_KEY = "music-wiki-feedback-outbox";

type Payload = { message: string; contact: string; page: string; time: string };

async function post(payload: Payload) {
  const res = await fetch(FEEDBACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("bad status");
}

function saveLocal(payload: Payload) {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    const items: Payload[] = raw ? JSON.parse(raw) : [];
    items.push(payload);
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch {
    /* 忽略 */
  }
}

/** 右侧浮动反馈入口 + 小弹窗。后端就绪前本地暂存,就绪后自动补交。 */
export function FeedbackWidget() {
  const [open, setOpen] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // 后端就绪后:把本地暂存过的反馈补交上去
  React.useEffect(() => {
    if (!FEEDBACK_ENDPOINT) return;
    try {
      const raw = localStorage.getItem(OUTBOX_KEY);
      if (!raw) return;
      const items: Payload[] = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) return;
      void Promise.all(items.map((it) => post(it)))
        .then(() => localStorage.removeItem(OUTBOX_KEY))
        .catch(() => {
          /* 仍有失败的,保留待下次 */
        });
    } catch {
      /* 忽略 */
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      window.setTimeout(() => taRef.current?.focus(), 50);
    } else {
      setState((s) => (s === "done" ? "idle" : s));
    }
  }, [open]);

  async function submit() {
    const text = msg.trim();
    if (!text) return;
    setState("sending");
    const payload: Payload = {
      message: text,
      contact: contact.trim(),
      page: location.pathname,
      time: new Date().toISOString(),
    };
    try {
      if (FEEDBACK_ENDPOINT) await post(payload);
      else saveLocal(payload);
      setState("done");
      setMsg("");
      setContact("");
      window.setTimeout(() => {
        setState("idle");
        setOpen(false);
      }, 1500);
    } catch {
      setState("error");
    }
  }

  return (
    <>
      {/* 弹窗 */}
      {open && (
        <div className="fixed inset-x-4 bottom-24 z-50 mx-auto w-auto max-w-sm rounded-xl border bg-card p-4 shadow-xl sm:inset-x-auto sm:bottom-auto sm:right-20 sm:top-1/2 sm:max-w-80 sm:-translate-y-1/2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareHeart className="size-4 text-signature" /> 意见反馈
            </div>
            <button
              type="button"
              aria-label="关闭"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            内容错误、想要新词条、体验问题——都欢迎告诉我们。
          </p>

          {state === "done" ? (
            <div className="mt-4 flex flex-col items-center gap-2 py-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="size-5" />
              </span>
              <span className="text-sm">已收到,感谢你的反馈!</span>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <textarea
                ref={taRef}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={4}
                placeholder="写点什么…例如:某条内容有误 / 希望增加xx词条"
                className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-signature/50"
              />
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="联系方式(选填,便于回复)"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-signature/50"
              />
              {state === "error" && (
                <p className="text-xs text-red-500">提交失败,请稍后再试。</p>
              )}
              <button
                type="button"
                disabled={!msg.trim() || state === "sending"}
                onClick={() => void submit()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-signature px-4 py-2 text-sm font-medium text-signature-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                <Send className="size-3.5" />
                {state === "sending" ? "提交中…" : "提交反馈"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 浮动按钮 */}
      <button
        type="button"
        aria-label="意见反馈"
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-signature text-signature-foreground shadow-lg transition hover:scale-105 hover:opacity-90"
      >
        <MessageSquareHeart className="size-5" />
      </button>
    </>
  );
}

export default FeedbackWidget;
