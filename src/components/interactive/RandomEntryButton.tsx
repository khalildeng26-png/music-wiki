import { Dices } from "lucide-react";
import * as React from "react";

type Props = {
  /** 全站词条 slug 列表(由 Astro 传入) */
  slugs: string[];
  /** 排除当前词条,避免"随机又随机到本篇" */
  exclude?: string;
  label?: string;
  className?: string;
};

/** 手气不错:随机跳去一篇词条(纯前端,无追踪)。 */
export function RandomEntryButton({
  slugs,
  exclude,
  label = "手气不错,随机看一篇",
  className,
}: Props) {
  function go() {
    const pool = exclude ? slugs.filter((s) => s !== exclude) : slugs;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    window.location.href = `/entries/${pick}`;
  }

  return (
    <button
      type="button"
      onClick={go}
      className={
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-signature " +
        (className ?? "")
      }
    >
      <Dices className="size-4" />
      {label}
    </button>
  );
}

export default RandomEntryButton;
