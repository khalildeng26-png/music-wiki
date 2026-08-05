import {
  FileMusic,
  Layers,
  Mic,
  Music2,
  Piano,
  Radio,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  id: string; // URL slug
  label: string; // 显示名(与 entry.category 一致)
  desc: string;
  icon: LucideIcon;
};

export const categories: Category[] = [
  { id: "theory", label: "乐理", desc: "音高、节奏、音程等音乐的基本规律", icon: Music2 },
  { id: "notation", label: "记谱", desc: "五线谱、简谱、六线谱等记谱法", icon: FileMusic },
  { id: "harmony", label: "和声", desc: "和弦、进行与调性色彩", icon: Layers },
  { id: "genre", label: "曲风", desc: "流行、爵士、古典、民谣等流派", icon: Radio },
  { id: "instrument", label: "乐器", desc: "钢琴、吉他与管弦乐器", icon: Piano },
  { id: "vocal", label: "唱法", desc: "发声、咬字与演唱技巧", icon: Mic },
];

export const categoryByLabel = Object.fromEntries(
  categories.map((c) => [c.label, c]),
);

export const categoryById = Object.fromEntries(
  categories.map((c) => [c.id, c]),
);
