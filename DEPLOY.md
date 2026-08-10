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

---

## 实际部署记录(2026-08-06)

- 已部署到 **Cloudflare Workers**:`https://music-wiki.khalildeng26.workers.dev`
- 仓库:`khalildeng26-png/music-wiki`(私有)、main 分支自动部署
- **踩坑 1**:CF 连 Git 时自动运行 `astro add cloudflare`,给项目加了 `@astrojs/cloudflare` 适配器 → 部署成 **Worker**(`workers.dev`)而非纯静态 Pages(`pages.dev`)。功能正常,但国内访问不如 pages.dev 稳。
- **踩坑 2(已修)**:适配器生成的 wrangler 配置 `name` 取自 `package.json` 的 `name`,原值 `@area44/astro-shadcn-ui-template` 含 `@/` 不合法 → 已把包名改为 `music-wiki`。
- **改善国内访问的三种方案**:
  1. 给该 Worker **绑定自定义域名**(走 CF CDN,比裸 `workers.dev` 稳)。
  2. 改回**纯静态 Pages**(`pages.dev`):让 CF 不自动加适配器(在 CF 构建设置里把 Astro 预设关掉 / 或本地 build 后用 `wrangler pages deploy dist` 直接传静态产物)。
  3. **国内对象存储 + CDN + ICP 备案**(长期面向国内用户推荐)。

---

## 国内快速访问(阿里云 OSS,免备案,今天就能用)

不用等 ICP 备案,先用 OSS 桶默认域名让国内能打开;备案下来后再换自定义域名 + CDN。

### 一次性准备

1. **开通阿里云 OSS,创建 Bucket**:
   - 地域:选离你近的(如华东2 上海 → `OSS_REGION=oss-cn-shanghai`)。
   - **读写权限:设为「公共读」**(否则网页打不开)。
   - 记下 **Bucket 名**。
2. **创建 AccessKey**:控制台 → RAM → AccessKey 管理(建议建子用户,只授 OSS 读写权限),拿到 AccessKeyId / AccessKeySecret。
3. **配置本地 `.env`**:把 `.env.example` 复制为 `.env`,填入 `OSS_REGION / OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET`。(`.env` 已被 gitignore,不会提交,密钥也不用在聊天里发我。)
4. **开启静态页面托管**:OSS 控制台 → 该 Bucket → 基础设置 → 静态页面 → 默认首页填 `index.html` 并开启。

### 部署

```bash
npm run deploy:oss   # = npm run build && node --env-file-if-exists=.env scripts/deploy-oss.mjs
```

脚本会把 `dist/` 全部上传到桶里,并对每个 `index.html` **额外上传一份无斜杠别名**,所以你站点现有的链接(如 `/entries/guitar`)**在 OSS 上不用改就能直接打开**。

### 访问

- 桶默认域名(**国内可开,HTTP**):`http://<桶名>.<OSS_REGION>.aliyuncs.com/`
- 国内访问稳定;缺点是域名丑、只有 HTTP。

### 之后(备案下来 → 正式版)

ICP 备案通过后:把自定义域名 CNAME 到 `<桶名>.<OSS_REGION>.aliyuncs.com`,开启阿里云 CDN,绑域名 + 免费 HTTPS 证书 → 拿到漂亮正式网址。届时在 `deploy-oss.mjs` 基础上加 CDN 刷新即可。

---

## 国内服务器部署(已上线,日常首选)

- **地址**:`http://47.108.214.184/`(国内直连,快)
- **服务器**:阿里云轻量 **Ubuntu 24.04**,nginx,站点目录 `/var/www/music-wiki`,用户 `admin`(免密 sudo)
- **本机密钥**:`~/.ssh/musicwiki_deploy`(已装公钥到服务器)
- **更新网站唯一命令**:`bash deploy/deploy-server.sh`(build → 上传 → 生效)

### 域名 + HTTPS(备案过审后)
1. 域名 A 记录 → `47.108.214.184`
2. `sudo certbot --nginx -d 你的域名`(免费证书)
3. 可选挂国内 CDN

## 海外备用
`https://music-wiki-3pf.pages.dev`(Cloudflare Pages)。注意不要用 CF 的 Git 自动部署(会自动加 @astrojs/cloudflare 适配器,与 astro@7.1.6 版本不匹配,构建报 `MISSING_EXPORT beginContentEntryCollection`)。
