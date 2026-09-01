import { ArrowRight } from "lucide-react";
import * as React from "react";

import { PlayChip, type SoundSig } from "./PlayableCards";

type Candidate = {
  title: string;
  category: string;
  /** 一句钩子:为什么今天值得点进去 */
  hook: string;
  href: string;
  sig?: SoundSig;
  /** 试听时的一句解说:「你在听到什么」 */
  sigNote?: string;
};

/** 今日词条:按当天日期在候选里轮换(客户端取日期,每天一换、当天刷新稳定)。 */
export function DailyEntry({ candidates }: { candidates: Candidate[] }) {
  const pick = React.useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    return candidates[dayOfYear % candidates.length];
  }, [candidates]);

  if (!pick) return null;

  // 整卡是链接(点哪都进词条);角上的试听键是覆盖层兄弟节点,点了只发声不跳转
  return (
    <div className="relative">
      <a
        href={pick.href}
        className="group block overflow-hidden rounded-2xl border border-l-4 border-signature/30 border-l-signature bg-signature/5 p-6 transition hover:border-signature/60 hover:border-l-signature hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signature sm:p-8"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-signature-ink">
          <span className="inline-flex size-2 rounded-full bg-signature" />
          今日词条
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pr-14">
          <span className="text-2xl font-bold tracking-tight transition-colors group-hover:text-signature sm:text-3xl">
            {pick.title}
            <ArrowRight className="ml-2 inline size-5 -translate-y-1 transition-transform group-hover:translate-x-1 group-hover:text-signature" />
          </span>
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {pick.hook}
        </p>
        <div className="mt-3 text-xs text-muted-foreground">
          {pick.category} · 每天换一篇,明天见
        </div>
      </a>
      {pick.sig && (
        <div className="absolute right-5 bottom-5 sm:right-7 sm:bottom-7">
          <PlayChip sig={pick.sig} label={`试听:${pick.title}`} caption={pick.sigNote} />
        </div>
      )}
    </div>
  );
}

export default DailyEntry;
