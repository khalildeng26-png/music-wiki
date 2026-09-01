import { ThumbsDown, ThumbsUp } from "lucide-react";
import * as React from "react";

import { track } from "@/lib/track";

type Vote = "up" | "down";

/** 词条底部的「有帮助吗」投票:事件进 umami 聚合看板,零服务器存储、
 *  零公开展示——不走用户文字内容,不踩跟帖评论服务的线。
 *  👎 之后给「说说哪里不够好 →」锚到 footer 联系方式,把定量/定性接起来。 */
export function EntryVote({ slug }: { slug: string }) {
  const [vote, setVote] = React.useState<Vote | null>(null);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(`entry-vote:${slug}`);
      if (v === "up" || v === "down") setVote(v);
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

  if (vote) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm text-muted-foreground">
        {vote === "up" ? "谢谢,收到你的肯定!" : "已记录,谢谢你指出来"}
        {vote === "down" && (
          <a href="#contact" className="text-signature hover:underline">
            说说哪里不够好 →
          </a>
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
