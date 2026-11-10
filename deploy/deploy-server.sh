#!/bin/bash
# 本地运行:构建 + 上传 dist 到服务器(不用密码,用密钥)
# 用法: bash deploy-server.sh [IP(默认<your-server-ip>)] [用户(默认admin)]
set -e
SERVER_IP="${1:-<your-server-ip>}"
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

# 百度 API 推送(可选):.env 里配置 BAIDU_PUSH_TOKEN 后生效。
# 配额按站点质量分级(新站 10 条/日),所以只推「上次推送之后新增」的 URL、
# 上限 10 条;推送结果记在 .baidu-pushed-urls(gitignore),over quota 整批
# 被拒时不记账,留给下次部署重试。没配 token 则跳过。
if [ -f .env ] && grep -q "^BAIDU_PUSH_TOKEN=..*" .env; then
  TOKEN=$(sed -n 's/^BAIDU_PUSH_TOKEN=//p' .env | tr -d '\r')
  STATE=".baidu-pushed-urls"
  grep -o '<loc>[^<]*</loc>' dist/sitemap-0.xml | sed 's/<[^>]*>//g' > /tmp/baidu_urls.txt
  touch "$STATE"
  comm -13 <(sort -u "$STATE") <(sort -u /tmp/baidu_urls.txt) | head -10 > /tmp/baidu_new.txt
  NEW_N=$(wc -l < /tmp/baidu_new.txt | tr -d ' ')
  if [ "$NEW_N" -gt 0 ]; then
    RESP=$(curl -s -m 20 -H "Content-Type: text/plain" --data-binary @/tmp/baidu_new.txt \
      "http://data.zz.baidu.com/urls?site=https://ambermoon.wiki&token=$TOKEN")
    echo "→ 百度推送:新增 $NEW_N 条 → $RESP"
    echo "$RESP" | grep -q '"success"' && cat /tmp/baidu_new.txt >> "$STATE"
  else
    echo "→ 百度推送:无新增 URL,跳过"
  fi
else
  echo "ℹ 未配置 BAIDU_PUSH_TOKEN(.env),跳过百度推送"
fi

echo "✅ 部署完成: http://$SERVER_IP/"
