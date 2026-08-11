import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// 词条:百科的原子(非线性,可检索、可关联跳转)
const entries = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/entries" }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(), // 英文译名,展示在中文标题之后
    category: z.enum(["乐理", "记谱", "和声", "曲风", "乐器", "唱法"]),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

// 学习路线:把词条按顺序串成建议路径(线性引导,叠加在百科之上)
const paths = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/paths" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    steps: z.array(z.string()), // entry id 的有序列表
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { entries, paths };
