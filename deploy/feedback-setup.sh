#!/bin/bash
# 在服务器上以 admin(免密 sudo)运行一次:装 node + 反馈 API + nginx 代理
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export DEBIAN_FRONTEND=noninteractive

echo "→ 安装 node(若缺)"
if ! command -v node >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y nodejs
fi
node -v

echo "→ 目录与配置"
sudo mkdir -p /opt/music-wiki /var/www/music-wiki-feedback
sudo chown admin:admin /var/www/music-wiki-feedback

if [ ! -f /etc/feedback-api.env ]; then
  KEY=$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
  echo "FEEDBACK_ADMIN_KEY=$KEY" | sudo tee /etc/feedback-api.env >/dev/null
  sudo chmod 600 /etc/feedback-api.env
  echo ""
  echo "=============================================="
  echo "  管理员密钥(查看反馈用,请保存!):"
  echo "  $KEY"
  echo "=============================================="
fi

echo "→ 安装 API 与 systemd 服务"
sudo cp "$SCRIPT_DIR/feedback-api.mjs" /opt/music-wiki/
sudo cp "$SCRIPT_DIR/feedback-api.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now feedback-api

echo "→ nginx 加 /api/ 代理(幂等)"
if ! grep -q "/api/feedback" /etc/nginx/sites-available/music-wiki; then
  sudo sed -i 's|location / {|location /api/ {\n        proxy_pass http://127.0.0.1:8089;\n    }\n\n    location / {|' /etc/nginx/sites-available/music-wiki
fi
sudo nginx -t && sudo systemctl reload nginx

echo "✅ feedback api ready"
echo "测试: curl -X POST http://127.0.0.1/api/feedback -d '{\"message\":\"hi\"}' -H 'Content-Type: application/json'"
