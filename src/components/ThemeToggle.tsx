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

  React.useEffect(() => {
    /* 只同步类名,不写存储 —— 没手动选择过的访客,每次访问都按
       「系统偏好 + 真实时段」重新决定,月亮跟着真实的昼夜走;
       存储只在手动切换时写入(toggleTheme) */
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
    const apply = () => {
      root.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next); /* 手动选择,从此固定 */
      localStorage.setItem("themeChosen", "1");
    };
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (doc.startViewTransition && !reduced) {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
    track("theme_toggle", { to: next }); /* 数据验证:多少人在切主题、往哪切 */
    setTheme(next); /* React 状态跟进(effect 只同步类名,幂等) */
  };

  const isDark = theme === "dark";

  return (
    <Button
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
