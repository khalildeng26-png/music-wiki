import { Search } from "lucide-react";
import * as React from "react";

/** 顶栏搜索入口:全站可达的搜索捷径。本体是指向 /search 的普通链接(无 JS 也能用);
 *  JS 就位后补 ⌘K / Ctrl+K 全局快捷键,并按平台显示正确的键帽。 */
export function HeaderSearch() {
  const [mod, setMod] = React.useState("Ctrl");

  React.useEffect(() => {
    setMod(navigator.platform.toUpperCase().includes("MAC") ? "⌘" : "Ctrl");
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.location.assign("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <a
      href="/search"
      aria-label="搜索词条"
      title="搜索词条"
      className="flex h-9 items-center gap-2 rounded-full border bg-card px-2.5 text-muted-foreground transition hover:border-signature/50 hover:text-signature-ink md:px-3.5"
    >
      <Search className="size-4" />
      <span className="hidden text-sm md:inline">搜索</span>
      <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] leading-none md:inline">
        {mod} K
      </kbd>
    </a>
  );
}

export default HeaderSearch;
