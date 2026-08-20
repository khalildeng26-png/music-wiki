import { Search } from "lucide-react";

/** 首页搜索框:原生 GET 表单,回车/点按钮直接跳 /search 结果页(不在本页下拉)。
 *  无状态、无 JS 依赖,老内核(legacy 模式)下同样可用。 */
export function HomeSearch() {
  return (
    <form
      action="/search"
      method="get"
      className="flex min-w-0 items-center gap-3 rounded-lg border bg-card px-4 py-3 transition focus-within:border-signature/50"
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        name="q"
        placeholder="搜索词条、曲风、乐理……"
        aria-label="搜索"
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition hover:opacity-90 active:scale-95"
      >
        搜索
      </button>
    </form>
  );
}

export default HomeSearch;
