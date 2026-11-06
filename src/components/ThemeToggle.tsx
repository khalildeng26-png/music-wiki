import { Moon, Sun } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/track";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  /* 只有带 themeChosen 标记的存储值才算「用户真选过」——
     旧版代码自动写的 theme 不是选择,一律走时段规则(与 BaseLayout 同步) */
  if (localStorage.getItem("themeChosen") === "1") {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  }

  /* 首访无选择时:系统暗色 或 真实黄昏时段(18:00–6:00)→ 黑夜。
     规则与 BaseLayout.astro 的内联脚本保持同步。 */
  const h = new Date().getHours();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark || h >= 18 || h < 6 ? "dark" : "light";
}

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);
  /* 进行中的 View Transition 数:连点时旧 VT 被跳过会触发它的 finally,
     不能让它把新 VT 刚加的 vt-snap 摘掉 */
  const vtCount = React.useRef(0);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const toggleRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    /* 只同步类名,不写存储 —— 没手动选择过的访客,每次访问都按
       「系统偏好 + 真实时段」重新决定,月亮跟着真实的昼夜走;
       存储只在手动切换时写入(toggleTheme) */
    /* VT 进行中(vt-snap 在身)时让位:effect 在事件处理器末尾就 flush,
       会赶在浏览器拍旧快照之前翻转类名 → 旧快张被污染成新状态,
       交叉淡化变成「暗→暗」的隐形动画(点一下直跳的元凶)。
       类名翻转交给 VT 的 apply 回调在正确时机做 */
    if (document.documentElement.classList.contains("vt-snap")) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = () => {
      if (!localStorage.getItem("theme")) {
        setTheme(media.matches ? "dark" : "light");
      }
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const toggleTheme = () => {
    /* View Transitions:新旧两帧在合成器上交叉淡化(GPU 一层,零逐元素开销);
       不支持的旧内核/减少动态退回直切 */
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => {
        finished: Promise<void>;
      };
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const useVt = !!doc.startViewTransition && !reduced;
    const apply = () => {
      root.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next); /* 手动选择,从此固定 */
      localStorage.setItem("themeChosen", "1");
      /* 此刻旧快照已拍、新快照未拍:通知唱盘瞬切到目标形态并立即重绘,
         化月/化碟的溶解溶进交叉淡化,与背景同时完成(不留给它慢尾巴)。
         holdMs = 遮罩期冻结唱盘视觉时钟,防揭幕转角跳变;与 CSS 的 1.4s 同步 */
      window.dispatchEvent(
        new CustomEvent("theme-vt", {
          detail: { holdMs: useVt ? 1400 : 0 },
        }),
      );
    };
    if (useVt) {
      /* 快照期冻结元素自身的 150ms 微过渡:否则新快照拍到旧颜色,
         淡化结束时真变色会「弹」一下(详见 global.css 的 .vt-snap) */
      root.classList.add("vt-snap");
      vtCount.current++;
      const vt = doc.startViewTransition!(apply);
      vt.finished
        .finally(() => {
          vtCount.current--;
          if (vtCount.current <= 0) root.classList.remove("vt-snap");
        })
        .catch(() => {});
    } else {
      apply();
    }
    track("theme_toggle", { to: next }); /* 数据验证:多少人在切主题、往哪切 */
    setTheme(next); /* React 状态跟进(effect 只同步类名,幂等) */
  };
  toggleRef.current = toggleTheme; /* 最新引用,供 document 层转发调用 */

  React.useEffect(() => {
    /* VT 遮罩层会吞掉淡化期间的指针点击(事件目标变成 <html>,
       elementsFromPoint 也只剩根元素,本内核对伪元素 pointer-events:none
       不生效)。点击事件本身仍会送达 document:若坐标落在主题按钮矩形内,
       直接代为执行切换 —— 按钮在动画进行中也随时可切,
       新一次 startViewTransition 会自动跳过旧动画接管。 */
    const onDocClick = (e: MouseEvent) => {
      const root = document.documentElement;
      if (e.target !== root || !root.classList.contains("vt-snap")) return;
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      if (
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
      ) {
        toggleRef.current();
      }
    };
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, []);

  const isDark = theme === "dark";

  return (
    <Button
      ref={btnRef}
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="切换主题"
      aria-pressed={isDark}
    >
      {isDark ? <Moon className="size-5" /> : <Sun className="size-6" />}
      <span className="sr-only">切换主题</span>
    </Button>
  );
};
