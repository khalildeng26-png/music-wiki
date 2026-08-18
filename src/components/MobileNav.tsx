import * as React from "react";

import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * 移动端导航:底部抽屉(bottom sheet)。
 * 固定在视口底部、只占一条,不随页面滚动;点遮罩/Esc 关闭,页面其余内容保持可见。
 */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="菜单"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-md transition hover:bg-muted active:scale-95"
      >
        <div className="relative size-4">
          <span
            className={cn(
              "absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100",
              open ? "top-[0.4rem] -rotate-45" : "top-1",
            )}
          />
          <span
            className={cn(
              "absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100",
              open ? "top-[0.4rem] rotate-45" : "top-2.5",
            )}
          />
        </div>
      </button>

      {open && (
        <>
          {/* 轻遮罩:点外部关闭,页面其余内容依然可见 */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* 底部抽屉:固定视口底部,只占内容高度,滚动页面不移动 */}
          <div
            role="dialog"
            aria-label="导航菜单"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t bg-card px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <nav aria-label="主导航" className="flex flex-col gap-1">
              {siteConfig.navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-xl font-medium transition hover:bg-muted active:scale-[0.98]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
