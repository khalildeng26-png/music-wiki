// 轻量模糊检索:对标题/译名/标签/分类/摘要按词元匹配打分。
// 定位是补 Pagefind(整词全文)召回不到的场景:比如「吉他乐理」不是整词,
// 全文索引搜不到,但分词后应该召回所有「吉他」词条 + 「乐理」分类词条。

export type MetaEntry = {
  slug: string;
  title: string;
  titleEn?: string;
  category: string;
  summary: string;
  tags: string[];
};

export type MetaHit = { entry: MetaEntry; score: number };

type Token = { t: string; w: number };

/** 分词:按空白/常见分隔切开;≥3 个汉字的词再补一组 2 字滑窗(权重打折)。
 *  「吉他乐理」→ 吉他/他乐/乐理,其中 吉他 和 乐理 命中、他乐 自然落空。 */
function tokenize(q: string): Token[] {
  const raw = q.toLowerCase().split(/[\s,、,。;;/|·]+/).filter(Boolean);
  const out: Token[] = [];
  for (const t of raw) {
    out.push({ t, w: 1 });
    if (/^[一-鿿]{3,}$/.test(t)) {
      for (let i = 0; i + 2 <= t.length; i++) out.push({ t: t.slice(i, i + 2), w: 0.6 });
    }
  }
  // 同词元去重,保留权重高的一次(整词 > 滑窗)
  const map = new Map<string, number>();
  for (const { t, w } of out) map.set(t, Math.max(map.get(t) ?? 0, w));
  return [...map].map(([t, w]) => ({ t, w }));
}

function scoreEntry(entry: MetaEntry, tokens: Token[]): number {
  const title = entry.title.toLowerCase();
  const titleEn = (entry.titleEn ?? "").toLowerCase();
  const summary = entry.summary.toLowerCase();
  const tags = entry.tags.map((t) => t.toLowerCase());
  const category = entry.category.toLowerCase();

  let score = 0;
  for (const { t, w } of tokens) {
    // 单个西文字母(C 大调的"c")噪声太大,不参与打分;单个汉字有意义,保留
    if (t.length < 2 && !/[一-鿿]/.test(t)) continue;

    let s = 0;
    if (title === t) s = 100;
    else if (title.startsWith(t)) s = 70;
    else if (title.includes(t)) s = 50;
    else if (tags.includes(t)) s = 40;
    else if (titleEn && titleEn.includes(t)) s = 35;
    else if (tags.some((tag) => tag.includes(t))) s = 28;
    else if (category === t) s = 26;
    else if (summary.includes(t)) s = 12;

    if (s) score += s * w;
  }
  return score;
}

/** 返回按相关度降序的命中(>0 分);并列时短标题优先(更"正主")。 */
export function rankMeta(q: string, index: MetaEntry[]): MetaHit[] {
  const tokens = tokenize(q);
  if (!tokens.length) return [];
  return index
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
    .filter((h) => h.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.entry.title.length - b.entry.title.length ||
        a.entry.slug.localeCompare(b.entry.slug),
    );
}
