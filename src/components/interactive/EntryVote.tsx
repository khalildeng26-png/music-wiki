import { Send, ThumbsDown, ThumbsUp } from "lucide-react";
import * as React from "react";

import { track } from "@/lib/track";

type Vote = "up" | "down";
type ReasonState = "editing" | "sending" | "done" | "error";

/** 词条底部的「有帮助吗」投票:事件进 umami 聚合看板,零服务器存储、
 *  零公开展示。👎 之后内联追问「哪里不够好」:文字直接走右侧反馈挂件
 *  的私密后端(POST /api/feedback,仅站长可见),page 字段自带词条路径,
 *  站长在反馈列表里能对上差评来源。 */
export function EntryVote({ slug }: { slug: string }) {
  const [vote, setVote] = React.useState<Vote | null>(null);
  const [reason, setReason] = React.useState("");
  const [rs, setRs] = React.useState<ReasonState>("editing");

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(`entry-vote:${slug}`);
      if (v === "up" || v === "down") setVote(v);
      if (localStorage.getItem(`entry-vote-reason:${slug}`)) setRs("done");
    } catch {
      /* 隐私模式读不了 localStorage,当没投过 */
    }
  }, [slug]);

  function cast(v: Vote) {
    if (vote) return;
    try {
      localStorage.setItem(`entry-vote:${slug}`, v);
    } catch {
      /* 记不住也照常投票,只是可能重复 */
    }
    track("entry-vote", { slug, helpful: v === "up" });
    setVote(v);
  }

  async function submitReason() {
    const text = reason.trim();
    if (!text || rs === "sending") return;
    setRs("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, contact: "", page: `/entries/${slug}/` }),
      });
      if (!res.ok) throw new Error("bad status");
      try {
        localStorage.setItem(`entry-vote-reason:${slug}`, "1");
      } catch {
        /* 记不住只是可能重复追问,不影响功能 */
      }
      track("entry-vote-reason", { slug });
      setRs("done");
    } catch {
      setRs("error");
    }
  }

  if (vote) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
        <div>{vote === "up" ? "谢谢,收到你的肯定!" : "已记录,谢谢你指出来"}</div>
        {/* 👎 追问:一条可选的「为什么」,直投站长可见的反馈通道 */}
        {vote === "down" && rs !== "done" && (
          <div className="w-full max-w-sm text-left">
            <p className="text-xs">哪里不够好?说给我听,我来改(选填)</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="例如:某段讲得太跳跃、示例听不懂、想看 XX 的内容…"
              className="mt-1.5 w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-signature/50"
            />
            {rs === "error" && (
              <p className="mt-1 text-xs text-red-500">
                提交失败,稍后再试;也可以用页脚的邮箱或微信联系站长。
              </p>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                disabled={!reason.trim() || rs === "sending"}
                onClick={() => void submitReason()}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition hover:border-signature/50 hover:text-signature active:scale-95 disabled:opacity-50"
              >
                <Send className="size-3" />
                {rs === "sending" ? "提交中…" : "告诉站长"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
      <span>这个词条对你有帮助吗?</span>
      <span className="flex gap-2">
        <button
          type="button"
          onClick={() => cast("up")}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition hover:border-signature/50 hover:text-signature active:scale-95"
        >
          <ThumbsUp className="size-3.5" /> 有
        </button>
        <button
          type="button"
          onClick={() => cast("down")}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition hover:border-signature/50 hover:text-signature active:scale-95"
        >
          <ThumbsDown className="size-3.5" /> 没有
        </button>
      </span>
    </div>
  );
}

export default EntryVote;
