import type { ReactNode } from "react";

import { categories } from "@/lib/categories";

// 入门路线五件套(footer 直链,免一跳)
const INTRO_PATHS = [
  { id: "guitar-intro", label: "吉他入门" },
  { id: "piano-intro", label: "钢琴入门" },
  { id: "bass-intro", label: "贝斯入门" },
  { id: "ukulele-intro", label: "尤克里里入门" },
  { id: "harmonica-intro", label: "口琴入门" },
];

export function Footer({ children }: { children?: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <footer className="group-has-[.section-soft]/body:bg-surface/40 dark:bg-transparent 3xl:fixed:bg-transparent">
      <div className="container-wrapper px-4 pb-8 xl:px-6">
        <div className="flex flex-col gap-8 border-t pt-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="max-w-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="size-7 rounded-md" />
              <span className="font-display text-base font-bold tracking-tight">橙月Wiki</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              一本会发声的音乐百科——看不懂的地方点一下就响。免费,无需注册。
            </p>
          </div>

          {/* 导航链接全部横向流式,任何断点都不竖排堆高(避免"页面重复一遍"的观感)。
              children 是 BaseLayout 注入的联系方式岛(FooterContact)——静态 React
              组件里写不了 client: 指令,只能从 .astro 层往里传 */}
          <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            {children}
            <nav aria-label="分类导航">
              <div className="text-sm font-medium">词条分类</div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {categories.map((c) => (
                  <li key={c.id}>
                    <a href={`/categories/${c.id}`} className="hover:text-signature">
                      {c.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/entries" className="hover:text-signature">
                    全部词条
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-label="路线导航">
              <div className="text-sm font-medium">入门路线</div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {INTRO_PATHS.map((p) => (
                  <li key={p.id}>
                    <a href={`/paths/${p.id}`} className="hover:text-signature">
                      {p.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/paths" className="hover:text-signature">
                    全部路线
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {year} 橙月Wiki · 一本可交互的音乐百科全书</span>
          <span>音频采样:Salamander(CC-BY)· ISU MIS · Freesound(CC0)</span>
          {/* 双备案:工信部网站备案号(带 -1 后缀)+公安联网备案号,各自链接官方查询 */}
          <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-signature"
            >
              蜀ICP备2026046666号-1
            </a>
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=51040202000403"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-signature"
            >
              川公网安备51040202000403号
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
