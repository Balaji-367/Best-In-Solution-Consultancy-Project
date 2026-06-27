# Best In Solutions - Pre-Deployment Checklist
# ON-PREMISES / LOCAL NETWORK DEPLOYMENT

**Project:** Best In Solutions - Service & Rental Management System  
**Version:** 1.0.0  
**Date:** _________________

---

## BEFORE DEPLOYMENT

### Source Code Verification
- [x] All 8 bugs fixed and verified
- [x] Backend models.py - completion_photo ImageField (not URLField)
- [x] Backend views.py - @transaction.atomic on rental creation
- [x] Backend serializers.py - completion_photo optional
- [x] Frontend RecentlyCompleted.jsx - uses API service with auth
- [x] Frontend SubmitReport.jsx - FormData file upload support
- [x] Frontend RentalProduct.jsx - useRef (no DOM manipulation)
- [x] Frontend Login.jsx - no unused imports
- [x] Production dependencies added (gunicorn, whitenoise)
- [x] Production security settings added to settings.py

### Files You Need
1. `cursor/backend/` - Django backend (entire folder)
2. `cursor/frontend/` - React frontend (entire folder)
3. `DEPLOYMENT_CHECKLIST.md` - This checklist
4. `CLIENT_HANDOVER_GUIDE.md` - Quick reference for client

---

## SERVER REQUIREMENTS

### Minimum
- Ubuntu 20.04/22.04 LTS (or Windows Server 2016+)
- 2GB RAM
- 20GB Storage
- Python 3.10+
- Node.js 18+
- MySQL 8.0+

### Recommended
- Ubuntu 22.04 LTS
- 4GB RAM
- 40GB SSD
- Static IP on local network

---

## CLIENT INFORMATION TO COLLECT

Fill these before deployment:

| Item | Value |
|------|-------|
| Server Local IP | _________________ |
| Server Hostname | _________________ |
| Admin Account (login) | _________________ |
| Admin Password | _________________ |
| MySQL Root Password | _________________ |
| Client Contact | _________________ |

---

## DEPLOYMENT STEPS (Linux On-Premises)

### Step 1: Server Setup
```bash
ssh user@SERVER-IP
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv python3-dev nginx mysql-server git curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Database Setup
```bash
sudo mysql_secure_installation
sudo mysql -u root -p
```
```sql
CREATE DATABASE best_in_solutions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bis_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON best_in_solutions.* TO 'bis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Upload Application
```bash
sudo mkdir -p /var/www/bestinsolutions
# Upload via SCP/SFTP/USB to /var/www/bestinsolutions
sudo chown -R $USER:$USER /var/www/bestinsolutions
```

### Step 4: Backend Setup
```bash
cd /var/www/bestinsolutions/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` file (see `.env.production.template`):
```bash
nano .env
```

Key values for local network:
```
SECRET_KEY=YOUR-50-CHAR-RANDOM-KEY
DEBUG=False
ALLOWED_HOSTS=SERVER-IP,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://SERVER-IP
FRONTEND_URL=http://SERVER-IP
```

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### Step 5: Frontend Build
```bash
cd /var/www/bestinsolutions/frontend
npm install
echo "VITE_API_BASE_URL=http://SERVER-IP" > .env
npm run build
```

### Step 6: Systemd Service
```bash
sudo nano /etc/systemd/system/bis-backend.service
```

```ini
[Unit]
Description=BIS Backend (Gunicorn)
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/bestinsolutions/backend
Environment=PATH=/var/www/bestinsolutions/backend/venv/bin
ExecStart=/var/www/bestinsolutions/backend/venv/bin/gunicorn backend.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable bis-backend
sudo systemctl start bis-backend
sudo systemctl status bis-backend
```

### Step 7: Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/bestinsolutions
```

```nginx
server {
    listen 80;
    server_name SERVER-IP;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React SPA)
    location / {
        root /var/www/bestinsolutions/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files
    location /static/ {
        alias /var/www/bestinsolutions/backend/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /var/www/bestinsolutions/backend/media/;
    }

    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bestinsolutions /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Firewall (Local Network Only)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

---

## OPTIONAL: HTTPS with Self-Signed Certificate
*(Only if client wants HTTPS on local network)*

```bash
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/bis.key \
  -out /etc/ssl/certs/bis.crt \
  -subj "/CN=SERVER-IP"

sudo nano /etc/nginx/sites-available/bestinsolutions
# Add before the closing } of the server block:
#   listen 443 ssl;
#   ssl_certificate /etc/ssl/certs/bis.crt;
#   ssl_certificate_key /etc/ssl/private/bis.key;

sudo nginx -t && sudo systemctl restart nginx
```

Then update frontend `.env`:
```
VITE_API_BASE_URL=https://SERVER-IP
```
And rebuild frontend: `npm run build`

---

## POST-DEPLOYMENT VERIFICATION

- [ ] Frontend loads at http://SERVER-IP
- [ ] Login works with admin credentials
- [ ] Admin dashboard shows statistics
- [ ] API responds at http://SERVER-IP/api/jobs/
- [ ] Admin panel accessible at http://SERVER-IP/admin/
- [ ] File upload works (create test job report with photo)
- [ ] Rental creation works (creates rental + updates device status)
- [ ] Employee can view and accept jobs
- [ ] Other computers on LAN can access the app

---

## HANDOVER TO CLIENT

### Deliverables
- [ ] Application deployed and working
- [ ] Admin credentials provided securely
- [ ] Quick start guide shared with client
- [ ] Backup script configured
- [ ] Network access instructions provided

### Access Info for Client
| What | Details |
|------|---------|
| App URL | http://SERVER-IP |
| Admin login | _________________ |
| Admin password | _________________ |
| Server SSH | _________________ |
| Database | _________________ |

### Client Instructions to Provide
1. How to access the app from any computer on the network
2. How to log in
3. How to create jobs
4. How to create employees
5. How to manage devices
6. How to create rentals
7. How to view reports

---

## BACKUP SETUP

```bash
sudo nano /var/www/bestinsolutions/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/www/bestinsolutions/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u bis_user -p'STRONG_PASSWORD_HERE' best_in_solutions > $BACKUP_DIR/db_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x /var/www/bestinsolutions/backup.sh
crontab -e
# Add: 0 2 * * * /var/www/bestinsolutions/backup.sh >> /var/www/bestinsolutions/backup.log 2>&1
```

---

## TROUBLESHOOTING QUICK REFERENCE

| Issue | Command |
|-------|---------|
| Backend not running | `sudo systemctl status bis-backend` |
| Nginx not serving | `sudo nginx -t && sudo systemctl restart nginx` |
| Database error | `mysql -u bis_user -p best_in_solutions` |
| Static files missing | `python manage.py collectstatic --noinput` |
| Check backend logs | `sudo journalctl -u bis-backend -f` |
| Check Nginx logs | `sudo tail -f /var/log/nginx/error.log` |
| Restart everything | `sudo systemctl restart bis-backend nginx` |
| Can't access from other PC | Check server firewall: `sudo ufw status` |
| CORS error in browser | Verify CORS_ALLOWED_ORIGINS in .env |

---

**Deployment Completed By:** _________________  
**Date:** _________________  
**Client Sign-off:** _________________
