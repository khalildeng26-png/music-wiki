import { Loader2, Search } from "lucide-react";
import * as React from "react";

import { rankMeta, type MetaEntry } from "@/lib/fuzzy";

type Result = { title: string; url: string; excerpt: string; tag?: string; html?: boolean };

/** 首页即时搜索:边输入边出下拉结果,点结果直达词条;回车进完整搜索页。
 *  两路召回合并:① 元数据模糊分词(标题/标签/分类,「吉他乐理」也能召回)
 *              ② Pagefind 全文命中(补正文里的匹配)。
 *  Pagefind 仅构建后可用;① 在 dev 下也工作,索引加载失败时回车降级跳 /search。 */
export function HomeSearch() {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pf = React.useRef<any>(null);
  const [meta, setMeta] = React.useState<MetaEntry[]>([]);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef(0);

  React.useEffect(() => {
    void (async () => {
      try {
        pf.current = await import(/* @vite-ignore */ "/pagefind/pagefind.js");
        await pf.current.init();
      } catch {
        pf.current = null; // dev 下没有索引,靠元数据模糊召回兜底
      }
    })();
    let alive = true;
    fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no index"))))
      .then((d: MetaEntry[]) => {
        if (alive && Array.isArray(d)) setMeta(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
      window.clearTimeout(debounceRef.current);
    };
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

  const norm = (u: string) => u.replace(/\/+$/, "");

  function onInput(v: string) {
    setQ(v);
    window.clearTimeout(debounceRef.current);
    if (!v.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    if (!pf.current && meta.length === 0) return; // 两路索引都未就绪:回车走降级
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const query = v.trim();

      // ① 元数据模糊召回(同步,排在前面——标题/标签命中的就是用户想找的)
      const merged: Result[] = rankMeta(query, meta)
        .slice(0, 4)
        .map((h) => ({
          title: h.entry.title,
          url: `/entries/${h.entry.slug}/`,
          excerpt: h.entry.summary,
          tag: h.entry.category,
        }));

      // ② Pagefind 全文命中补位(去重)
      if (pf.current) {
        try {
          const search = await pf.current.search(query);
          const seen = new Set(merged.map((m) => norm(m.url)));
          const data = await Promise.all(
            search.results
              .slice(0, 8)
              .map(
                (r: {
                  data: () => Promise<{ meta?: { title?: string }; url: string; excerpt?: string }>;
                }) => r.data(),
              ),
          );
          for (const d of data) {
            if (merged.length >= 6) break;
            if (seen.has(norm(d.url))) continue;
            seen.add(norm(d.url));
            merged.push({
              title: d.meta?.title ?? d.url,
              url: d.url,
              excerpt: d.excerpt ?? "",
              html: true,
            });
          }
        } catch {
          /* 全文失败只影响补位 */
        }
      }

      setResults(merged);
      setOpen(true);
      setHi(0);
      setLoading(false);
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
          aria-controls="home-search-results"
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
        <ul
          id="home-search-results"
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border bg-card shadow-lg"
        >
          {results.map((r, i) => (
            <li key={r.url}>
              <a
                href={r.url}
                onMouseEnter={() => setHi(i)}
                className={
                  "block px-4 py-3 transition " + (i === hi ? "bg-accent" : "hover:bg-accent/60")
                }
              >
                <div className="font-medium">
                  {r.tag && (
                    <span className="mr-1.5 text-xs font-normal text-signature">{r.tag}</span>
                  )}
                  {r.title}
                </div>
                {r.excerpt && (
                  <p
                    className="mt-0.5 line-clamp-1 text-sm text-muted-foreground [&_mark]:rounded [&_mark]:bg-signature/30 [&_mark]:px-0.5 [&_mark]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: r.html ? r.excerpt : escapeHtml(r.excerpt) }}
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

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export default HomeSearch;
