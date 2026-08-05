# 部署指南

本项目是**纯静态站点**,构建产物在 `dist/`(含 Pagefind 搜索索引)。以 Cloudflare Pages 为例。

## 前置
- Node 22(本机已便携装在 `C:\Users\admin\node22`;详见 `SETUP.md`)
- 本地能跑通 `npm run build`(= `astro build && pagefind --site dist`)

---

## 方式 A:Cloudflare Pages + Git(推荐,推送即自动部署)

1. 推到 GitHub:
   ```bash
   cd E:/Project/music-wiki
   git init
   git add .
   git commit -m "init: 音乐百科"
   # 在 GitHub 建一个空仓库后:
   git remote add origin <你的仓库地址>
   git branch -M main
   git push -u origin main
   ```
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → 选该仓库
3. 构建设置:
   | 项 | 值 |
   |----|----|
   | 框架预设 | Astro(或 None) |
   | 构建命令 | `npm run build` |
   | 输出目录 | `dist` |
   | 环境变量 | `NODE_VERSION = 22`(关键!Astro 7 强制要求 Node ≥22) |
4. 保存 → 部署。之后每次 `git push` 自动部署。

## 方式 B:wrangler CLI 直接上传(快速一次性)
```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name music-wiki
```

---

## 注意事项
- **npm 源**:项目 `.npmrc` 指向 npmmirror(国内快)。Cloudflare 构建机能访问该镜像;若构建慢可临时删 `.npmrc` 用默认 registry。
- **搜索**:Pagefind 索引在构建时生成,**线上自动可用**;本地需 `npm run preview` 才能用搜索(`npm run dev` 下不可用)。
- **国内正式上线**:Cloudflare 在大陆访问不稳定。正式面向国内用户时,建议换**国内对象存储 + CDN**(如腾讯云 COS+CDN、阿里云 OSS+CDN)并完成 **ICP 备案**,把 `dist/` 里的静态文件上传/同步即可——无需改代码。
