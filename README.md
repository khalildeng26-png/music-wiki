# 橙月Wiki · 可交互的音乐精品百科

**线上地址:[ambermoon.wiki](https://ambermoon.wiki)**

一本「可交互的音乐精品百科全书」:主体是可检索、可关联跳转的词条库,叠加精选学习路线;词条内嵌即时交互演示——点谱发声、认音反馈、和弦试听、节奏打拍。纯静态、无账号、无追踪。

- **108 篇词条**:乐理 / 记谱 / 和声 / 曲风 / 乐器 / 唱法 六大分类
- **10 条学习路线**:吉他入门、钢琴入门、和声四阶、读谱、曲式、声乐等
- **14 个交互组件**:StaffNotation(点谱发声)、NoteDemo(认音)、PitchTrainer(唱歌音高反馈)、ScalePlayer(音阶试听)、Piano、Fretboard、ChordDiagram、EarTrainer、Metronome、RhythmTap 等

## 技术栈

| 层       | 技术                                  |
| -------- | ------------------------------------- |
| 框架     | Astro 7(岛屿架构:静态内容 + 局部交互) |
| 交互组件 | React 19(@astrojs/react)              |
| 样式     | Tailwind CSS v4 + shadcn/ui(Base UI)  |
| 内容     | MDX(正文内直接嵌交互组件)             |
| 音频     | Tone.js + abcjs                       |
| 搜索     | Pagefind(构建时索引)                  |
| 质量工具 | oxlint / oxfmt                        |

## 本地开发

```bash
npm install        # 需 Node ≥ 22(Astro 7 强制),详见 SETUP.md
npm run dev        # http://localhost:4321
npm run build      # astro build && pagefind --site dist
npm run preview    # 预览构建产物(搜索功能需在此模式下可用)
npm run check      # oxlint + oxfmt
```

## 项目文档

- **[DESIGN.md](DESIGN.md)** — 权威设计基准:产品定位、设计系统、信息架构、路线图
- **[SETUP.md](SETUP.md)** — 本地环境(Node 22 便携版、npm 镜像)
- **[DEPLOY.md](DEPLOY.md)** — 部署指南(正式站 / 海外备用 / OSS)

## 部署

正式站部署在国内服务器(nginx + HTTPS),更新命令:

```bash
bash deploy/deploy-server.sh   # 构建 → 上传 → 生效
```

## License

[MIT](LICENSE)
