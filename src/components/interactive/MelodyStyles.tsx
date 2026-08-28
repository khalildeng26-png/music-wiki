import { Play, Square } from "lucide-react";
import * as React from "react";

import { STYLES } from "@/lib/melodyStyles";

import { onAudioInterrupt, playPattern, stopAllAudio } from "./audio";
import { TransposePicker } from "./TransposePicker";

/** 首页「一首卡农,六种曲风」:同一段旋律一键换风格,听懂"曲风"到底是什么。
 *  播放中再点同款=停止,点别款=自动切歌(引擎全局互斥)。
 *  附 ±5 半音换调:同一套和弦关系搬到任何调都成立——这正是「调」的本质。 */
export function MelodyStyles() {
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [last, setLast] = React.useState<string>(STYLES[0].id);
  const [semis, setSemis] = React.useState(0);
  const timer = React.useRef(0);
  // 自己启动播放的瞬间,playPattern 会先广播一次"打断"——那一次要忽略
  const starting = React.useRef(false);
  // 播放会话号:被新播放取代后,旧的 await 醒来不得再动状态
  const session = React.useRef(0);

  React.useEffect(() => {
    const off = onAudioInterrupt(() => {
      if (starting.current) return;
      session.current++;
      window.clearTimeout(timer.current);
      setPlaying(null);
    });
    return () => {
      off();
      window.clearTimeout(timer.current);
    };
  }, []);

  // overrideSemis:换调重播时显式传入——此时 setSemis 还没提交,闭包里的 semis 是旧值
  async function play(id: string, overrideSemis?: number) {
    if (playing === id && overrideSemis === undefined) {
      stopAllAudio(); // 回调自动复位
      return;
    }
    const style = STYLES.find((s) => s.id === id);
    if (!style) return;
    const my = ++session.current;
    starting.current = true;
    setPlaying(id);
    setLast(id);
    // playPattern 的同步"自打断"广播发生在调用内部,微任务后即解除豁免(否则播放中无法停止)
    void Promise.resolve().then(() => (starting.current = false));
    try {
      await playPattern(style.pattern, { transpose: overrideSemis ?? semis }); // 引擎先打断已有播放(广播被 starting 挡下)
      if (my !== session.current) return; // 期间又被取代
      // playPattern 在播完时 resolve,这里只留一点采样收尾余量
      timer.current = window.setTimeout(() => setPlaying(null), 600);
    } catch {
      if (my === session.current) {
        starting.current = false;
        setPlaying(null);
      }
    }
  }

  // 播放中换调:立刻打断并以新调重播当前风格;没在播就只记账,等下次开播生效
  function onTranspose(v: number) {
    setSemis(v);
    if (playing) void play(playing, v);
  }

  const active = STYLES.find((s) => s.id === (playing ?? last));

  return (
    <figure className="not-prose overflow-hidden rounded-2xl border bg-card">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-semibold">和弦进行</span>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            C – G – Am – Em – F – C – F – G
          </span>
          <a
            href="/entries/pop-progressions"
            className="text-xs text-muted-foreground hover:text-signature"
          >
            (卡农进行:无数流行歌的祖先)
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STYLES.map((s) => {
            const on = playing === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => void play(s.id)}
                aria-label={on ? `停止${s.name}版` : `试听${s.name}版`}
                aria-pressed={on}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition active:scale-95 " +
                  (on
                    ? "play-pulse border-signature bg-signature text-signature-foreground"
                    : "bg-card hover:border-signature/50 hover:text-signature")
                }
              >
                {on ? <Square className="size-3" /> : <Play className="size-3.5" />}
                {s.name}
              </button>
            );
          })}
        </div>

        {active && (
          <p className="mt-4 min-h-6 text-sm text-muted-foreground">
            <span className="font-medium text-signature-ink">{active.name}版</span>
            <span className="mx-1.5">·</span>
            {active.desc}
          </p>
        )}

        <div className="mt-4 border-t pt-3">
          <TransposePicker value={semis} onChange={onTranspose} label="换个调弹(关系不变)" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            播放中换调会立刻用新调重播:同一套和弦关系原样搬到新调——这就是「调」的全部秘密。
          </p>
        </div>
      </div>
      <figcaption className="border-t bg-muted/40 px-5 py-1.5 text-xs text-muted-foreground">
        同一串音符,不同的节奏、和声与音色包装——这就是「曲风」。各版本的完整版在对应曲风词条里
      </figcaption>
    </figure>
  );
}

export default MelodyStyles;
