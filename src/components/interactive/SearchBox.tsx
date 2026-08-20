import { Loader2, Search } from "lucide-react";
import * as React from "react";

import { rankMeta, type MetaEntry } from "@/lib/fuzzy";

type Result = { title: string; url: string; excerpt: string; tag?: string; html?: boolean };

const SUGGESTIONS = ["吉他", "音阶", "布鲁斯", "五线谱", "和弦"];

/** 全文搜索框:两路召回合并——元数据模糊分词(标题/标签/分类/摘要)
 *  + Pagefind 全文(仅构建产物/preview/线上可用,dev 下由前者兜底)。 */
export function SearchBox({ initial = "" }: { initial?: string }) {
  const [q, setQ] = React.useState(initial);
  const [results, setResults] = React.useState<Result[]>([]);
  const [status, setStatus] = React.useState<"idle" | "loading" | "done">("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pf = React.useRef<any>(null);
  const [pfReady, setPfReady] = React.useState(false);
  const [meta, setMeta] = React.useState<MetaEntry[]>([]);
  const [metaTried, setMetaTried] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    void (async () => {
      try {
        pf.current = await import(/* @vite-ignore */ "/pagefind/pagefind.js");
        await pf.current.init();
        setPfReady(true);
      } catch {
        pf.current = null; // dev 下没有全文索引,模糊召回兜底
      }
    })();
    let alive = true;
    fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no index"))))
      .then((d: MetaEntry[]) => {
        if (alive && Array.isArray(d)) setMeta(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setMetaTried(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setStatus("idle");
      return;
    }
    // 两路索引都未就绪时先不出结果,谁先到位谁触发重跑
    if (!pfReady && !meta.length) return;
    let cancelled = false;
    setStatus("loading");
    const t = window.setTimeout(async () => {
      const norm = (u: string) => u.replace(/\/+$/, "");

      // ① 元数据模糊召回(「吉他乐理」这类非整词查询靠它)
      const merged: Result[] = rankMeta(query, meta).map((h) => ({
        title: h.entry.title,
        url: `/entries/${h.entry.slug}/`,
        excerpt: h.entry.summary,
        tag: h.entry.category,
      }));

      // ② Pagefind 全文补位(去重)
      if (pf.current) {
        try {
          const search = await pf.current.search(query);
          const seen = new Set(merged.map((m) => norm(m.url)));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = await Promise.all(search.results.slice(0, 30).map((r: any) => r.data()));
          for (const d of data) {
            if (seen.has(norm(d.url))) continue;
            seen.add(norm(d.url));
            merged.push({
              title: d.meta?.title ?? d.url,
              url: d.url,
              excerpt: d.excerpt,
              html: true,
            });
          }
        } catch {
          /* 全文失败只影响补位 */
        }
      }

      if (!cancelled) {
        setResults(merged);
        setStatus("done");
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, pfReady, meta]);

  const noSource = metaTried && !pfReady && meta.length === 0;

  return (
    <div>
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 focus-within:border-signature/50">
        <Search className="size-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索词条、曲风、乐理……"
          className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
        />
        {status === "loading" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      {noSource && (
        <p className="mt-4 text-sm text-muted-foreground">
          搜索索引加载失败,请刷新重试;完整全文搜索请用{" "}
          <code className="rounded bg-muted px-1">npm run preview</code> 预览构建产物。
        </p>
      )}

      {status === "done" && (
        <p className="mt-3 text-sm text-muted-foreground">
          {results.length > 0
            ? `找到 ${results.length} 条结果`
            : `没有找到「${q}」相关的内容,换个说法试试:`}
        </p>
      )}
      {status === "done" && results.length === 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQ(s)}
              className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground transition hover:border-signature/50 hover:text-signature"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {results.map((r) => (
          <li key={r.url}>
            <a
              href={r.url}
              className="block rounded-lg border bg-card p-4 transition hover:border-signature/50"
            >
              <div className="font-medium hover:text-signature">
                {r.tag && <span className="mr-1.5 text-xs font-normal text-signature">{r.tag}</span>}
                {r.title}
              </div>
              {r.excerpt && (
                <p
                  className="mt-1 line-clamp-2 text-sm text-muted-foreground [&_mark]:rounded [&_mark]:bg-signature/30 [&_mark]:px-0.5 [&_mark]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: r.html ? r.excerpt : escapeHtml(r.excerpt) }}
                />
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export default SearchBox;
