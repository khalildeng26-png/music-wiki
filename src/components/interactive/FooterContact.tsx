import { Check, Copy, X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const EMAIL = "khalildeng26@gmail.com";

/** footer 的「反馈与联系」列:邮箱点击复制 + 微信名片二维码。
 *  刻意只做「联系站长」而不做留言表单——自服务器收集用户内容会踩
 *  跟帖评论服务的线(之前右侧留言挂件就是因此被要求下线)。
 *  词条页 👎 投票后的「告诉我们哪里不够好」锚点也落在(#contact)这里。 */
export function FooterContact() {
  const [copied, setCopied] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      toast.success("邮箱已复制");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("复制失败,请手动选择复制");
    }
  }

  React.useEffect(() => {
    if (!qrOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQrOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [qrOpen]);

  return (
    <div id="contact" className="scroll-mt-24">
      <div className="text-sm font-medium">反馈与联系</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        {/* 地址即按钮,点哪都能复制;不裸挂 mailto,少喂爬虫 */}
        <button
          type="button"
          onClick={() => void copyEmail()}
          title="点击复制邮箱"
          className="inline-flex items-center gap-1 transition hover:text-signature"
        >
          {EMAIL}
          {copied ? <Check className="size-3.5 text-signature" /> : <Copy className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="inline-flex items-center gap-1.5 transition hover:text-signature"
        >
          <img
            src="/images/wechat-qr.png"
            alt=""
            className="size-5 rounded border border-current/20"
          />
          加站长微信
        </button>
      </div>

      {/* 名片放大层:电脑扫码、手机长按识别(QR 已含头像昵称,可直接识别) */}
      {qrOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-foreground/60 p-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="站长微信名片"
            onClick={() => setQrOpen(false)}
          >
            <img
              src="/images/wechat-card.jpg"
              alt="站长微信名片,扫码或长按识别加好友"
              // 420px 上限:超大屏不按原图(912px)显示——经 ZXing 验证,
              // 名片缩到 220-576px 档二维码全档可解,原尺寸反而解不出
              className="max-h-[72dvh] max-w-[min(85vw,420px)] rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-sm text-background/90">电脑扫码 · 手机长按识别加好友</p>
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              aria-label="关闭"
              className="absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-full bg-background/15 text-background transition hover:bg-background/30"
            >
              <X className="size-5" />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default FooterContact;
