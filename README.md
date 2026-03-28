# 🏛️ City Museum — AI-Powered Chatbot Ticketing System

> A full-stack minor project for B.Tech CSE 2024-25 — Online museum ticket booking via AI chatbot with Razorpay payment integration.

![Tech Stack](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=flat-square&logo=react)
![Django](https://img.shields.io/badge/Backend-Django%204.2-092E20?style=flat-square&logo=django)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)
![Razorpay](https://img.shields.io/badge/Payment-Razorpay-02042B?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---
<img width="1897" height="876" alt="image" src="https://github.com/user-attachments/assets/dd84cf17-26fc-4206-87b7-865fd9d2f091" />


## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Team](#team)

---

## 🎯 Overview

City Museum Ticketing System is a web-based application that allows users to book museum tickets through an **AI-powered chatbot**. The system eliminates physical queues by providing a seamless digital booking experience with instant QR code generation and email confirmation.

**Key Highlights:**
- 🤖 AI Chatbot booking flow (no forms needed)
- 💳 Razorpay payment gateway integration
- 📱 QR Code ticket generation
- 📧 Email confirmation with ticket attachment
- 👨‍💼 Admin dashboard with analytics

---

## ✨ Features

### User Features
- **AI Chatbot** — Book tickets by chatting (category → date → quantity → name → phone → confirm)
- **Razorpay Payment** — UPI, Credit/Debit Card, Net Banking
- **QR Ticket** — Instant QR code generation after payment
- **PDF Download** — Download/Print ticket as PDF
- **My Bookings** — View, track, and cancel bookings
- **Email Notification** — Ticket sent to email after payment

### Admin Features
- **Dashboard Overview** — Real-time stats and charts
- **Bookings Management** — View all bookings, filter by status, export CSV
- **Shows Management** — Add, Edit, Delete, Activate/Deactivate shows
- **Revenue Analytics** — Daily/weekly revenue breakdown

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, Tailwind CSS, Framer Motion |
| State Management | Redux Toolkit |
| Backend | Django 4.2, Django REST Framework |
| Database | PostgreSQL |
| Authentication | JWT (SimpleJWT) |
| Payment | Razorpay |
| Chatbot | Google Dialogflow ES (local flow) |
| QR Code | qrcode (Python) |
| Email | Django SMTP (Gmail) |
| SMS | Twilio (optional) |
| Charts | Recharts |

---

## 📁 Project Structure

```
minor project chatbot/
├── frontend/                   # React.js Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── chatbot/        # ChatbotWidget, ChatWindow, MessageBubble, QuickReplies
│   │   │   └── common/         # Navbar, Skeleton
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── TicketPage.jsx
│   │   │   ├── BookingSummary.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── AdminOverview.jsx
│   │   │       ├── AdminBookings.jsx
│   │   │       ├── AdminShows.jsx
│   │   │       └── AdminRevenue.jsx
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── slices/authSlice.js
│   │   └── services/
│   │       ├── api.js
│   │       └── razorpay.js
│   └── package.json
│
└── backend/                    # Django Application
    ├── config/                 # Django settings, urls, celery
    ├── users/                  # Custom user model, auth APIs
    ├── shows/                  # Show model, CRUD APIs
    ├── bookings/               # Booking model, create/cancel APIs
    ├── payments/               # Razorpay verify, webhook, refund
    ├── chatbot/                # Dialogflow webhook
    ├── media/                  # QR codes storage
    ├── .env                    # Environment variables
    └── manage.py
```

---

## ⚙️ Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 15+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/museum-chatbot-ticketing.git
cd museum-chatbot-ticketing
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Database Setup (PostgreSQL)

```sql
CREATE DATABASE museum_db;
CREATE USER museum_user WITH PASSWORD 'museum123';
GRANT ALL PRIVILEGES ON DATABASE museum_db TO museum_user;
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 5. Add Sample Shows

```bash
python manage.py shell
```

```python
from shows.models import Show
from datetime import date, time, timedelta

shows_data = [
    {'name': 'Ancient India Exhibition', 'category': 'general',    'price_adult': 150, 'price_child': 75,  'start_time': time(10,0), 'end_time': time(18,0), 'total_capacity': 120},
    {'name': 'Modern Art Exhibition',    'category': 'exhibition',  'price_adult': 200, 'price_child': 100, 'start_time': time(11,0), 'end_time': time(19,0), 'total_capacity': 80},
    {'name': 'Night Gala Show',          'category': 'night_show',  'price_adult': 350, 'price_child': 175, 'start_time': time(19,0), 'end_time': time(22,0), 'total_capacity': 50},
    {'name': 'Dinosaur World',           'category': 'special',     'price_adult': 250, 'price_child': 125, 'start_time': time(9,0),  'end_time': time(17,0), 'total_capacity': 100},
]

for i, s in enumerate(shows_data):
    Show.objects.create(date=date.today() + timedelta(days=i+1), is_active=True, **s)
    
print('Shows created!')
exit()
```

### 6. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## 🔑 Environment Variables

Create `backend/.env` file:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database
DB_NAME=museum_db
DB_USER=museum_user
DB_PASSWORD=museum123
DB_HOST=localhost
DB_PORT=5432

# Razorpay (get from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=

# Email (Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Dialogflow (optional)
DIALOGFLOW_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=credentials.json

# Redis (optional - for Celery)
REDIS_URL=redis://localhost:6379/0
```

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

---

## 🚀 Running the Project

### Start Backend

```bash
cd backend
venv\Scripts\activate       # Windows
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Access Points

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Main website |
| `http://localhost:5173/login` | Login / Register |
| `http://localhost:5173/my-bookings` | User bookings |
| `http://localhost:5173/admin` | Admin dashboard |
| `http://localhost:8000/admin` | Django admin panel |
| `http://localhost:8000/api/v1/` | REST API root |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register/` | Register new user |
| POST | `/api/v1/auth/login/` | Login user |
| POST | `/api/v1/auth/logout/` | Logout user |
| GET  | `/api/v1/auth/profile/` | Get user profile |
| GET  | `/api/v1/auth/analytics/` | Admin analytics |

### Shows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/shows/` | List all active shows |
| POST   | `/api/v1/shows/create/` | Create new show (admin) |
| GET    | `/api/v1/shows/<id>/` | Get show details |
| PATCH  | `/api/v1/shows/<id>/` | Update show (admin) |
| DELETE | `/api/v1/shows/<id>/` | Delete show (admin) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/v1/bookings/` | Create booking |
| GET    | `/api/v1/bookings/my/` | Get user bookings |
| GET    | `/api/v1/bookings/<ref>/` | Get booking by ref |
| DELETE | `/api/v1/bookings/<ref>/cancel/` | Cancel booking |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/verify/` | Verify Razorpay payment |
| POST | `/api/v1/payments/webhook/` | Razorpay webhook |
| POST | `/api/v1/payments/refund/` | Initiate refund |

---

## 🧪 Test Payment Credentials

Use these in Razorpay test mode:

```
Card Number : 4111 1111 1111 1111
Expiry      : 12/26
CVV         : 123
OTP         : 1234

UPI Test ID : success@razorpay
```

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| Home | Hero section with show cards and chatbot |
| Chatbot | AI booking flow widget |
| Booking Summary | Order review before payment |
| Ticket Page | QR code ticket with download option |
| Admin Dashboard | Analytics, bookings, shows management |

---

## 🗂️ Requirements

`backend/requirements.txt`:

```
Django==4.2
djangorestframework==3.14
djangorestframework-simplejwt==5.3
django-cors-headers==4.3
psycopg2-binary==2.9
python-dotenv==1.0
razorpay==1.4.1
qrcode[pil]==7.4
Pillow==10.0
twilio==8.5
celery==5.3
redis==5.0
django-axes==6.3
django-filter==23.3
```

---

## 👥 Team

| Name | Role |
|------|------|
| [Manish Dange] | Full Stack Developer |
| [Naman Jain] | Full Stack Developer |
| [Harsh Shukla] | Full Stack Developer |
| [Gaurav Upadhyay] | Full Stack Developer |

**Mentor:** [Vishwas Dixit]  
**Institution:** [SVVV, Indore]  
**Year:** 2025-2026

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Django REST Framework](https://www.django-rest-framework.org/)
- [React.js](https://reactjs.org/)
- [Razorpay](https://razorpay.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)

---

<p align="center">Built with ❤️ for B.Tech Minor Project 2024-25</p>
