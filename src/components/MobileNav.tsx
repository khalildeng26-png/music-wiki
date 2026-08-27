import { Search } from "lucide-react";
import * as React from "react";

import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const EXIT_MS = 260;

/**
 * 移动端导航:顶部下拉抽屉(top sheet)。
 * 挂在顶栏正下方、固定不随页面滚动;打开时自屏幕顶部向下拉出,
 * 内容(链接 → 拖动条)依次落位;关闭时收回顶部后再卸载。
 */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  // render=是否挂载(含退场动画期);shown=过渡目标态(驱动 transform/opacity)
  const [render, setRender] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const timer = React.useRef(0);

  const show = React.useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(true);
    setRender(true);
    // 双 rAF 确保初始态(收起)先完成布局,再加目标态触发过渡
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, []);

  const hide = React.useCallback(() => {
    setShown(false);
    setOpen(false);
    // 等滑出动画结束再卸载
    timer.current = window.setTimeout(() => setRender(false), EXIT_MS);
  }, []);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  // 打开期间锁住背景滚动(触碰遮罩即关闭,不给穿透滚动留机会)
  React.useEffect(() => {
    if (!render) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [render]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hide]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="菜单"
        aria-expanded={open}
        onClick={() => (open ? hide() : show())}
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

      {render && (
        <>
          {/* 遮罩:从顶栏下方开始(顶栏保持明亮),触碰即收回,禁止穿透滚动 */}
          <div
            className={cn(
              "fixed inset-x-0 top-[var(--header-height)] bottom-0 z-50 touch-none bg-black/20 transition-opacity duration-250",
              shown ? "opacity-100" : "opacity-0",
            )}
            onPointerDown={hide}
            aria-hidden="true"
          />
          {/* 顶部下拉抽屉:挂在顶栏下方,自屏幕顶部向下拉出;空白处点击也收回;阴影只向下投,不蹭顶栏 */}
          <div
            role="dialog"
            aria-label="导航菜单"
            onClick={(e) => {
              if (!e.target.closest("a")) hide();
            }}
            className={cn(
              "fixed inset-x-0 top-[var(--header-height)] z-50 rounded-b-2xl border-b bg-surface px-6 pt-4 pb-5",
              "shadow-[0_16px_40px_-12px_rgb(0_0_0/0.28)]",
              "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
              shown ? "translate-y-0" : "-translate-y-full",
            )}
          >
            {/* 内容依次落位:搜索 → 链接 → 拖动条 */}
            <nav aria-label="主导航" className="flex flex-col gap-1">
              {/* 搜索是工具不是分类,做成抽屉内独立的浅色行,与导航链接区分开 */}
              <a
                href="/search"
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-base text-muted-foreground transition-all duration-300 hover:border-signature/50 hover:text-signature-ink active:scale-[0.98] motion-reduce:transition-none",
                  shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
                )}
                style={{ transitionDelay: shown ? "100ms" : "0ms" }}
              >
                <Search className="size-4" />
                搜索词条、曲风、乐理……
              </a>
              {siteConfig.navItems.map((item, i) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-xl font-medium transition-all duration-300 hover:bg-muted active:scale-[0.98] motion-reduce:transition-none",
                    shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
                  )}
                  style={{ transitionDelay: shown ? `${170 + i * 70}ms` : "0ms" }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div
              className={cn(
                "mx-auto mt-4 h-1 w-10 rounded-full bg-foreground/20 transition-all duration-300 motion-reduce:transition-none",
                shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
              )}
              style={{ transitionDelay: shown ? "390ms" : "0ms" }}
            />
          </div>
        </>
      )}
    </div>
  );
}
