# CareConnect – On-Demand Home Services & Operations Platform

CareConnect is an end-to-end MERN-stack home services marketplace and operations management platform. It connects homeowners with vetted service providers (plumbers, electricians, cleaners, technicians) while providing full administrative oversight, dynamic dispatching, automated availability tracking, dispute resolution, and AI-powered service request classification.

---

## 🚀 Key Architectural Features

1. **Role-Based Access Control (RBAC)**:
   - **Customer**: Natural language AI service booking, provider discovery & match ranking, quote comparison, job tracking with before/after photos, simulated checkout, reviews, and dispute filing.
   - **Service Provider**: Job pipeline & opportunity quotes, calendar availability & time-slot configuration, field execution hub (status updates, before/after evidence photos, parts/labor adjustments), and credential management.
   - **Operations Manager**: Real-time dispatch telemetry, SLA tracking, priority emergency assignment modal, live job monitor, and technician reassignment.
   - **Support Agent**: Case queue, customer claim and evidence inspector, real-time 3-way mediation thread with customers and providers, and dispute resolution engine (full/partial refunds, rework orders).
   - **Platform Admin**: Executive GMV & revenue analytics, category & skills management, provider document inspection & verification queue, dynamic pricing & urgency surge rules, and immutable system audit trail.

2. **AI-Powered Capabilities**:
   - **Request Classifier**: Extracts trade category, urgency level, required skills, and duration/price estimations from free-text descriptions.
   - **Multi-Factor Provider Ranker**: Algorithmic compatibility scoring based on skill match (40%), geographical coverage (25%), historical ratings & jobs (20%), verification badge (10%), and schedule availability (5%).

3. **1-Click Demo Persona Switcher**:
   - Floating toolbar docked at the bottom of all views for testing all 5 roles with pre-seeded demo accounts.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, React Router v7
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Bcrypt, Multer, Helmet, Morgan
- **Database**: MongoDB (Local or MongoDB Atlas)

---

## 👥 Demo Accounts (Password: `password123`)

| Role | Persona Name | Email | Default View |
| :--- | :--- | :--- | :--- |
| **Customer** | Alice Johnson | `customer@careconnect.com` | `/customer/dashboard` |
| **Service Provider** | David Miller (Plumbing) | `provider@careconnect.com` | `/provider/dashboard` |
| **Operations Manager** | Marcus Brody | `ops@careconnect.com` | `/operations/dashboard` |
| **Support Agent** | Sarah Chen | `support@careconnect.com` | `/support/disputes` |
| **Platform Admin** | Victoria Vance | `admin@careconnect.com` | `/admin/dashboard` |

---

## 🏃 Quick Start Guide

### 1. Backend Server
```bash
cd backend
npm install
npm run seed     # Populate database with 10 demo users, categories, bookings, disputes
npm start        # Starts API server on http://localhost:5001
```

### 2. Frontend Client
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 📡 Core API Endpoints

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/demo-login/:role`, `PUT /api/auth/profile`
- **Categories**: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`
- **Providers Directory**: `GET /api/providers`, `GET /api/providers/admin/all`, `GET /api/providers/profile/me`, `PUT /api/providers/:id/verify`, `POST /api/providers/profile/me/documents`
- **Requests**: `POST /api/requests`, `GET /api/requests`, `GET /api/requests/:id`, `PUT /api/requests/:id/cancel`
- **Bookings & Chat**: `GET /api/bookings`, `POST /api/bookings/direct`, `POST /api/bookings/dispatch`, `PUT /api/bookings/:id/status`, `POST /api/bookings/:id/evidence`, `POST /api/bookings/:id/messages`, `PUT /api/bookings/:id/confirm`, `PUT /api/bookings/:id/assign`
- **Invoices & Receipts**: `GET /api/invoices`, `POST /api/invoices/:id/pay`, `POST /api/invoices/:id/refund`
- **Disputes**: `GET /api/disputes`, `POST /api/disputes`, `POST /api/disputes/:id/messages`, `PUT /api/disputes/:id/resolve`
- **AI Engine**: `POST /api/ai/classify-request`, `POST /api/ai/rank-providers`
- **Analytics & Audit**: `GET /api/analytics/admin`, `GET /api/analytics/operations`, `GET /api/analytics/pricing-rules`, `PUT /api/analytics/pricing-rules`, `GET /api/analytics/audit-logs`
