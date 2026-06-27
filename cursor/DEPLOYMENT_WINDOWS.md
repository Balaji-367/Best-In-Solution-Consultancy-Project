# Windows Server IIS Deployment Guide

## Prerequisites

1. **Windows Server 2016/2019/2022**
2. **IIS installed** with CGI feature enabled
3. **MySQL Server** installed and running
4. **Python 3.9+** installed

---

## Step 1: Install IIS & CGI

```powershell
# Run as Administrator
Import-Module ServerManager
Install-WindowsFeature -Name Web-Server, Web-CGI, Web-Mgmt-Console
```

## Step 2: Install MySQL

1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Install MySQL Server
3. Create database:
```sql
CREATE DATABASE best_in_solutions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bis_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123';
GRANT ALL PRIVILEGES ON best_in_solutions.* TO 'bis_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 3: Configure Python

1. Download Python from https://www.python.org/downloads/
2. **IMPORTANT**: Check "Add Python to PATH"
3. Install Python

## Step 4: URL Rewrite Module

Download and install from: https://www.iis.net/downloads/microsoft/url-rewrite

## Step 5: Deploy Application

1. Copy project folder to server (e.g., `C:\inetpub\wwwroot\bis`)
2. Edit `backend\.env` with production values:
```env
SECRET_KEY=your-50-char-random-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DB_NAME=best_in_solutions
DB_USER=bis_user
DB_PASSWORD=YourStrongPassword123
DB_HOST=localhost
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

3. Run setup script:
```cmd
cd C:\inetpub\wwwroot\bis
setup_server.bat
```

## Step 6: Configure IIS

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. Configure:
   - Site name: `BIS`
   - Physical path: `C:\inetpub\wwwroot\bis`
   - Binding: Port 80 or 443 (HTTPS recommended)

4. Click on the website → **Handler Mappings**
5. Click **Add Module Mapping**
   - Request path: `*`
   - Module: `FastCgiModule`
   - Executable: `C:\inetpub\wwwroot\bis\venv\Scripts\python.exe|C:\inetpub\wwwroot\bis\venv\Lib\site-packages\wfastcgi.py`
   - Name: `Python FastCGI`

6. Click **OK** and **Yes** to create Fcgid import

## Step 7: Configure Permissions

1. Right-click project folder → **Properties** → **Security**
2. Add IIS_IUSRS and IUSR with Read/Write permissions
3. Give Full Control to the application pool identity

## Step 8: Test Deployment

1. Visit `http://localhost` in browser
2. Check if frontend loads
3. Test API at `http://localhost/api/`

---

## Troubleshooting

### 500 Error on API calls
- Check Windows Event Viewer for Python errors
- Verify .env file exists and is configured
- Check MySQL connection

### Static files not loading
- Run: `python manage.py collectstatic`
- Check static files folder permissions

### Database connection error
- Verify MySQL service is running
- Check credentials in .env
- Test connection: `mysql -u bis_user -p best_in_solutions`

### Need HTTPS
1. Install SSL certificate in IIS
2. Add binding for port 443
3. Update ALLOWED_HOSTS and CORS settings

---

## Useful Commands

```cmd
# Activate virtual environment
cd C:\inetpub\wwwroot\bis
venv\Scripts\activate

# Run Django shell
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Check for issues
python manage.py check --deploy

# Restart service (after code updates)
iisreset
```
