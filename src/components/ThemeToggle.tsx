import { Moon, Sun } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;

  /* 首访跟随系统偏好 */
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
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
    /* 用 View Transitions 做主题切换:浏览器截取新旧两帧,在合成器上
       做一层交叉淡化(GPU 加速)。之前给全站元素挂颜色 transition 的方案
       会让几千个元素同时插值,切换瞬间掉帧卡顿,已废弃。
       不支持该 API(旧内核)或减少动态时,直接切换。 */
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    const apply = () => {
      root.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next);
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
    setTheme(next); /* React 状态跟进(图标/aria 同步;effect 幂等) */
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
