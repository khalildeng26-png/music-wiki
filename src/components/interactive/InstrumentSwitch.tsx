import { Guitar as GuitarIcon, Piano as PianoIcon } from "lucide-react";
import * as React from "react";

import { track } from "@/lib/track";

import Guitar from "./Guitar";
import Piano from "./Piano";

type Props = {
  /** 两种乐器卡片的标题 */
  pianoLabel?: string;
  guitarLabel?: string;
  startOct?: number;
  octaves?: number;
  keyHeight?: number | string;
  minWidth?: number;
};

/** 乐器切换台:首页同一块地盘,钢琴/吉他二选一(分段钮切换)。
 *  只挂载当前乐器,另一个随切换卸载——两套键盘绑键(A–L 字母排双方都在用)
 *  与全屏态互不残留、互不抢键。 */
export function InstrumentSwitch({
  pianoLabel,
  guitarLabel,
  startOct = 4,
  octaves = 2,
  keyHeight = 256,
  minWidth,
}: Props) {
  const [inst, setInst] = React.useState<"piano" | "guitar">("piano");

  function switchTo(next: "piano" | "guitar") {
    if (next === inst) return;
    setInst(next);
    track("instrument-switch", { to: next });
  }

  return (
    <div>
      {/* 分段钮放进乐器卡的标题栏右侧(切换即换整张卡) */}
      {(() => {
        const tabs = (
          <div role="tablist" aria-label="选择乐器" className="shrink-0">
            <div className="inline-flex rounded-full border bg-card p-0.5 text-xs">
              {(
                [
                  ["piano", "钢琴", PianoIcon],
                  ["guitar", "吉他", GuitarIcon],
                ] as const
              ).map(([key, name, Icon]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={inst === key}
                  onClick={() => switchTo(key)}
                  className={
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 transition active:scale-95 " +
                    (inst === key
                      ? "bg-signature text-signature-foreground"
                      : "text-muted-foreground hover:text-signature")
                  }
                >
                  <Icon className="size-3.5" /> {name}
                </button>
              ))}
            </div>
          </div>
        );
        return inst === "piano" ? (
          <Piano
            startOct={startOct}
            octaves={octaves}
            keyHeight={keyHeight}
            minWidth={minWidth}
            label={pianoLabel}
            headerExtra={tabs}
          />
        ) : (
          <Guitar label={guitarLabel} headerExtra={tabs} />
        );
      })()}
    </div>
  );
}

export default InstrumentSwitch;
