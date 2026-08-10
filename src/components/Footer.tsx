export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="group-has-[.section-soft]/body:bg-surface/40 dark:bg-transparent 3xl:fixed:bg-transparent">
      <div className="container-wrapper px-4 xl:px-6">
        <div className="flex h-(--footer-height) items-center justify-between">
          <div className="w-full px-1 text-center text-xs leading-loose text-muted-foreground sm:text-sm">
            © {year} 橙月Wiki · 一本可交互的音乐百科全书
          </div>
        </div>
      </div>
    </footer>
  );
}
