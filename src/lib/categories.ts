export type Category = {
  id: string; // URL slug
  label: string; // 显示名(与 entry.category 一致)
  desc: string;
  /** 分类色相(oklch hue):图标、词条徽章圆点、首页分类 chip 圆点共用 */
  hue: number;
  /**
   * 分类图标(内联 SVG 内容,44×44 viewBox,currentColor 单色双色阶)。
   * 整套取自记谱法语法:三段谱线 + 雕版音符(斜切椭圆符头/符干/符杠),
   * 每个分类取一个最有代表性的谱面记号;乐器例外,用键盘片段呼应首页 hero 钢琴。
   */
  mark: string;
};

// 共用:三段谱线(透明度压一档,让音符主体跳出来)
const STAFF =
  '<g opacity=".38" stroke-width="1.1"><path d="M5 15h34"/><path d="M5 21h34"/><path d="M5 27h34"/></g>';

// 共用:雕版符头(斜切椭圆,-22°)
const head = (cx: number, cy: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="3.1" ry="2.4" transform="rotate(-22 ${cx} ${cy})"/>`;

// 琥珀(hue≈71)是全局签名色,分类色相整体避开它,只在小面积标记上使用
export const categories: Category[] = [
  {
    id: "theory",
    label: "乐理",
    desc: "音高、节奏、音程等音乐的基本规律",
    hue: 255,
    // 上行级进:四个符头逐阶爬升,斜符杠收束——音高关系的阶梯
    mark: [
      STAFF,
      '<g fill="currentColor" stroke="none">',
      '<polygon points="10.6,8 34.6,3.5 34.6,6.7 10.6,11.2"/>',
      head(8, 27), head(16, 24), head(24, 21), head(32, 18),
      "</g>",
      '<g stroke-width="1.4">',
      '<path d="M10.6 11.2V27"/><path d="M18.6 9.7V24"/><path d="M26.6 8.2V21"/><path d="M34.6 6.7V19.5"/>',
      "</g>",
    ].join(""),
  },
  {
    id: "notation",
    label: "记谱",
    desc: "五线谱、简谱、六线谱等记谱法",
    hue: 200,
    // 空心全音符 + 终止细粗双线——"落到纸面的谱"
    mark: [
      STAFF,
      '<ellipse cx="16" cy="24" rx="3.9" ry="2.9" fill="none" stroke-width="1.6" transform="rotate(-22 16 24)"/>',
      '<path d="M31 15v12" stroke-width="1.2"/>',
      '<path d="M34.3 15v12" stroke-width="2.8"/>',
    ].join(""),
  },
  {
    id: "harmony",
    label: "和声",
    desc: "和弦、进行与调性色彩",
    hue: 285,
    // 柱式三和弦:三个符头叠在一根符干上
    mark: [
      STAFF,
      '<path d="M20.6 8.5V27" stroke-width="1.4"/>',
      '<g fill="currentColor" stroke="none">',
      head(18, 27), head(18, 21), head(18, 15),
      "</g>",
    ].join(""),
  },
  {
    id: "genre",
    label: "曲风",
    desc: "流行、爵士、古典、民谣等流派",
    hue: 20,
    // 均分符杠保住脉搏,重音记号给"劲儿"——风格即律动
    mark: [
      STAFF,
      '<g fill="currentColor" stroke="none">',
      '<polygon points="14.6,13 28.6,13 28.6,16.2 14.6,16.2"/>',
      head(12, 27), head(26, 24),
      "</g>",
      '<g stroke-width="1.4">',
      '<path d="M14.6 15.8V27"/><path d="M28.6 15.8V24"/>',
      "</g>",
      '<path d="M23 5.5 L29.5 7.3 L23 9.1" fill="none" stroke-width="1.5"/>',
    ].join(""),
  },
  {
    id: "instrument",
    label: "乐器",
    desc: "钢琴、吉他、中国传统乐器等",
    hue: 145,
    // 键盘片段:两黑三白(真实键盘的 2+3 分组),呼应首页 hero 的钢琴
    mark: [
      '<rect x="9" y="11" width="24" height="22" rx="1.5" fill="none" stroke-width="1.3"/>',
      '<path d="M17 23.5V33M25 23.5V33" stroke-width="1.3"/>',
      '<g fill="currentColor" stroke="none">',
      '<rect x="15.1" y="11" width="3.8" height="12.5" rx="0.9"/>',
      '<rect x="23.1" y="11" width="3.8" height="12.5" rx="0.9"/>',
      "</g>",
    ].join(""),
  },
  {
    id: "vocal",
    label: "唱法",
    desc: "发声、咬字与演唱技巧",
    hue: 340,
    // 音符 + 换气记号(V 形逗号,声乐谱面独有的呼吸指令);逗号缩到 78% 并贴近符干上方
    mark: [
      STAFF,
      '<path d="M16.6 10.5V26" stroke-width="1.4"/>',
      '<g fill="currentColor" stroke="none">',
      head(14, 26),
      '<g transform="translate(27.5 10.5) scale(0.78) translate(-27.5 -10.5)">',
      '<path d="M30.2 4.8 C 27.2 4.8 25.2 6.8 25.2 9 C 25.2 10.6 26.3 11.7 27.6 11.7 C 26.5 13.3 24.7 14.8 22.5 16.1 L 23.3 17.5 C 27.5 15.7 31.2 12.2 31.2 8.6 C 31.2 6.3 31.6 4.8 30.2 4.8 Z"/>',
      "</g>",
      "</g>",
    ].join(""),
  },
];

/** 分类色:亮色主题用深一档(需 3:1 对比度),暗色主题用亮一档 */
export function catColor(hue: number, mode: "light" | "dark" = "light") {
  return mode === "light" ? `oklch(0.52 0.12 ${hue})` : `oklch(0.78 0.12 ${hue})`;
}

export const categoryByLabel = Object.fromEntries(categories.map((c) => [c.label, c]));

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
