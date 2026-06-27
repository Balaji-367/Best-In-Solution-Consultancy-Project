#!/bin/bash
# ============================================
# Best In Solutions - Pre-Flight Check
# Run this ON THE SERVER before going live
# ============================================

echo "============================================"
echo " BIS Pre-Flight Deployment Check"
echo "============================================"

PASS=0
FAIL=0
WARN=0

check() {
    local desc="$1"
    local cmd="$2"
    if eval "$cmd" > /dev/null 2>&1; then
        echo "  [PASS] $desc"
        ((PASS++))
    else
        echo "  [FAIL] $desc"
        ((FAIL++))
    fi
}

warn_check() {
    local desc="$1"
    local cmd="$2"
    if eval "$cmd" > /dev/null 2>&1; then
        echo "  [PASS] $desc"
        ((PASS++))
    else
        echo "  [WARN] $desc"
        ((WARN++))
    fi
}

# --- Python & Dependencies ---
echo ""
echo " Python & Dependencies"
check "Python 3.10+ installed" "python3 -c 'import sys; exit(0 if sys.version_info >= (3,10) else 1)'"
check "pip installed" "python3 -m pip --version"

if [ -d "venv" ]; then
    check "Virtual environment exists" "test -d venv"
    check "Django installed in venv" "venv/bin/python -c 'import django'"
    check "DRF installed in venv" "venv/bin/python -c 'import rest_framework'"
    check "Gunicorn installed" "venv/bin/gunicorn --version"
    check "PyMySQL installed" "venv/bin/python -c 'import pymysql'"
else
    echo "  [WARN] Virtual environment not found (run: python3 -m venv venv)"
    ((WARN++))
fi

# --- Database ---
echo ""
echo " Database"
check "MySQL service running" "systemctl is-active mysql || systemctl is-active mysqld"
check "Database exists" "mysql -u root -e 'USE best_in_solutions' 2>/dev/null"

# --- Django ---
echo ""
echo " Django"
if [ -f "manage.py" ]; then
    check "manage.py exists" "test -f manage.py"
    check "Migrations applied" "python manage.py showmigrations --check 2>/dev/null"
    check "Static files collected" "test -d staticfiles"
    check "Media directory exists" "test -d media"
    check ".env file exists" "test -f .env"

    # Check DEBUG setting
    if grep -q "DEBUG=False" .env 2>/dev/null; then
        echo "  [PASS] DEBUG=False in .env"
        ((PASS++))
    else
        echo "  [FAIL] DEBUG is NOT False in .env!"
        ((FAIL++))
    fi

    # Check SECRET_KEY
    if grep -q "SECRET_KEY=change-me" .env 2>/dev/null || grep -q "SECRET_KEY=your-" .env 2>/dev/null; then
        echo "  [FAIL] SECRET_KEY is still default value!"
        ((FAIL++))
    else
        echo "  [PASS] SECRET_KEY is set"
        ((PASS++))
    fi

    # Check ALLOWED_HOSTS has server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    if grep -q "$SERVER_IP" .env 2>/dev/null; then
        echo "  [PASS] Server IP ($SERVER_IP) in ALLOWED_HOSTS"
        ((PASS++))
    else
        echo "  [WARN] Server IP ($SERVER_IP) not in ALLOWED_HOSTS"
        ((WARN++))
    fi
else
    echo "  [FAIL] manage.py not found (run from backend directory)"
    ((FAIL++))
fi

# --- Frontend ---
echo ""
echo " Frontend"
if [ -d "frontend" ]; then
    check "Node.js installed" "node --version"
    check "npm installed" "npm --version"
    check "Frontend built" "test -d frontend/dist"
    check "dist/index.html exists" "test -f frontend/dist/index.html"
else
    echo "  [WARN] Frontend directory not found"
    ((WARN++))
fi

# --- Nginx ---
echo ""
echo " Nginx"
check "Nginx installed" "nginx -v"
check "Nginx running" "systemctl is-active nginx"
check "Nginx config valid" "nginx -t"

# --- Firewall ---
echo ""
echo " Firewall"
warn_check "Port 80 open" "ufw status | grep -q '80/tcp.*ALLOW'"
warn_check "Port 22 open" "ufw status | grep -q '22/tcp.*ALLOW'"

# --- Network ---
echo ""
echo " Network"
SERVER_IP=$(hostname -I | awk '{print $1}')
warn_check "Server reachable at $SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' http://$SERVER_IP | grep -q '200'"
warn_check "Other PCs on LAN can reach this server" "ping -c 1 $SERVER_IP > /dev/null 2>&1"

# --- Summary ---
echo ""
echo "============================================"
echo " Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "============================================"

if [ $FAIL -gt 0 ]; then
    echo " DO NOT DEPLOY - Fix failures first!"
    exit 1
elif [ $WARN -gt 0 ]; then
    echo "  Warnings found - review before deploying"
    exit 0
else
    echo " All checks passed - ready for deployment!"
    exit 0
fi
