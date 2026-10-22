import * as React from "react";

import { track } from "@/lib/track";
import { GuitarNeck } from "@/components/interactive/GuitarNeck";
import { playChord, playNote } from "@/components/interactive/audio";
import { noteToMidi } from "@/components/interactive/noteUtils";
import { STRINGS } from "@/lib/chords";
import { matchChords, type MatchResult } from "@/lib/chord-match";
import { transposeNote } from "@/lib/transpose";

type Props = { label?: string };

/** 和弦反查(点格子版):在指板上点出按住的格子(含空弦),
 *  实时给出「这是什么和弦」的答案——精确、缺音、加音三种话术,
 *  候选可试听;同音异名(如 Dsus2/Asus4)按按法定夺。 */
export function ChordFinder({ label = "和弦反查:点出你按的格子,答案实时更新" }: Props) {
  // 已选格子:key "s:f" → 位置(Map 保插入序,chip 列表顺序稳定)
  const [sel, setSel] = React.useState<Map<string, { s: number; f: number }>>(new Map());
  // 弦高亮(试听时点亮对应弦,与 Guitar 同款反馈)
  const [flash, setFlash] = React.useState<ReadonlySet<number>>(new Set());

  function flashString(s: number) {
    setFlash((prev) => new Set(prev).add(s));
    window.setTimeout(
      () =>
        setFlash((prev) => {
          const nx = new Set(prev);
          nx.delete(s);
          return nx;
        }),
      200,
    );
  }

  function toggleCell(s: number, f: number) {
    const key = `${s}:${f}`;
    setSel((prev) => {
      const nx = new Map(prev);
      if (nx.has(key)) nx.delete(key);
      else nx.set(key, { s, f });
      return nx;
    });
    track("chord-finder", { what: "cell", id: key });
  }

  function clearSel() {
    setSel(new Map());
    track("chord-finder", { what: "clear" });
  }

  const positions = React.useMemo(() => [...sel.values()], [sel]);
  const notes = React.useMemo(
    () => positions.map(({ s, f }) => transposeNote(STRINGS[s], f)),
    [positions],
  );
  const results = React.useMemo(
    () => (positions.length ? matchChords(notes, 4, positions) : []),
    [notes, positions],
  );

  /** 选中音从低到高逐个短促弹响(听得清每个音),弦依次点亮。
   *  按音高(而非字母序)排:升/降号音名字母序与音高序不一致。 */
  function listenSel() {
    track("chord-finder", { what: "listen", n: notes.length });
    [...positions]
      .map(({ s, f }) => ({ s, note: transposeNote(STRINGS[s], f), midi: noteToMidi(transposeNote(STRINGS[s], f)) }))
      .sort((a, b) => a.midi - b.midi)
      .forEach(({ s, note }, i) => {
        window.setTimeout(() => {
          flashString(s);
          void playNote(note, 0.9, "guitar").catch(() => {});
        }, i * 130);
      });
  }

  /** 候选试听:弹该和弦标准按法的音 */
  function listenCand(m: MatchResult) {
    track("chord-finder", { what: "cand", id: m.chord.name });
    void playChord(
      m.chord.frets
        .map((f, s) => ({ f, s }))
        .filter(({ f }) => f >= 0)
        .map(({ s, f }) => transposeNote(STRINGS[s], f)),
      1.4,
      "guitar",
    ).catch(() => {});
  }

  // 主答案话术:精确=就是它;缺音=差一点;加音=某和弦加音
  function verdict(m: MatchResult): { head: string; detail: string } {
    if (m.kind === "exact") {
      return m.shapeMatch
        ? { head: `${m.chord.name}`, detail: "标准按法,分毫不差" }
        : { head: `${m.chord.name}`, detail: `这些音组成 ${m.chord.name}(按法与标准把位不同)` };
    }
    if (m.kind === "missing") {
      return {
        head: `差一点是 ${m.chord.name}`,
        detail: `还缺 ${m.missing.join("、")}`,
      };
    }
    return {
      head: `${m.chord.name} 加音`,
      detail: `在 ${m.chord.name} 上多了 ${m.extra.join("、")}`,
    };
  }

  const top = results[0];

  return (
    <figure className="not-prose overflow-hidden rounded-xl border bg-card">
      <figcaption className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
        {label}
      </figcaption>
      <div className="p-4">
        {/* 答案区:主判定大字 + 次候选;aria-live 让读屏即时播报 */}
        <div
          aria-live="polite"
          className="min-h-[76px] rounded-lg border border-signature/30 bg-signature/5 px-3 py-2.5"
        >
          {!top ? (
            <p className="py-2 text-sm text-muted-foreground">
              {positions.length
                ? "还没认出来——再点一两个格子,或换掉可疑的那个音。"
                : "在下方指板点出你按住的格子(空弦也点),答案会出现在这里。"}
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-bold tracking-tight text-signature">
                  {verdict(top).head}
                </span>
                <span className="text-sm text-muted-foreground">{verdict(top).detail}</span>
              </div>
              {results.length > 1 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">也可能是</span>
                  {results.slice(1).map((m) => (
                    <button
                      key={m.chord.name}
                      type="button"
                      onPointerDown={() => listenCand(m)}
                      title={`试听 ${m.chord.name}(${m.notes.join("-")})`}
                      className="rounded-full border px-2.5 py-0.5 text-muted-foreground transition hover:border-signature/50 hover:text-signature active:scale-95"
                    >
                      {m.chord.name}
                      {m.kind === "missing" && `(${m.missing.join("")}缺)`}
                      {m.kind === "extra" && `(+${m.extra.join("")})`}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 已选音 chips + 操作 */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">已选 {sel.size} 音</span>
          {positions.map(({ s, f }) => {
            const n = transposeNote(STRINGS[s], f);
            return (
              <button
                key={`${s}:${f}`}
                type="button"
                onClick={() => toggleCell(s, f)}
                title="点掉这个音"
                className="rounded-full border border-signature/60 bg-signature/10 px-2.5 py-0.5 font-mono text-signature transition hover:bg-signature/20 active:scale-95"
              >
                {n} ✕
              </button>
            );
          })}
          <span className="flex-1" />
          {sel.size > 0 && (
            <>
              <button
                type="button"
                onClick={listenSel}
                className="inline-flex items-center gap-1 rounded-full border border-signature/60 px-2.5 py-1 font-medium text-signature transition hover:bg-signature/10 active:scale-95"
              >
                ▶ 试听
              </button>
              <button
                type="button"
                onClick={clearSel}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-muted-foreground transition hover:border-signature/50 hover:text-signature active:scale-95"
              >
                清空
              </button>
            </>
          )}
        </div>

        {/* 指板:选中格子常亮琥珀圈 */}
        <div className="mt-3 border-t pt-3">
          <GuitarNeck
            activeChord={null}
            flash={flash}
            flashString={flashString}
            onCellClick={toggleCell}
            selected={sel.size ? new Set(sel.keys()) : undefined}
          />
        </div>
      </div>
    </figure>
  );
}

export default ChordFinder;
