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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-signature/30 bg-signature/5 p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm font-medium text-signature">
        <span className="inline-flex size-2 rounded-full bg-signature" />
        今日词条
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pr-14">
        <a href={pick.href} className="group text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="group-hover:text-signature">{pick.title}</span>
          <ArrowRight className="ml-2 inline size-5 -translate-y-1 transition-transform group-hover:translate-x-1 group-hover:text-signature" />
        </a>
        {pick.sig && (
          <div className="absolute right-5 bottom-5 sm:right-7 sm:bottom-7">
            <PlayChip sig={pick.sig} label={`试听:${pick.title}`} />
          </div>
        )}
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {pick.hook}
      </p>
      <div className="mt-3 text-xs text-muted-foreground">{pick.category} · 每天换一篇,明天见</div>
    </div>
  );
}

export default DailyEntry;
