#!/bin/bash
# ============================================
# Best In Solutions - Quick Deploy Script
# For Ubuntu 20.04/22.04 LTS (On-Premises)
# Run as root or with sudo
# ============================================

set -e

echo "============================================"
echo " Best In Solutions - On-Premises Setup"
echo "============================================"

# --- Configuration ---
APP_DIR="/var/www/bestinsolutions"
DB_NAME="best_in_solutions"
DB_USER="bis_user"
DB_PASSWORD=""       # Set before running
SERVER_IP=""          # Set before running (e.g., 192.168.1.100)

# --- Step 1: System Dependencies ---
echo ""
echo "[1/7] Installing system dependencies..."
apt update && apt upgrade -y
apt install -y python3-pip python3-venv python3-dev nginx mysql-server git curl

# --- Step 2: Node.js ---
echo ""
echo "[2/7] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# --- Step 3: MySQL ---
echo ""
echo "[3/7] Setting up MySQL..."
echo "Enter MySQL root password when prompted:"
read -s MYSQL_ROOT_PW

mysql -u root -p"$MYSQL_ROOT_PW" -e "
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
"
echo "Database created: $DB_NAME"

# --- Step 4: Application Directory ---
echo ""
echo "[4/7] Setting up application directory..."
mkdir -p $APP_DIR

# --- Step 5: Backend ---
echo ""
echo "[5/7] Setting up backend..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "IMPORTANT: Create .env file at $APP_DIR/backend/.env"
echo "Use .env.production.template as reference"
echo ""
echo "Press Enter after creating .env file..."
read

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

# --- Step 6: Frontend ---
echo ""
echo "[6/7] Building frontend..."
cd $APP_DIR/frontend
npm install
echo "VITE_API_BASE_URL=http://$SERVER_IP" > .env
npm run build

# --- Step 7: Systemd Service ---
echo ""
echo "[7/7] Creating systemd service..."

cat > /etc/systemd/system/bis-backend.service << EOF
[Unit]
Description=BIS Backend (Gunicorn)
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin
ExecStart=$APP_DIR/backend/venv/bin/gunicorn backend.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bis-backend
systemctl start bis-backend

# --- Nginx ---
echo ""
echo "Configuring Nginx..."
cp nginx.conf /etc/nginx/sites-available/bestinsolutions
sed -i "s/server_name _;/server_name $SERVER_IP;/" /etc/nginx/sites-available/bestinsolutions
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/bestinsolutions /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Set permissions
chown -R www-data:www-data $APP_DIR

# --- Firewall ---
echo ""
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

echo ""
echo "============================================"
echo " DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo " Access the app at: http://$SERVER_IP"
echo ""
echo " Troubleshooting:"
echo "  - Backend: systemctl status bis-backend"
echo "  - Nginx:   systemctl status nginx"
echo "  - Logs:    journalctl -u bis-backend -f"
echo ""
