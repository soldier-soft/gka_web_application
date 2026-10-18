# GKA Construction — Enterprise Construction ERP, Project Management & Client Portal

A modern, production-oriented digital operating system and enterprise web platform engineered for **GKA Construction** ([gkaconstruction51@gmail.com](mailto:gkaconstruction51@gmail.com) | +91 88380 30917). 

This platform seamlessly unifies public lead generation, intelligent estimation, end-to-end ERP project execution, mobile site diaries, inventory ledgering, strict integer paise financial accounting, and a secure client progress portal into a single full-stack MERN application.

---

## 🏛️ Company Profile & Identity

- **Legal Entity:** GKA Construction
- **GSTIN:** `33CDYPA3555M2ZZ`
- **PAN:** `CDYPA3555M`
- **Registered Headquarters:** No. 174, Mettu Street, Kelur Village & Post, Polur Taluk, Tiruvannamalai District – 606 907, Tamil Nadu
- **Branch Office:** Kelambakkam, Chennai – 603 103, Tamil Nadu
- **Core Specializations:** Turnkey Residential & Commercial Construction, Civil & Structural Engineering, Renovation, Interior Fit-Outs, Structural Estimation, Quality Monitoring, and Project Handover.
- **Representative Commercial Projects:** Roots Corporation Limited (*Ginger Hotel, Navalur, Chennai* - MEP, civil, masonry, tiling, and plastering).

---

## 🚀 Key Modules & System Architecture

The platform provides 4 synchronized portals backed by a centralized MongoDB database:

### 1. Premium Public Business Website
- **Branded Design:** Deep luxury navy (`#0F1E36`), restrained gold (`#C59A27`), crisp white, and subtle slate neutrals with glassmorphism touches.
- **Interactive Construction Cost Estimator:** Real-time parametric cost calculator for Residential, Commercial, Renovation, and Turnkey projects. Allows clients to adjust square footage, floor counts, and finishing packages (Standard, Premium, Luxury) to generate a full Bill of Quantities (BOQ) breakdown with a 1-click consultation booking form.
- **Pages & Lead Generation:** Home, About Us, Services, Portfolio (featuring Ginger Hotel), Contact, Site Visit Booking, and Legal Pages (Privacy Policy, Terms of Service).
- **SEO & Structured Data:** Built-in semantic HTML5, canonical routing, meta tags, and schema.org structured data.

### 2. Owner's ERP Dashboard & Project Management
- **Executive KPIs:** Live project count, Total Contract Value, Approved Budgets, Actual Incurred Expenses, Committed Costs, Invoiced Amounts, Realized Collections, and Total Outstanding Receivables.
- **Visual Analytics:** Interactive Recharts comparing Contract vs Budget vs Actual Costs, along with capital distribution breakdowns.
- **CRM & 1-Click Project Conversion:** Leads captured from the public website can be reviewed, qualified, scheduled for site visits, and converted into active ERP projects with automated client profile generation.
- **6-Stage Standard Milestone Workflow:**
  1. `01 Planning & Approvals`
  2. `02 Foundation & Substructure`
  3. `03 Structural Framing (RCC/Beams/Slabs)`
  4. `04 MEP & Civil Plastering`
  5. `05 Finishing & Interior Handover`
  6. `06 Final Inspection & Handover Checklist`
- **Milestone Progress Tracking:** Automatic project completion % recalculation based on weighted milestone percentages.

### 3. Construction Estimation & Branded PDF Engine
- **Itemized BOQ Builder:** Create quantity-based and material/labour cost breakdowns with units (sq.ft, cu.m, bags, tonnes, nos) and custom GST tax configurations.
- **Standard Rate Library:** Quick-picker for standard Tamil Nadu market rates (RCC M20, Brickwork, Plastering, Vitrified Tiling, Painting, Electrical points).
- **One-Click Quotation Approval:** Automatically locks the approved quotation and initializes the Project Execution Budget without duplicate data entry.
- **Branded PDF Streaming:** Server-side streaming PDF generator built with `PDFKit` producing official A4 Quotations and Tax Invoices with GKA company headers, GSTIN, PAN, bank details, and signature blocks.

