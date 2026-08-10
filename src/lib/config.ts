export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  author: {
    name: string;
    url: string;
  };
  navItems: {
    href: string;
    label: string;
    external?: boolean;
  }[];
};

// 品牌名「橙月Wiki」呼应域名 ambermoon.wiki(琥珀橙 + 月亮)。
export const siteConfig: SiteConfig = {
  name: "橙月Wiki",
  description: "一本可交互的音乐百科全书 —— 乐理、记谱、曲风,边读边练。",
  url: "http://localhost:4321",
  author: {
    name: "橙月Wiki",
    url: "https://ambermoon.wiki",
  },
  navItems: [
    { href: "/", label: "首页" },
    { href: "/entries", label: "词条" },
    { href: "/paths", label: "学习路线" },
  ],
};
