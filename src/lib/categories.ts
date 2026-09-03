export type Category = {
  id: string; // URL slug
  label: string; // 显示名(与 entry.category 一致)
  desc: string;
  /** 分类色相(oklch hue):词条徽章圆点、分类页色点、首页 chip 圆点共用。
   *  (2026-09-03 图标 mark 字段已删:两版记谱法图标在 24-32px 下效果都不佳,
   *  分类身份统一由色相承载——一个语言,不并行两套) */
  hue: number;
};

// 琥珀(hue≈71)是全局签名色,分类色相整体避开它,只在小面积标记上使用
export const categories: Category[] = [
  { id: "theory", label: "乐理", desc: "音高、节奏、音程等音乐的基本规律", hue: 255 },
  { id: "notation", label: "记谱", desc: "五线谱、简谱、六线谱等记谱法", hue: 200 },
  { id: "harmony", label: "和声", desc: "和弦、进行与调性色彩", hue: 285 },
  { id: "genre", label: "曲风", desc: "流行、爵士、古典、民谣等流派", hue: 20 },
  { id: "instrument", label: "乐器", desc: "钢琴、吉他、中国传统乐器等", hue: 145 },
  { id: "vocal", label: "唱法", desc: "发声、咬字与演唱技巧", hue: 340 },
];

/** 分类色:亮色主题用深一档(需 3:1 对比度),暗色主题用亮一档 */
export function catColor(hue: number, mode: "light" | "dark" = "light") {
  return mode === "light" ? `oklch(0.52 0.12 ${hue})` : `oklch(0.78 0.12 ${hue})`;
}

export const categoryByLabel = Object.fromEntries(categories.map((c) => [c.label, c]));

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
