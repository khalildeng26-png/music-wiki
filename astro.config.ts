// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const site = process.env.SITE ?? "https://ambermoon.wiki";
const base = process.env.BASE || "/";

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [
    react(),
    mdx(),
    sitemap({
      // /og/ 是分享卡模板页(截图用),不进 sitemap
      filter: (page) => !page.includes("/og/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // abcjs(~500kB)/Tone(~340kB)均为运行时动态 import(岛屿可见/点播放才加载),
      // 不占首屏;>500kB 警告与实际加载行为不符,抬高阈值避免误导。
      chunkSizeWarningLimit: 600,
    },
  },
});
