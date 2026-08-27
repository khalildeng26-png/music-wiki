import * as React from "react";

import { onAudioInterrupt, stopAllAudio } from "./audio";

/**
 * 可打断的播放会话:给"排完就 return"的播放函数(playSequence/playChordProgression)
 * 补上开关语义——start() 开始播放,播放中 stop()=停止,别处开始播放自动复位。
 * 与 PlayChip/MelodyStyles 里的手写模式同一套逻辑,这里收拢成一份。
 *
 * @returns playing 是否播放中
 * @returns start 开始播放:play() 负责排音,totalMs 是整段时长的收尾余量(到点自动复位)
 * @returns stop 停止(走全局 stopAllAudio 广播,复位由打断监听完成)
 */
export function usePlayToggle() {
  const [playing, setPlaying] = React.useState(false);
  const timer = React.useRef(0);
  // 自己启动播放的瞬间,播放函数会先广播一次"打断"——那一次要忽略
  const starting = React.useRef(false);
  // 播放会话号:被新播放取代后,旧的 await 醒来不得再动状态
  const session = React.useRef(0);

  React.useEffect(() => {
    const off = onAudioInterrupt(() => {
      if (starting.current) return;
      session.current++;
      window.clearTimeout(timer.current);
      setPlaying(false);
    });
    return () => {
      off();
      window.clearTimeout(timer.current);
    };
  }, []);

  const stop = React.useCallback(() => {
    stopAllAudio(); // 广播打断,上面的监听负责复位
  }, []);

  const start = React.useCallback(async (play: () => Promise<void>, totalMs: number) => {
    const my = ++session.current;
    starting.current = true;
    setPlaying(true);
    // 播放函数的同步"自打断"广播发生在调用内部,微任务后即解除豁免(否则播放中无法停止)
    void Promise.resolve().then(() => {
      starting.current = false;
    });
    try {
      await play();
      if (my !== session.current) return; // 期间又被取代
      timer.current = window.setTimeout(() => setPlaying(false), totalMs);
    } catch {
      if (my === session.current) {
        starting.current = false;
        setPlaying(false); // 无声环境(自动播放被拦等)直接复位
      }
    }
  }, []);

  return { playing, start, stop };
}
