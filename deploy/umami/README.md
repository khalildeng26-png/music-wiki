# umami 自托管统计 · 一次性搭建

匿名、无 Cookie 的访问统计,跑在与主站同一台阿里云服务器上,数据完全自持。
搭好后站内页面浏览会上报到 `https://stats.ambermoon.wiki`。

## 架构

```
浏览器 → nginx(443, stats.ambermoon.wiki)→ Docker umami(127.0.0.1:3000)→ Docker PostgreSQL(不对外)
```

主站与统计共用 443 端口(nginx 按 server_name 区分),**无需新开防火墙/安全组规则**。
内存占用约 300–500MB(umami + postgres),2G 轻量服务器带得动。

## 步骤(约 10 分钟)

**0. DNS(阿里云控制台)**:给 `ambermoon.wiki` 加一条 A 记录:`stats → 47.108.214.184`

**1. 本机传文件上服务器**:

```bash
scp -i ~/.ssh/musicwiki_deploy -o StrictHostKeyChecking=no \
  deploy/umami/docker-compose.yml deploy/umami/nginx-stats.conf \
  admin@47.108.214.184:/tmp/
```

**2. 服务器装 Docker**(已有则跳过):

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # 重新登录后生效
```

**3.(仅当拉镜像超时)配镜像加速**:国内直连 Docker Hub 可能失败:

```bash
sudo tee /etc/docker/daemon.json <<'EOF'
{ "registry-mirrors": ["https://docker.m.daocloud.io"] }
EOF
sudo systemctl restart docker
```

注意:`registry-mirrors` 只对 Docker Hub 生效,ghcr.io 不走它。若 ghcr.io 也拉不动,
把 compose 里 umami 镜像换成 `ghcr.m.daocloud.io/umami-software/umami:postgresql-latest`。
公共镜像站时有失效,换一个当前可用的重试即可。

**4. 起 umami**:

```bash
sudo mkdir -p /opt/umami && cd /opt/umami
sudo mv /tmp/docker-compose.yml .
echo "APP_SECRET=$(openssl rand -hex 32)" > .env   # 随机密钥,勿提交
sudo docker compose up -d
sudo docker compose ps   # umami、db 两个容器都 Up 即成功
```

**5. nginx 子站**:

```bash
sudo cp /tmp/nginx-stats.conf /etc/nginx/sites-available/stats
sudo ln -sf /etc/nginx/sites-available/stats /etc/nginx/sites-enabled/stats
sudo nginx -t && sudo systemctl reload nginx
```

**6. HTTPS**:

```bash
sudo certbot --nginx -d stats.ambermoon.wiki   # 自动升 443 + 强制跳转
```

**7. 初始化 umami**:

- 浏览器打开 `https://stats.ambermoon.wiki`,默认账号 `admin` / 密码 `umami`,
  **登录后立刻改密码**(头像 → 用户 → 编辑)
- 添加网站:域名填 `ambermoon.wiki` → 保存 → 进编辑页复制 **Website ID**

**8. 接入站点**:本机 `.env` 加两行(模板见 `.env.example`):

```
UMAMI_URL=https://stats.ambermoon.wiki
UMAMI_WEBSITE_ID=上一步拿到的ID
```

然后 `bash deploy/deploy-server.sh` 重新部署,全站生效。
两项都不填时构建产物完全不含统计脚本,本地 dev 永远零上报。

## 验证

- 部署后打开主站任意页面,umami 后台「实时」应立刻出现访问
- 主站页面源码 `<head>` 里有 `src="https://stats.ambermoon.wiki/script.js"` 的标签
- 看渠道效果:后台「流量」页的「来源网站」即访客从哪个平台点进来的(B站/知乎/直访…)

## 运维备忘

- **备份** = 备份数据卷:
  `docker run --rm -v umami-db-data:/data -v $PWD:/backup alpine tar czf /backup/umami-db.tgz /data`
- **升级 umami**:`docker compose pull && docker compose up -d`(数据在卷里,不会丢)
- certbot 续期走 systemd 定时器,与主站共用,无需额外配置
