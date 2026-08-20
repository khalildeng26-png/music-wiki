import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// 搜索元数据索引:标题/译名/分类/摘要/标签。
// 供 HomeSearch / SearchBox 客户端模糊召回用(见 src/lib/fuzzy.ts),与 Pagefind 全文互补。
export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = await getCollection("entries", (e) => !e.data.draft);
  const index = entries.map((e) => ({
    slug: e.id,
    title: e.data.title,
    titleEn: e.data.titleEn ?? "",
    category: e.data.category,
    summary: e.data.summary,
    tags: e.data.tags,
  }));
  return new Response(JSON.stringify(index), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
