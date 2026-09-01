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

# 2026-09-01 重上线教训:DB 密码当年手工配在第二份 env 里,unit 双 EnvironmentFile
# 后加载的覆盖前者,排查半天——现在 DB_PASS 一律进主 env,密码与授权、建表全在本脚本
if ! sudo grep -q "^DB_PASS=" /etc/feedback-api.env; then
  DBPASS=$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | head -c 28)
  sudo mysql -e "CREATE DATABASE IF NOT EXISTS music_wiki CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; \
    CREATE USER IF NOT EXISTS 'musicwiki'@'localhost' IDENTIFIED BY '$DBPASS'; \
    CREATE USER IF NOT EXISTS 'musicwiki'@'127.0.0.1' IDENTIFIED BY '$DBPASS'; \
    ALTER USER 'musicwiki'@'localhost' IDENTIFIED BY '$DBPASS'; \
    ALTER USER 'musicwiki'@'127.0.0.1' IDENTIFIED BY '$DBPASS';"
  echo "DB_PASS=$DBPASS" | sudo tee -a /etc/feedback-api.env >/dev/null
  sudo chmod 600 /etc/feedback-api.env
fi
sudo mysql -e "GRANT ALL ON music_wiki.* TO 'musicwiki'@'localhost'; GRANT ALL ON music_wiki.* TO 'musicwiki'@'127.0.0.1'; \
  CREATE TABLE IF NOT EXISTS music_wiki.feedbacks ( \
    id BIGINT AUTO_INCREMENT PRIMARY KEY, \
    message VARCHAR(1000) NOT NULL, \
    contact VARCHAR(200) NOT NULL DEFAULT '', \
    page VARCHAR(200) NOT NULL DEFAULT '', \
    ip VARCHAR(64) NOT NULL DEFAULT '', \
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP \
  ) CHARACTER SET utf8mb4;"

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
