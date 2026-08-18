import { Loader2, Search } from "lucide-react";
import * as React from "react";

type Result = { title: string; url: string; excerpt: string };

/** 首页即时搜索:边输入边出下拉结果,点结果直达词条;回车进完整搜索页。
 *  Pagefind 索引仅构建后可用,加载失败时降级为提交跳 /search。 */
export function HomeSearch() {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pf = React.useRef<any>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef(0);

  React.useEffect(() => {
    void (async () => {
      try {
        pf.current = await import(/* @vite-ignore */ "/pagefind/pagefind.js");
        await pf.current.init();
      } catch {
        pf.current = null; // dev 下没有索引,降级为跳转搜索页
      }
    })();
    return () => window.clearTimeout(debounceRef.current);
  }, []);

  // 点框外收起下拉
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function onInput(v: string) {
    setQ(v);
    window.clearTimeout(debounceRef.current);
    if (!v.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    if (!pf.current) return; // 索引未就绪:输入不报错,回车走降级
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const search = await pf.current.search(v.trim());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await Promise.all(
          search.results
            .slice(0, 6)
            .map(
              (r: {
                data: () => Promise<{ meta?: { title?: string }; url: string; excerpt?: string }>;
              }) => r.data(),
            ),
        );
        setResults(
          data.map((d) => ({
            title: d.meta?.title ?? d.url,
            url: d.url,
            excerpt: d.excerpt ?? "",
          })),
        );
        setOpen(true);
        setHi(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);
  }

  function submit() {
    if (open && results.length > 0) {
      window.location.href = results[hi]?.url ?? "/search";
      return;
    }
    window.location.href = "/search?q=" + encodeURIComponent(q.trim());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && results.length) setOpen(true);
      setHi((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex min-w-0 items-center gap-3 rounded-lg border bg-card px-4 py-3 transition focus-within:border-signature/50"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length && setOpen(true)}
          placeholder="搜索词条、曲风、乐理……"
          aria-label="搜索"
          role="combobox"
          aria-expanded={open}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <kbd className="hidden shrink-0 rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline-block">
            回车
          </kbd>
        )}
      </form>

      {open && results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border bg-card shadow-lg">
          {results.map((r, i) => (
            <li key={r.url}>
              <a
                href={r.url}
                onMouseEnter={() => setHi(i)}
                className={
                  "block px-4 py-3 transition " + (i === hi ? "bg-accent" : "hover:bg-accent/60")
                }
              >
                <div className="font-medium">{r.title}</div>
                {r.excerpt && (
                  <p
                    className="mt-0.5 line-clamp-1 text-sm text-muted-foreground [&_mark]:rounded [&_mark]:bg-signature/30 [&_mark]:px-0.5 [&_mark]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: r.excerpt }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HomeSearch;
