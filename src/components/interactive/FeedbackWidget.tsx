import { Check, MessageSquareHeart, Send, X } from "lucide-react";
import * as React from "react";

import { track } from "@/lib/track";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 反馈后端:与站点同源 /api/feedback;接口不可达时自动降级为本地暂存,下次打开补交。
// 合规口径(2026-09-01 网安确认):留言仅站长可见(读接口要 ADMIN_KEY),不对其他用户展示。
const FEEDBACK_ENDPOINT = "/api/feedback";
const OUTBOX_KEY = "music-wiki-feedback-outbox";
const TOP_KEY = "music-wiki-feedback-top";
const BTN_HALF = 24; // 按钮半径(48px 高)
const MARGIN = 12;

type Payload = { message: string; contact: string; page: string; time: string };

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

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

/** 右侧浮动反馈入口:可上下拖动(位置记忆),点击弹出反馈表单。 */
export function FeedbackWidget() {
  const [open, setOpen] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [top, setTop] = React.useState<number | null>(null);
  const [desktop, setDesktop] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const dragRef = React.useRef<{ startY: number; startTop: number; moved: boolean } | null>(null);

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

  // 初始化位置 + 窗口变化时重新夹紧
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => {
      setDesktop(mq.matches);
      const vh = window.innerHeight;
      setTop((t) => {
        const saved = Number(localStorage.getItem(TOP_KEY));
        const base = t ?? (Number.isFinite(saved) && saved > 0 ? saved : vh / 2);
        return clamp(base, BTN_HALF + MARGIN, vh - BTN_HALF - MARGIN);
      });
    };
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  React.useEffect(() => {
    if (open) {
      window.setTimeout(() => taRef.current?.focus(), 50);
    } else {
      setState((s) => (s === "done" ? "idle" : s));
    }
  }, [open]);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startY: e.clientY,
      startTop: top ?? window.innerHeight / 2,
      moved: false,
    };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) > 5) d.moved = true;
    if (d.moved) {
      setTop(clamp(d.startTop + dy, BTN_HALF + MARGIN, window.innerHeight - BTN_HALF - MARGIN));
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!d) return;
    if (d.moved) {
      const final = clamp(
        d.startTop + (e.clientY - d.startY),
        BTN_HALF + MARGIN,
        window.innerHeight - BTN_HALF - MARGIN,
      );
      setTop(final);
      try {
        localStorage.setItem(TOP_KEY, String(final));
      } catch {
        /* 忽略 */
      }
    } else {
      setOpen((o) => !o);
    }
  }

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
      if (FEEDBACK_ENDPOINT) {
        try {
          await post(payload);
          track("feedback-submit", { ok: true });
        } catch {
          saveLocal(payload);
          track("feedback-submit", { ok: false, queued: true });
        }
      } else {
        saveLocal(payload);
      }
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

  const popupTop =
    desktop && top != null ? clamp(top, 260, Math.max(261, window.innerHeight - 260)) : undefined;

  return (
    <>
      {/* 弹窗(桌面跟随按钮垂直位置,移动端底部卡片) */}
      {open && (
        <div
          style={popupTop != null ? { top: popupTop } : undefined}
          className="fixed inset-x-4 bottom-24 z-50 mx-auto w-auto max-w-sm rounded-xl border bg-card p-4 shadow-xl sm:inset-x-auto sm:right-20 sm:bottom-auto sm:max-w-80 sm:-translate-y-1/2"
        >
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
              {state === "error" && <p className="text-xs text-red-500">提交失败,请稍后再试。</p>}
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

      {/* 浮动按钮:可上下拖动 */}
      <button
        type="button"
        aria-label="意见反馈(可上下拖动)"
        title="点我反馈 · 可上下拖动"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={
          "fixed top-1/2 right-4 z-50 flex h-12 w-12 -translate-y-1/2 touch-none items-center justify-center rounded-full bg-signature text-signature-foreground shadow-lg transition hover:opacity-90 " +
          (dragging ? "cursor-grabbing" : "cursor-grab")
        }
        style={top != null ? { top } : undefined}
      >
        <MessageSquareHeart className="size-5" />
      </button>
    </>
  );
}

export default FeedbackWidget;
