import { HeaderSearch } from "@/components/HeaderSearch";
import { MainNav } from "@/components/MainNav";
import { MobileNav } from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="container-wrapper px-6 3xl:fixed:px-0">
        <div className="flex h-(--header-height) items-center gap-2.5 3xl:fixed:container">
          <MobileNav className="flex lg:hidden" />

          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="橙月Wiki" className="size-7 rounded-md" />
            <span className="font-display text-base font-bold tracking-tight">橙月Wiki</span>
          </a>

          <MainNav className="hidden lg:flex" />

          <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
            <HeaderSearch />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
