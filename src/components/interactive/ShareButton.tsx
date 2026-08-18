import { Share2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type Props = {
  /** 分享文案里的标题(词条名) */
  title: string;
  className?: string;
};

/** 分享按钮:移动端走系统分享面板,否则复制「标题 + 链接」到剪贴板。 */
export function ShareButton({ title, className }: Props) {
  const [copied, setCopied] = React.useState(false);

  async function share() {
    const url = window.location.href;
    const text = `${title} · 橙月Wiki`;
    // 移动端优先调起系统分享面板
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // 用户取消面板不算错误,落到复制
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      toast.success("链接已复制,粘贴给朋友吧");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("复制失败,请手动复制地址栏链接");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={
        "inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition hover:border-signature/50 hover:text-signature active:scale-95 " +
        (className ?? "")
      }
    >
      <Share2 className="size-4" />
      {copied ? "已复制" : "分享这篇"}
    </button>
  );
}

export default ShareButton;
