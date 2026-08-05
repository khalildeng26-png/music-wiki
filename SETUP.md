# 音乐百科 · 本地开发环境

## Node 版本(重要)

本项目需要 **Node ≥ 22**(Astro 7 强制要求)。Node 22 已便携安装在:

```
C:\Users\admin\node22
```

你原有的 Node 20 原地不动,其他项目不受影响。

### 在 VS Code 中(推荐 —— 自动生效)

本项目的 `.vscode/settings.json` 已配置:在此项目里打开的**任何集成终端会自动使用 Node 22**。
直接运行即可:

```bash
npm run dev      # 启动开发服务器(http://localhost:4321)
npm run build    # 生产构建 → dist/
npm run preview  # 预览构建产物
```

### 在外部终端中(需手动激活一次)

- **Git Bash**: `export PATH="/c/Users/admin/node22:$PATH"`
- **PowerShell**: `$env:PATH = "C:\Users\admin\node22;$env:PATH"`
- **CMD**: `set PATH=C:\Users\admin\node22;%PATH%`

验证: `node -v` 应显示 `v22.23.2`。

## npm 源

已配置项目级 `.npmrc` 指向国内镜像 `https://registry.npmmirror.com`(不改动你的全局配置)。

## 想要「零摩擦、任意终端自动按项目切换 Node 版本」?(可选)

可安装 Volta:`winget install Volta.Volta`,然后:

```bash
volta install node@22          # 全局默认
volta pin node@22.23.2          # 在本项目内固定 22
```

之后任何终端进入本项目都会自动用 Node 22,其他目录用默认版本。
(安装 Volta 时可能弹出 UAC 提权窗口,需你点「是」。)