### 4. Mobile Site Operations & Live Inventory Ledger
- **Mobile-First Site Diary:** Site supervisors record daily logs directly from the field, tracking weather, mason/helper headcounts, work descriptions, and progress photos.
- **Client Transparency Approval Workflow:** Site reports and photos feature an `isPublishedToClient` toggle—ensuring internal supervisor notes and cost margins remain confidential until cleared by the Project Manager.
- **Live Inventory Ledger:** Stock balances are dynamically calculated from purchase receipts and site material issues—eliminating out-of-sync manual quantity counters. Tracks cement, TMT steel, M-sand, aggregate, bricks, and paint.

### 5. Financial Integrity & Project Profitability
- **Strict Integer Paise Modeling:** All monetary amounts (`contractValuePaise`, `totalBudgetPaise`, `actualCostPaise`, `invoicedAmountPaise`, `collectedAmountPaise`) are stored and computed in integer paise (1 INR = 100 paise), avoiding IEEE 754 floating-point inaccuracies.
- **Clear Financial Segregation:**
  - *Contract Value:* Agreed commercial price with approved variations.
  - *Budget:* Planned execution cost.
  - *Actual Cost:* Expenses incurred and verified by bills.
  - *Invoiced:* GST tax invoices raised to customer.
  - *Collected:* Certified bank receipts deposited.
  - *Receivables:* Invoiced balance remaining.
  - *Estimated Final Profit:* Forecast revenue minus total projected costs.

### 6. Secure Client Portal
- Isolated client login where verified clients view real-time milestone progress, approved site diary updates, verified progress photographs, and downloadable PDF invoices.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v6, Recharts, Lucide React, Canvas Confetti |
| **Backend API** | Node.js, Express, TypeScript, Zod Validation, JWT Authentication, Bcrypt.js, CORS, Helmet |
| **Database** | MongoDB Atlas / Local MongoDB 8.2+, Mongoose 8.x with Strict Schemas & Indexes |
| **Document Generation** | PDFKit (Vector-sharp A4 PDF streaming for Quotes & Tax Invoices) |
| **Automated Testing** | Vitest (API & Financial Accounting Unit/Integration Tests) |

---

## 📁 Repository Directory Structure

```
gka/
├── client/                     # Frontend Application (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/         # Layouts, Navbar, Footer, UI Modals
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── pages/
│   │   │   ├── admin/          # ERP Dashboard, Projects, CRM, Quotes, Site Ops, Finance, Inventory
│   │   │   ├── auth/           # Login Page with 1-click Role Switcher
│   │   │   ├── client/         # Client Portal Experience
│   │   │   └── website/        # Public Website (Home, About, Services, Projects, Estimator, Contact)
│   │   └── shared/             # Client-side shared types
│   ├── vite.config.ts
│   └── package.json
├── server/                     # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Environment, Database, & Constants
│   │   ├── middleware/         # JWT Auth, Role-Based Access Control, Error Handler
│   │   ├── models/             # Mongoose Models (User, Project, Quotation, Invoice, etc.)
│   │   ├── modules/            # API Controllers (Auth, CRM, Projects, Quotations, SiteOps, Finance)
│   │   ├── seed/               # Database Seeder with authentic GKA data
│   │   ├── services/           # PDF Generation Service (PDFKit)
│   │   └── app.ts
│   ├── tests/                  # Automated Vitest Financial & Workflow Test Suite
│   └── package.json
├── docs/                       # Operational Documentation & Runbooks
│   └── backup_and_recovery.md  # MongoDB Backup & Disaster Recovery Guide
├── shared/                     # Shared TypeScript interfaces & types
├── .env.example                # Root environment template
└── README.md
```

---

## ⚡ Complete Startup Procedure & Quick Start Guide

Follow these steps to set up, configure, and launch the GKA Construction platform locally.

