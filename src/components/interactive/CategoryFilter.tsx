import { Loader2, Search, X } from "lucide-react";
import * as React from "react";

type Item = {
  slug: string;
  title: string;
  titleEn?: string;
  summary: string;
  tags: string[];
  kind: "encyclopedia" | "tutorial";
  series?: string;
};

/**
 * 分类页搜索框 + 结果渲染。
 * 无输入时完全隐藏结果区(静态词条列表由 Astro 服务端渲染,不受影响);
 * 一旦有词,客户端渲染过滤结果并隐藏静态列表(两个根节点切换 display)。
 */
export function CategoryFilter({ items, seriesNames }: { items: Item[]; seriesNames: Record<string, string> }) {
  const [q, setQ] = React.useState("");

  // 静态列表/结果列表由 id 约定切换显示
  React.useEffect(() => {
    const staticList = document.getElementById("cat-static-list");
    if (staticList) staticList.style.display = q.trim() ? "none" : "";
  }, [q]);

  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hits = terms.length
    ? items.filter((it) => {
        const hay = `${it.title} ${it.titleEn ?? ""} ${it.summary} ${it.tags.join(" ")}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
    : items;

  const ency = hits.filter((i) => i.kind === "encyclopedia");
  const tut = hits.filter((i) => i.kind === "tutorial");

  return (
    <div>
      <div className="mt-8 flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 transition focus-within:border-signature/50">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="在本分类内搜索词条……"
          aria-label="本分类内搜索"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="清空"
            className="text-muted-foreground transition hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {terms.length > 0 && (
        <div id="cat-filter-result">
          <p className="mt-6 text-sm text-muted-foreground">
            {hits.length > 0 ? `「${q.trim()}」命中 ${hits.length} 篇` : `本分类下没有匹配「${q.trim()}」的词条`}
          </p>
          {ency.length > 0 && <Grid items={ency} />}
          {tut.length > 0 && (
            <>
              <h3 className="mt-8 text-lg font-display font-semibold">学习路线</h3>
              <Grid items={tut.map((t) => ({ ...t, badge: t.series ? seriesNames[t.series] : undefined }))} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Grid({ items }: { items: (Item & { badge?: string })[] }) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <a
          key={it.slug}
          href={`/entries/${it.slug}`}
          className="group flex flex-col gap-1.5 rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-signature/50 hover:shadow-md"
        >
          {it.badge && (
            <span className="w-fit rounded-md bg-signature/10 px-2 py-0.5 text-xs font-medium text-signature">
              {it.badge}
            </span>
          )}
          <div className="font-display font-medium group-hover:text-signature">
            {it.title}
            {it.titleEn && <span className="ml-1.5 text-sm font-normal text-muted-foreground">{it.titleEn}</span>}
          </div>
          <div className="line-clamp-2 text-sm text-muted-foreground">{it.summary}</div>
        </a>
      ))}
    </div>
  );
}

export default CategoryFilter;
