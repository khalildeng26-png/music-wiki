#!/bin/bash
# 本地运行:构建 + 上传 dist 到服务器(不用密码,用密钥)
# 用法: bash deploy-server.sh [IP(默认47.108.214.184)] [用户(默认admin)]
set -e
SERVER_IP="${1:-47.108.214.184}"
USER_NAME="${2:-admin}"
KEY="$HOME/.ssh/musicwiki_deploy"

echo "→ 构建…"
npm run build

echo "→ 打包上传…"
tar -czf /tmp/dist.tar.gz -C dist .
scp -i "$KEY" -o StrictHostKeyChecking=no /tmp/dist.tar.gz "$USER_NAME@$SERVER_IP:/tmp/"

echo "→ 服务器解压…"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$USER_NAME@$SERVER_IP" \
  "rm -rf /var/www/music-wiki/* && tar -xzf /tmp/dist.tar.gz -C /var/www/music-wiki && rm -f /tmp/dist.tar.gz"

echo "✅ 部署完成: http://$SERVER_IP/"
