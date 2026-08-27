import * as React from "react";

import { TRANSPOSE_STEPS } from "@/lib/transpose";

/** 一键换调选择器:半音偏移 ±5(采样舒适区),当前值琥珀高亮。 */
export function TransposePicker({
  value,
  onChange,
  label = "换调",
}: {
  value: number;
  onChange: (semis: number) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-xs text-muted-foreground">{label}</span>
      {TRANSPOSE_STEPS.map(({ semis, label: l }) => (
        <button
          key={semis}
          type="button"
          onClick={() => onChange(semis)}
          aria-pressed={value === semis}
          title={l}
          className={
            "rounded-md border px-2 py-1 font-mono text-xs tabular-nums transition active:scale-95 " +
            (value === semis
              ? "border-signature bg-signature/10 font-medium text-signature-ink"
              : "bg-card text-muted-foreground hover:border-signature/50 hover:text-signature-ink")
          }
        >
          {semis === 0 ? "原调" : semis > 0 ? `+${semis}` : `${semis}`}
        </button>
      ))}
    </div>
  );
}

export default TransposePicker;
