#!/bin/bash
# 在服务器上以 root / sudo 运行一次:装 nginx + 建站目录 + 生效配置
# 用法: sudo bash server-setup.sh [用户名(默认 admin)]
set -e
USER_NAME="${1:-admin}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx

mkdir -p /var/www/music-wiki
chown -R "$USER_NAME:$USER_NAME" /var/www/music-wiki

cat > /etc/nginx/sites-available/music-wiki < "$SCRIPT_DIR/nginx-music-wiki.conf"
ln -sf /etc/nginx/sites-available/music-wiki /etc/nginx/sites-enabled/music-wiki
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl enable nginx && systemctl restart nginx
echo "✅ server-setup done (nginx ready, site dir: /var/www/music-wiki)"
