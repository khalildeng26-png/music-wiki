export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  author: {
    name: string;
    url: string;
  };
  links: {
    github: string;
  };
  navItems: {
    href: string;
    label: string;
    external?: boolean;
  }[];
};

// TODO: 产品名「音乐百科」为占位,后续可改。
export const siteConfig: SiteConfig = {
  name: "音乐百科",
  description: "一本可交互的音乐百科全书 —— 乐理、记谱、曲风,边读边练。",
  url: "http://localhost:4321",
  author: {
    name: "音乐百科",
    url: "https://example.com",
  },
  links: {
    github: "https://github.com/",
  },
  navItems: [
    { href: "/", label: "首页" },
    { href: "/entries", label: "词条" },
    { href: "/paths", label: "学习路线" },
  ],
};
