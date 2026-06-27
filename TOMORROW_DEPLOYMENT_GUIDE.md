# Best In Solutions - TOMORROW'S DEPLOYMENT GUIDE

**Print this. Follow in order. Do not skip steps.**

---

## WHAT TO BRING

- [ ] Laptop with the project files (`cursor/` folder + deployment docs)
- [ ] USB drive (backup copy of project)
- [ ] Ethernet cable (in case WiFi is not available)

---

## STEP 1: ARRIVE & CHECK SERVER (10 min)

1. Go to the server room / client's server
2. Confirm the server is running and connected to the network
3. Find the server's IP address:

**If Linux server:**
```bash
hostname -I
# Note: 192.168.X.X (write it down, you'll use it many times)
```

**If Windows server:**
```cmd
ipconfig
# Look for "IPv4 Address"
```

4. Note the IP: **SERVER_IP = _________________**

5. Test network connectivity from YOUR laptop:
```bash
ping SERVER_IP
# Should get replies - means you can reach the server
```

---

## STEP 2: TRANSFER FILES TO SERVER (10 min)

### Option A: Linux Server (SCP)
From YOUR laptop:
```bash
scp -r cursor/ user@SERVER_IP:/home/user/
scp .env.production.template deploy.sh preflight-check.sh nginx.conf user@SERVER_IP:/home/user/
```

### Option B: Windows Server (SMB Share)
1. Share a folder on the server
2. Copy `cursor/` folder + deployment files to `\\SERVER_IP\share\`

### Option C: USB Drive
1. Copy files to USB
2. Plug USB into server
3. Copy files to `/home/user/bestinsolutions/`

---

## STEP 3: INSTALL DEPENDENCIES ON SERVER (20 min)

SSH into the server (or open terminal directly):

```bash
ssh user@SERVER_IP
```

Install system packages:
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv python3-dev nginx mysql-server git curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installations:
```bash
python3 --version    # Should show 3.10+
node --version       # Should show v18+
mysql --version      # Should show 8.0+
```

---

## STEP 4: SET UP DATABASE (10 min)

```bash
sudo mysql_secure_installation
# Answer: Y, set root password, Y, Y, Y, Y

sudo mysql -u root -p
```

Inside MySQL:
```sql
CREATE DATABASE best_in_solutions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bis_user'@'localhost' IDENTIFIED BY 'SET_A_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON best_in_solutions.* TO 'bis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## STEP 5: SET UP BACKEND (15 min)

Move project files:
```bash
sudo mkdir -p /var/www/bestinsolutions
sudo cp -r /home/user/cursor/backend /var/www/bestinsolutions/backend
sudo cp /home/user/cursor/frontend /var/www/bestinsolutions/frontend
```

Create and fill `.env`:
```bash
nano /var/www/bestinsolutions/backend/.env
```

Paste this (REPLACE the 3 values marked with `***`):
```
SECRET_KEY=*** RUN: python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" ***
DEBUG=False
ALLOWED_HOSTS=SERVER_IP,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://SERVER_IP
CSRF_TRUSTED_ORIGINS=http://SERVER_IP
DB_NAME=best_in_solutions
DB_USER=bis_user
DB_PASSWORD=SET_A_STRONG_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=3306
FRONTEND_URL=http://SERVER_IP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
WHATSAPP_MEDIA_URL=
CHANNEL_REDIS_URL=
```

Save and run:
```bash
cd /var/www/bestinsolutions/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
# Enter admin email, password
python manage.py collectstatic --noinput
```

---

## STEP 6: BUILD FRONTEND (10 min)

```bash
cd /var/www/bestinsolutions/frontend
npm install
echo "VITE_API_BASE_URL=http://SERVER_IP" > .env
npm run build
```

Verify build succeeded:
```bash
ls dist/index.html
# Should show the file exists
```

---

## STEP 7: SET UP BACKEND SERVICE (5 min)

```bash
sudo nano /etc/systemd/system/bis-backend.service
```

Paste:
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

Save and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bis-backend
sudo systemctl start bis-backend
sudo systemctl status bis-backend
# Should show "active (running)"
```

---

## STEP 8: SET UP NGINX (5 min)

```bash
sudo nano /etc/nginx/sites-available/bestinsolutions
```

Paste the contents of `nginx.conf` from your project folder.

Then:
```bash
sudo ln -s /etc/nginx/sites-available/bestinsolutions /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
# Should say "syntax is ok" and "test is successful"
sudo systemctl restart nginx
```

Set permissions:
```bash
sudo chown -R www-data:www-data /var/www/bestinsolutions
```

---

## STEP 9: CONFIGURE FIREWALL (2 min)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable
sudo ufw status
# Should show ports 22 and 80 ALLOW
```

---

## STEP 10: PRE-FLIGHT CHECK (5 min)

```bash
cd /var/www/bestinsolutions/backend
chmod +x /home/user/preflight-check.sh
bash /home/user/preflight-check.sh
```

All checks should pass. If any FAIL, fix them before continuing.

---

## STEP 11: TEST EVERYTHING (15 min)

From YOUR laptop browser, go to: `http://SERVER_IP`

| Test | Expected Result |
|------|----------------|
| Page loads | See Best In Solutions login page |
| Admin login | Login with superuser credentials |
| Dashboard | See 4 stat cards (Jobs, Rentals, Devices, Users) |
| Post a job | Create job -> appears in Available Jobs |
| Add device | Add device -> shows in Available Devices |
| Create rental | Create rental -> device status changes to "Rented" |
| File upload | Submit report with photo -> photo saved |
| Employee login | Create employee -> login works |
| Mobile access | Open `http://SERVER_IP` on phone on same network |

---

## STEP 12: SET UP BACKUPS (5 min)

```bash
sudo mkdir -p /var/www/bestinsolutions/backups
sudo nano /var/www/bestinsolutions/backup.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR="/var/www/bestinsolutions/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u bis_user -p'SET_A_STRONG_PASSWORD_HERE' best_in_solutions > $BACKUP_DIR/db_$DATE.sql
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete
echo "Backup completed: $DATE"
```

```bash
sudo chmod +x /var/www/bestinsolutions/backup.sh
sudo crontab -e
# Add this line at the bottom:
0 2 * * * /var/www/bestinsolutions/backup.sh >> /var/www/bestinsolutions/backup.log 2>&1
```

---

## STEP 13: HANDOVER TO CLIENT (20 min)

Fill in `CLIENT_HANDOVER_GUIDE.md` with:
- Server IP address
- Admin email and password
- Your contact info

Give the client a demo:
1. Show them how to access the app from their computer
2. Show them how to create a job
3. Show them how to add a device
4. Show them how to create an employee
5. Show them how to view reports

---

## EMERGENCY TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| Page won't load | `sudo systemctl status nginx` |
| 502 Bad Gateway | `sudo systemctl status bis-backend` |
| Database error | `sudo systemctl status mysql` |
| CORS error in browser | Check `CORS_ALLOWED_ORIGINS` in `.env` matches server IP |
| Static files broken | `cd /var/www/bestinsolutions/backend && source venv/bin/activate && python manage.py collectstatic --noinput` |
| Permission denied | `sudo chown -R www-data:www-data /var/www/bestinsolutions` |

---

**TOTAL ESTIMATED TIME: ~2 hours**
