# SAMPATTI 365

## Overview

SAMPATTI 365 is an enterprise-grade IT Asset Management System designed to manage organizational assets, software licenses, accessories, components, consumables, predefined asset kits, employees, and user assignments through a centralized platform.

The system provides secure asset tracking, role-based access control (RBAC), inventory management, assignment workflows, reporting, and import/export capabilities to improve operational efficiency and asset visibility across the organization.

---

# System Architecture

```text
┌─────────────────────┐
│   React + Vite UI   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   FastAPI Backend   │
├─────────────────────┤
│ JWT Authentication  │
│ RBAC Authorization  │
│ Business Services   │
│ Validation Layer    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ SQLAlchemy ORM      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ PostgreSQL Database │
└─────────────────────┘
```

---

# Backend Structure

```text
backend/
│
├── app/
│   ├── core
|   |------dependencies
    |------security
│   │── routes/ 
│   ├── models/
│   ├── schemas/
│   ├── services/  
│   ├── utils/
│   ├── db/
│   └── main.py
│
├── 
├── uploads/
├── requirements.txt
└── .env
```

---

# Backend Features

## Authentication & Security

* JWT Authentication
* Secure Password Hashing
* Protected API Routes
* Role-Based Access Control (RBAC)
* Permission-Based Authorization
* Session Management
* Input Validation using Pydantic

## Inventory Management

### Assets

* Asset Creation & Management
* Asset Assignment / Unassignment
* Asset Lifecycle Tracking
* Asset Status Management
* Asset History Tracking
* Asset Import Functionality

### Accessories

* Accessory Inventory Management
* Employee Assignment Tracking
* Stock Monitoring
* Bulk Import Support

### Licenses

* Software License Management
* License Allocation Tracking
* License Expiry Monitoring
* Encrypted License Key Storage
* Bulk License Import

### Components

* Component Inventory Management
* Component Assignment Tracking
* Bulk Import Support

### Consumables

* Consumable Inventory Tracking
* Stock Monitoring
* Usage Tracking

### Predefined Kits

* Asset Bundle Management
* Reusable Asset Kits
* Standardized Employee Onboarding Kits

---

## Employee & User Management

### Employees

* Employee Profiles
* Department Mapping
* Asset Ownership Tracking
* Assignment History

### User Profiles

* User Account Management
* Profile Management
* Password Management
* Access Control Management

### User Assigned Items

Centralized view of:

* Assigned Assets
* Assigned Accessories
* Assigned Licenses
* Assigned Components
* Assignment History

---

## Role-Based Access Control (RBAC)

### Permission Structure

```text
Users
  │
  ▼
Roles
  │
  ▼
Permissions
  │
  ▼
Menus
  │
  ▼
Actions
```

### Supported Permissions

* View
* Create
* Update
* Delete
* Import
* Export

### Dynamic Permission Management

* Menu-wise Permissions
* Role-wise Access Control
* API-level Authorization
* Dynamic Frontend Menu Visibility

---

## Import Management

### Bulk Import Support For

* Assets
* Accessories
* Licenses
* Components

### Benefits

* Faster Data Migration
* Reduced Manual Effort
* Validation Before Import
* Error Reporting

---

# Backend Setup

## Prerequisites

* Python 3.12+
* PostgreSQL
* Git

### Clone Repository

```bash
git clone https://github.com/your-org/Sampatti365.git
cd backend
```

### Create Virtual Environment

```bash
python -m venv env
```

### Activate Environment

#### Windows

```bash
env\Scripts\activate
```

#### Linux / Mac

```bash
source env/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create `.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/sampatti365

SECRET_KEY=your-secret-key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Run Database Migrations

```bash
alembic upgrade head
```

### Start Backend Server

```bash
uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

Swagger Documentation:

```text
http://localhost:8000/docs
```

---

# Frontend Structure

```text
frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── auth/
│   │   └── AuthContext.jsx
│   │
│   ├── components/
│   │   ├── common/
│   │   └── layout/
│   │
│   ├── config/
│   ├── data/
│   ├── hooks/
│   │
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── assets/
│   │   ├── licenses/
│   │   ├── accessories/
│   │   ├── components/
│   │   ├── consumables/
│   │   ├── kits/
│   │   ├── people/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── import/
│   │
│   ├── routes/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env
```

---

# Frontend Features

## Modern User Interface

Built using:

* React 19
* Vite
* Tailwind CSS
* React Router
* Axios

## Authentication System

* JWT Token-Based Authentication
* Session Persistence
* Automatic Logout on Session Expiry
* User Profile Management
* Protected Routes

## Dashboard & Navigation

* Responsive Sidebar Navigation
* Dynamic Menu Rendering
* Role-Based Menu Visibility
* Dashboard Overview
* Quick Access Modules

## Asset Management Interface

### Asset Operations

* Asset Listing
* Asset Creation & Editing
* Asset Checkout / Check-in
* Asset Audit Tracking
* Asset Maintenance Tracking
* Bulk Operations

### Inventory Modules

* Assets
* Licenses
* Accessories
* Components
* Consumables
* Kits

## User & Permission Management

* User Management
* Employee Management
* Group Management
* Role Assignment
* Permission Assignment

## Reporting & Analytics

* Activity Reports
* Asset Reports
* License Reports
* Audit Logs
* Maintenance Reports
* Inventory Reports

## Import & Export

### Import

* Excel Import
* CSV Import
* Bulk Data Upload
* Import History

### Export

* CSV Export
* PDF Export
* Excel Export

## User Experience Features

### Responsive Design

* Desktop Support
* Tablet Support
* Mobile-Friendly Layout

### UI Features

* Dark Mode Support
* Toast Notifications
* Permission-Based Buttons
* Dynamic Forms
* Interactive Tables

---

# Frontend Setup

### Navigate To Frontend

```bash
cd frontend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create `.env`

```env
VITE_AUTH_BASE=http://localhost:8000

VITE_ADMIN_EMAIL=admin@company.com
```

### Start Development Server

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

# Technology Stack

| Layer          | Technology   |
| -------------- | ------------ |
| Frontend       | React 19     |
| Build Tool     | Vite         |
| Styling        | Tailwind CSS |
| Routing        | React Router |
| API Client     | Axios        |
| Backend        | FastAPI      |
| ORM            | SQLAlchemy   |
| Database       | PostgreSQL   |
| Authentication | JWT          |
| Authorization  | RBAC         |
| Validation     | Pydantic     |
| Migration      | Alembic      |

---

# Running the Complete Application

### Backend

```bash
cd backend

env\Scripts\activate

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

npm run dev
```

### Access URLs

| Service      | URL                        |
| ------------ | -------------------------- |
| Frontend     | http://localhost:5173      |
| Backend API  | http://localhost:8000      |
| Swagger Docs | http://localhost:8000/docs |

```
```