### 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **MongoDB**: MongoDB Server 7.0+ running locally on port `27017` or a remote MongoDB Atlas URI.
  - *On Windows:* Start service via PowerShell: `net start MongoDB` or verify with `Get-Service MongoDB`.

---

### 🚀 Step-by-Step Startup Guide

#### Step 1: Clone the Repository
```bash
git clone https://github.com/soldier-soft/gka_web_application.git
cd gka_web_application
```

#### Step 2: Install Dependencies
Install dependencies for both backend and frontend:

**Option A — From the project root:**
```bash
npm run install:all
```

**Option B — Manually in each directory:**
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

#### Step 3: Configure Environment Variables

1. **Server Configuration:** Create `server/.env` (or copy from `server/.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   MONGODB_URI=mongodb://127.0.0.1:27017/gka_construction_erp
   JWT_SECRET=gka-super-secure-production-jwt-secret-key-2026
   JWT_EXPIRES_IN=7d
   UPLOAD_DIR=./uploads
   ```

2. **Client Configuration:** Create `client/.env` (or copy from `client/.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

#### Step 4: Seed Database with Initial Authentic Data
Populate realistic projects (*Roots Corporation / Ginger Hotel*, Luxury Villas), staff roles, milestones, rate library, and financial transactions:

```bash
cd server
npm run seed
```
*(Or from root: `npm run seed`)*

#### Step 5: Launch the Application

**Option A — Windows One-Click Starter:**
Double-click `start-dev.bat` in the root directory to open both the API and Client in separate windows.

**Option B — Two Terminal Windows (Standard Development):**

- **Terminal 1 — Backend Express API:**
  ```bash
  cd server
  npm run dev
  # Server listening on http://localhost:5000
  ```

- **Terminal 2 — Frontend React Client:**
  ```bash
  cd client
  npm run dev
  # Frontend running on http://localhost:3000
  ```

---

### 🌐 Application Endpoints & Verification

| Service | URL | Description |
| :--- | :--- | :--- |
| **Public Website & Portal** | [http://localhost:3000](http://localhost:3000) | Main website, Cost Estimator, Portfolio, Consultation Booking |
| **Admin & Client Login** | [http://localhost:3000/login](http://localhost:3000/login) | ERP Login with 1-click demo role switcher |
| **Backend REST API** | [http://localhost:5000/api/v1](http://localhost:5000/api/v1) | Express REST endpoints |
| **API Health Check** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Returns JSON `{ status: "healthy" }` |

---


## 🔑 Default Test Credentials

All demo accounts are pre-seeded and accessible via quick 1-click role buttons on the `/login` page:

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Owner / Super Admin** | `owner@gkaconstruction.com` | `GKAadmin2026!` | Full ERP access, financial ledgers, settings, user management |
| **Project Manager** | `pm@gkaconstruction.com` | `GKApm2026!` | Project workspaces, milestone updates, quotation approvals |
| **Site Supervisor** | `supervisor@gkaconstruction.com` | `GKAsuper2026!` | Mobile site diary, labour headcounts, progress photo uploads |
| **Accounts Staff** | `accounts@gkaconstruction.com` | `GKAaccounts2026!` | Tax invoices, expense vouchers, customer payment collections |
| **Client** | `client@gingerhotel.com` | `GKAclient2026!` | Isolated portal for Roots Corp Ginger Hotel project progress & invoices |

---

## 🧪 Automated Testing

The platform includes automated Vitest tests verifying financial integer paise calculations, milestone weighted progress logic, and quotation-to-budget conversions:

```bash
cd server
npm run test
```

Test coverage includes:
- ✅ Integer paise currency calculations (no float drift)
- ✅ 18% GST tax computations with rounding safety
- ✅ Weighted milestone completion percentage engine
- ✅ Quotation approval locks and project budget initialization
- ✅ Role-based access control and client isolation

---

## 📄 License & Attribution

Developed specifically for **GKA Construction**. All trademarks, project specifications, and brand assets are the property of GKA Construction.
