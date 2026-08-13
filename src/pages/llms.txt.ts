import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "@/lib/config";

// 生成 llms.txt(https://llmstxt.org/):给 AI 爬虫/大模型一个站点内容清单入口。
// 构建时从 content collections 自动生成,词条/路线新增后无需手动维护。
export const prerender = true;

export const GET: APIRoute = async () => {
  const [entries, paths] = await Promise.all([
    getCollection("entries", (e) => !e.data.draft),
    getCollection("paths", (p) => !p.data.draft),
  ]);

  const byTitle = (a: { data: { title: string } }, b: { data: { title: string } }) =>
    a.data.title.localeCompare(b.data.title, "zh");
  const entriesSorted = [...entries].sort(byTitle);
  const pathsSorted = [...paths].sort(byTitle);

  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `- [首页](${siteConfig.url}/): 站点首页`,
    `- [词条索引](${siteConfig.url}/entries/): 全部词条(${entriesSorted.length} 条)`,
    `- [学习路线](${siteConfig.url}/paths/): 按顺序的进阶路径(${pathsSorted.length} 条)`,
    "",
    "## 学习路线",
    "",
    ...pathsSorted.map(
      (p) => `- [${p.data.title}](${siteConfig.url}/paths/${p.id}): ${p.data.description}`,
    ),
    "",
    "## 词条",
    "",
    ...entriesSorted.map((e) => {
      const label = e.data.titleEn ? `${e.data.title} (${e.data.titleEn})` : e.data.title;
      return `- [${label}](${siteConfig.url}/entries/${e.id}): ${e.data.summary}`;
    }),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
