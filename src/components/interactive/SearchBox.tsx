import * as React from "react";
import { Loader2, Search } from "lucide-react";

type Result = { title: string; url: string; excerpt: string };

/** 全文搜索框:调用 Pagefind 索引(仅在构建产物/preview/线上可用,dev 下优雅降级)。 */
export function SearchBox({ initial = "" }: { initial?: string }) {
  const [q, setQ] = React.useState(initial);
  const [results, setResults] = React.useState<Result[]>([]);
  const [ready, setReady] = React.useState(false);
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "done" | "unavailable"
  >("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pf = React.useRef<any>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    void (async () => {
      try {
        pf.current = await import(/* @vite-ignore */ "/pagefind/pagefind.js");
        await pf.current.init();
        setReady(true);
      } catch {
        pf.current = null;
        setStatus("unavailable");
      }
    })();
  }, []);

  // ready 变化时也重跑,修掉"先输入、后加载完"导致搜索被跳过的竞态
  React.useEffect(() => {
    if (!ready || !pf.current) return;
    const query = q.trim();
    if (!query) {
      setResults([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const t = window.setTimeout(async () => {
      try {
        const search = await pf.current.search(query);
        const data = await Promise.all(
          search.results.slice(0, 30).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (r: any) => r.data(),
          ),
        );
        if (!cancelled) {
          setResults(
            data.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (d: any) => ({
                title: d.meta?.title ?? d.url,
                url: d.url,
                excerpt: d.excerpt,
              }),
            ),
          );
          setStatus("done");
        }
      } catch {
        if (!cancelled) setStatus("done");
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, ready]);

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
        {status === "loading" && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {status === "unavailable" && (
        <p className="mt-4 text-sm text-muted-foreground">
          搜索索引在构建后生成。请用{" "}
          <code className="rounded bg-muted px-1">npm run preview</code>{" "}
          预览构建产物来使用搜索(开发模式 <code className="rounded bg-muted px-1">dev</code> 下不可用)。
        </p>
      )}

      {pf.current && status === "done" && (
        <p className="mt-3 text-sm text-muted-foreground">
          {results.length > 0
            ? `找到 ${results.length} 条结果`
            : `没有找到「${q}」相关的内容`}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {results.map((r) => (
          <li key={r.url}>
            <a
              href={r.url}
              className="block rounded-lg border bg-card p-4 transition hover:border-signature/50"
            >
              <div className="font-medium hover:text-signature">{r.title}</div>
              {r.excerpt && (
                <p
                  className="mt-1 text-sm text-muted-foreground [&_mark]:rounded [&_mark]:bg-signature/30 [&_mark]:px-0.5 [&_mark]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: r.excerpt }}
                />
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchBox;
