#!/bin/bash
# 本地运行:构建 + 上传 dist 到服务器(不用密码,用密钥)
# 用法: bash deploy-server.sh [IP(默认47.108.214.184)] [用户(默认admin)]
set -e
SERVER_IP="${1:-47.108.214.184}"
USER_NAME="${2:-admin}"
KEY="$HOME/.ssh/musicwiki_deploy"

echo "→ 生成 OG 分享卡(内容有变才重截)…"
node scripts/generate-og.mjs

echo "→ 构建…"
SITE="${SITE:-https://ambermoon.wiki}" npm run build

echo "→ 打包上传…"
tar -czf /tmp/dist.tar.gz -C dist .
scp -i "$KEY" -o StrictHostKeyChecking=no /tmp/dist.tar.gz "$USER_NAME@$SERVER_IP:/tmp/"

echo "→ 服务器解压…"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$USER_NAME@$SERVER_IP" \
  "rm -rf /var/www/music-wiki/* && tar -xzf /tmp/dist.tar.gz -C /var/www/music-wiki && rm -f /tmp/dist.tar.gz"

# 百度 API 推送(可选):.env 里配置 BAIDU_PUSH_TOKEN 后,
# 每次部署把全站 URL 主动推给百度,缩短爬虫发现时间。没配则跳过。
if [ -f .env ] && grep -q "^BAIDU_PUSH_TOKEN=..*" .env; then
  echo "→ 百度 API 推送…"
  TOKEN=$(sed -n 's/^BAIDU_PUSH_TOKEN=//p' .env | tr -d '\r')
  grep -o '<loc>[^<]*</loc>' dist/sitemap-0.xml | sed 's/<[^>]*>//g' > /tmp/baidu_urls.txt
  RESP=$(curl -s -m 20 -H "Content-Type: text/plain" --data-binary @/tmp/baidu_urls.txt \
    "http://data.zz.baidu.com/urls?site=https://ambermoon.wiki&token=$TOKEN")
  echo "  推送 $(wc -l < /tmp/baidu_urls.txt | tr -d ' ') 条 → $RESP"
else
  echo "ℹ 未配置 BAIDU_PUSH_TOKEN(.env),跳过百度推送"
fi

echo "✅ 部署完成: http://$SERVER_IP/"
