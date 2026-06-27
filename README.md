# Best In Solutions - Service & Rental Management System

A full-stack web application designed for businesses to manage service jobs and device rentals from a centralized platform running on a local network.

## About the Project

Best In Solutions provides two distinct portals based on user roles:

### Admin Portal
- **Dashboard** — Real-time overview of total jobs, rentals, devices, and users
- **Post Jobs** — Create service job requests with customer details, location, issue description, and priority
- **Device Inventory** — Add and track equipment with serial numbers and specifications
- **Rental Management** — Create rental agreements, select available devices, set rental periods, collect security deposits, and upload customer ID proof
- **User Management** — Create admin and employee accounts with role-based access
- **Job & Rental History** — Review complete history of all jobs and rental agreements

### Employee Portal
- **Available Jobs** — Browse, search, and filter open jobs posted by admins
- **Accept Jobs** — Claim jobs and move them to the ongoing list
- **Submit Reports** — After completing work, file detailed reports including time taken, equipment used, work description, and optional completion photos
- **Recently Completed** — View past completed jobs and their reports

### How It Works
1. An admin creates a service job → it appears in the employee's available jobs list
2. An employee accepts the job → status changes to "In Progress"
3. The employee completes the work on-site → submits a completion report
4. Job status updates to "Completed" → visible in history for both admin and employee

For rentals, admins select an available device, fill in customer details, and the system automatically marks the device as rented to prevent double-booking.

### Network Access
The application runs on a local server. Any computer or phone on the same network can access it through a web browser by entering the server's IP address — no installation required on individual devices.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router DOM 6 |
| **Backend** | Django 5.0.6, Django REST Framework 3.15.2 |
| **Database** | MySQL 8.0+ |
| **Server** | Gunicorn 22.0.0 (production), Django dev server (development) |
| **WebSocket** | Django Channels 4.1.0, Daphne 4.1.2 |

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+
- MySQL 8.0+
- Git

---

## Installation & Setup

### Backend

```bash
cd cursor/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Backend Dependencies (requirements.txt):**

| Package | Version |
|---------|---------|
| django | 5.0.6 |
| djangorestframework | 3.15.2 |
| channels | 4.1.0 |
| channels-redis | 4.2.0 |
| daphne | 4.1.2 |
| PyMySQL | 1.1.1 |
| dj-database-url | 2.2.0 |
| python-dotenv | 1.0.1 |
| django-cors-headers | 4.3.1 |
| twilio | 9.3.3 |
| python-docx | 1.1.2 |
| reportlab | 4.2.5 |
| pandas | 2.2.0 |
| gunicorn | 22.0.0 |
| whitenoise | 6.6.0 |

**Configure Environment:**

Create a `.env` file in `cursor/backend/`:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=best_in_solutions
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Database Setup:**

```bash
# Create database in MySQL
mysql -u root -p
CREATE DATABASE best_in_solutions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend

```bash
cd cursor/frontend

# Install dependencies
npm install
```

**Frontend Dependencies (package.json):**

| Package | Version | Type |
|---------|---------|------|
| react | ^18.2.0 | dependency |
| react-dom | ^18.2.0 | dependency |
| react-router-dom | ^6.20.0 | dependency |
| @react-google-maps/api | ^2.20.8 | dependency |
| @tailwindcss/line-clamp | ^0.4.4 | dependency |
| vite | ^5.0.8 | devDependency |
| @vitejs/plugin-react | ^4.2.1 | devDependency |
| tailwindcss | ^3.3.6 | devDependency |
| autoprefixer | ^10.4.16 | devDependency |
| postcss | ^8.4.32 | devDependency |

**Configure Environment:**

Create a `.env` file in `cursor/frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

**Start Development Server:**

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## Project Structure

```
consultancy-BIS/
├── cursor/
│   ├── backend/          # Django REST API
│   │   ├── api/          # App with models, views, serializers
│   │   ├── backend/      # Project settings & configuration
│   │   └── requirements.txt
│   ├── frontend/         # React SPA
│   │   ├── src/          # Components, pages, services
│   │   └── package.json
│   └── .gitignore
├── .env.production.template
├── CLIENT_HANDOVER_GUIDE.md
├── DEPLOYMENT_CHECKLIST.md
├── TOMORROW_DEPLOYMENT_GUIDE.md
├── deploy.sh
├── nginx.conf
├── preflight-check.sh
├── plan.md
└── final-summary.md
```

---

## Deployment

For production deployment on a local network server (Ubuntu/Linux), see:
- `DEPLOYMENT_CHECKLIST.md` — Full step-by-step deployment guide
- `TOMORROW_DEPLOYMENT_GUIDE.md` — Quick day-of deployment checklist
- `CLIENT_HANDOVER_GUIDE.md` — Non-technical user manual for clients
- `.env.production.template` — Production environment variable template
- `nginx.conf` — Nginx reverse proxy configuration
- `deploy.sh` — Deployment automation script
- `preflight-check.sh` — Pre-deployment verification script

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login/ | User login |
| POST | /api/auth/register/ | User registration |
| GET | /api/auth/profile/ | User profile |
| GET/POST | /api/jobs/ | Job management |
| GET/POST | /api/rentals/ | Rental management |
| GET/POST | /api/devices/ | Device inventory |
| GET/POST | /api/reports/ | Job reports |
| GET | /api/dashboard/stats/ | Dashboard statistics |

Authentication: `Authorization: Token <token_key>`

---

## License

Private project — Best In Solutions
