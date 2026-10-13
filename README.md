# AgriLend360: Intelligent Loan, Repayment & Risk Analytics Platform for FPOs

> **A digital credit-management, risk analytics, and decision-support platform enabling Farmer Producer Organizations (FPOs) to manage the complete farmer credit lifecycle.**

---

## 📌 Executive Summary & Real-World Concept

**AgriLend360 is NOT a bank.**
AgriLend360 does **not** provide direct loan capital, nor does it transfer physical money. 

Instead, AgriLend360 is a **digital credit-management and decision-support software system** operated by a **Farmer Producer Organization (FPO)**. It provides end-to-end governance, credit risk analytics, workflow automation, and audit tracking for loans extended to member farmers.

### Real-World Actor & Funding Model

$$\begin{matrix}
\mathbf{Funding\ Source} \\
\text{\footnotesize (FPO Internal Fund / Commercial Partner Bank / Financial Institution / NABARD Partner)} \\
\Big\downarrow \ \text{\scriptsize Capital Allocation} \\
\mathbf{FPO\ (Farmer\ Producer\ Organization)} \\
\Big\downarrow \ \text{\scriptsize Credit Management \& Governance} \\
\mathbf{AgriLend360\ Digital\ Platform} \\
\Big\downarrow \ \text{\scriptsize Applications, KYC, Risk Scoring, EMI Tracking} \\
\mathbf{Borrower\ Farmer}
\end{matrix}$$

The actual loan funds originate from one of four designated **Funding Sources**:
1. `FPO_FUND`: Internal revolving capital managed by the FPO.
2. `PARTNER_BANK`: Commercial lending bank partnering with the FPO (e.g., SBI, HDFC).
3. `FINANCIAL_INSTITUTION`: Microfinance institutions, NABARD refinancing, or NBFCs.
4. `OTHER`: Government agricultural credit schemes or donor funding.

---

## 🏗 System Architecture & Separation of Powers

The platform strictly enforces the **Separation of Powers** required for financial governance:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROLE PERMISSION MATRIX                            │
├──────────────────────────┬──────────────┬──────────────────┬────────────────┤
│ Feature / Capability     │ Farmer       │ Loan Officer     │ FPO Admin      │
├──────────────────────────┼──────────────┼──────────────────┼────────────────┤
│ Apply for Credit         │  ✅ Create   │  ❌ Forbidden    │  ❌ Forbidden  │
│ Upload KYC / Land Proofs │  ✅ Upload   │  ❌ Forbidden    │  ❌ Forbidden  │
│ Verify / Reject Docs     │  ❌ Forbidden│  ✅ Assigned     │  ✅ Authorized │
│ Assign Loan Officer      │  ❌ Forbidden│  ❌ Forbidden    │  ✅ Authorized │
│ Decision-Support Summary │  ✅ View Own │  ✅ View Assigned│  ✅ Full View  │
│ Submit Recommendation    │  ❌ Forbidden│  ✅ Assigned Only│  ❌ Forbidden  │
│ Final Lending Decision   │  ❌ Forbidden│  ❌ Forbidden    │  ✅ Approver   │
│ Record Fund Disbursement │  ❌ Forbidden│  ❌ Forbidden    │  ✅ Authorized │
│ Record EMI Repayments    │  ❌ Forbidden│  ✅ Authorized   │  ✅ Authorized │
│ Geo-Analytics Map        │  ❌ Forbidden│  ✅ View Area    │  ✅ Full Map   │
│ Executive Reports Export │  ❌ Forbidden│  ✅ View Reports │  ✅ Full Export│
└──────────────────────────┴──────────────┴──────────────────┴────────────────┘
```

* **Farmer**: Self-registers profile, applies for agricultural credit, uploads KYC & land patta documents, inspects personal EMI schedules, and monitors credit health.
* **Loan Officer (Advisory Desk)**: Assigned by Admin to specific applications. Digitally inspects borrower credentials, verifies or rejects documents, evaluates decision-support scores, and submits formal qualitative recommendations (`RECOMMEND APPROVAL`, `RECOMMEND REJECTION`, `NEEDS ADDITIONAL INFORMATION`). **Officers cannot approve or disburse funds.**
* **FPO Admin (Approving Committee)**: Assigns officers, evaluates officer recommendations alongside AI risk indicators, commits final lending decisions (`APPROVED`, `REJECTED`, `NEEDS_INFORMATION`), designates the **Funding Source**, records disbursements, monitors portfolio cash flows, and conducts audit oversight. **Admins cannot submit officer recommendations.**

---

## 🔄 Complete 13-State Credit Lifecycle Workflow

Every loan transitions through an explicit, auditable sequence of lifecycle states:

```
                  ┌──────────────────────┐
                  │       PENDING        │ (Application Submitted)
                  └──────────┬───────────┘
                             │ Admin assigns Officer
                             ▼
                  ┌──────────────────────┐
                  │     UNDER REVIEW     │
                  └──────────┬───────────┘
                             │ Officer begins doc verification
                             ▼
                  ┌──────────────────────┐
                  │DOCUMENT VERIFICATION │
                  └──────────┬───────────┘
                             │ All KYC & Land docs verified
                             ▼
                  ┌──────────────────────┐
                  │  DOCUMENT VERIFIED   │
                  └──────────┬───────────┘
                             │ Engine generates Decision Support
                             ▼
                  ┌──────────────────────┐
                  │ ASSESSMENT COMPLETED │
                  └──────────┬───────────┘
                             │ Officer submits formal advisory
                             ▼
                  ┌──────────────────────┐
                  │     RECOMMENDED      │
                  └──────────┬───────────┘
                             │ Admin reviews & designates funding source
                             ▼
                  ┌──────────────────────┐
                  │       APPROVED       │
                  └──────────┬───────────┘
                             │ Admin records fund release
                             ▼
                  ┌──────────────────────┐
                  │      DISBURSED       │
                  └──────────┬───────────┘
                             │ Loan activated & amortization schedule active
                             ▼
                  ┌──────────────────────┐
                  │        ACTIVE        │
                  └──────────┬───────────┘
                             │ Repayments commence
                             ▼
                  ┌──────────────────────┐
                  │ REPAYMENT MONITORING │
                  └──────────┬───────────┘
                             │ All EMIs paid, balance = 0, overdue = 0
                             ▼
                  ┌──────────────────────┐
                  │        CLOSED        │
                  └──────────────────────┘

       [Alternative Exception Paths: REJECTED | NEEDS_INFORMATION]
```

### State Breakdown

1. **`PENDING`**: Farmer completes credit application with crop details, requested capital, duration, and uploads KYC proof and land registry papers.
2. **`UNDER REVIEW`**: Admin assigns an active Loan Officer to the borrower's caseload (`OFFICER_ASSIGNED` logged).
3. **`DOCUMENT VERIFICATION`**: Assigned officer starts reviewing submitted identity and land title deeds (`DOCUMENT_VERIFICATION_STARTED` logged).
4. **`DOCUMENT VERIFIED`**: All mandatory documents are individually marked `VERIFIED`. Loans cannot proceed if any document remains pending or rejected.
5. **`ASSESSMENT COMPLETED`**: System automatically invokes the Decision Support Engine (`riskEngine.js`), computing Default Risk Probability, Risk Tier, and Eligibility Score (`ASSESSMENT_GENERATED` logged).
6. **`RECOMMENDED`**: Assigned Loan Officer submits formal advisory review with notes:
   * `RECOMMEND APPROVAL`
   * `RECOMMEND REJECTION`
   * `NEEDS ADDITIONAL INFORMATION` $\rightarrow$ Transitions status to `NEEDS_INFORMATION`
7. **`APPROVED`**: FPO Approving Committee (Admin) reviews recommendations, selects the authorized **Funding Source**, and records approval (`ADMIN_DECISION` logged).
8. **`DISBURSED`**: Admin digitally records fund release from the designated funding source (`DISBURSEMENT_RECORDED` logged).
9. **`ACTIVE`**: Loan is activated for repayment tracking, calculating reducing-balance EMI amortization schedules (`LOAN_ACTIVATED` logged).
10. **`REPAYMENT MONITORING`**: Active loan transitions into ongoing repayment monitoring as installments are serviced (`REPAYMENT_MONITORING_STARTED` logged).
11. **`CLOSED`**: When **all EMIs are settled, outstanding balance = 0, and overdue balance = 0**, the loan transitions automatically to `CLOSED` (`LOAN_CLOSED` logged).

---

## 🧠 Decision Support & Risk Engine (`riskEngine.js`)

AgriLend360 calculates an objective, data-driven **Decision Support Summary** to assist human FPO officers and admins:

$$\mathbf{Risk\ Score} = 0.25(\text{LTI}) + 0.35(\text{Repayment}) + 0.15(\text{Active Loans}) + 0.15(\text{Land Coverage}) + 0.10(\text{Crop Risk})$$

### The 5 Weighted Pillars

| Pillar | Weight | Metric & Evaluation Logic | Scoring Scale |
| :--- | :---: | :--- | :--- |
| **1. Loan-to-Income (LTI) Ratio** | **25%** | $\frac{\text{Requested Amount} + \text{Active Debt}}{\text{Annual Agricultural Income}}$ | • $\le 20\%$: **15** (Low)<br>• $21\%-40\%$: **40** (Manageable)<br>• $41\%-70\%$: **70** (Elevated)<br>• $> 70\%$: **100** (Critical) |
| **2. Repayment History** | **35%** | Historical track record on past and active FPO loans | • Clean closed loans: **10**<br>• Active in good standing: **20**<br>• First-time borrower: **30**<br>• Overdue installments: $40 + (20 \times \text{count})$ |
| **3. Concurrent Active Loans** | **15%** | Number of open amortizing credit lines | • 0 active loans: **10**<br>• 1 active loan: **40**<br>• $2+$ active loans: **90** |
| **4. Land Debt Density** | **15%** | Debt density: $\frac{\text{Requested Amount}}{\text{Land Area in Acres}}$ | • $< ₹15\text{k}$/acre: **15**<br>• $< ₹35\text{k}$/acre: **45**<br>• $< ₹75\text{k}$/acre: **75**<br>• $\ge ₹75\text{k}$/acre: **100** |
| **5. Crop Risk & Volatility** | **10%** | Crop price volatility and vulnerability | • Low Risk (Vegetables, Pulses, Fruits): **15**<br>• Medium Risk (Paddy, Wheat, Sugarcane, Maize): **45**<br>• High Risk (Cotton, Groundnut, Tobacco): **75** |

### Output Metrics Generated
* **Default Risk Probability (`riskScore`)**: Composite score from $0\%$ to $100\%$.
* **Risk Tier (`riskLevel`)**: `LOW` ($0-30\%$), `MEDIUM` ($31-60\%$), `HIGH` ($61-80\%$), `CRITICAL` ($81-100\%$).
* **Eligibility Assessment Score (`eligibilityScore`)**: $\max(0, 100 - \text{riskScore})$.
* **Recommended Borrowing Range**:
  $$\text{Max Allowable Amount} = \text{Annual Income} \times 35\% \times \left(\frac{\text{Eligibility Score}}{100}\right)$$
* **Key Contributing Factors**: Natural-language drivers (e.g. `✓ Low loan-to-income ratio`, `⚠ Already has one active loan`).

---

## 📊 Dynamic Farmer Financial Health Score (`financialHealth.js`)

Each member farmer maintains a real-time creditworthiness score ($0-100$):
* **Baseline**: Starts at $60$ points.
* **Repayment Rate Bonus/Penalty**: Up to **$+25$** points for $100\%$ on-time repayments; up to **$-40$** points for low repayment rates.
* **Overdue Penalties**: Deducts **$-15$ points per overdue installment**.
* **Clean Loan Closures**: Grants **$+8$ points per completed loan** (capped at $+15$).
* **Debt-to-Income Utilization**: Penalizes excessive debt load relative to income ($-5$ to $-20$).
* **Health Ratings**:
  * $80 - 100$: **Excellent** (Emerald)
  * $60 - 79$: **Good** (Green)
  * $40 - 59$: **Fair** (Amber)
  * $20 - 39$: **Poor** (Orange)
  * $0 - 19$: **Critical** (Red)

---

## 💰 EMI Amortization & Repayment Monitoring

### Reducing-Balance Formula
Upon activation, AgriLend360 calculates monthly installments using standard financial amortization:

$$\text{EMI} = \frac{P \times r \times (1 + r)^n}{(1 + r)^n - 1}$$

Where:
* $P$ = Principal loan amount
* $r$ = Monthly interest rate ($\frac{\text{Annual Rate}}{12 \times 100}$)
* $n$ = Loan duration in months

### Multi-Dimensional Cascading Updates on Payment Recording
When an authorized Loan Officer or Admin records an EMI payment (`POST /api/repayments/:id/pay`):
1. **Schedule Update**: Installment marked `PAID` with `paymentDate = Date.now()`.
2. **Balance Recalculation**: Outstanding balance and unpaid installment count decrement.
3. **Overdue Clearing**: Overdue flags and penalty counters are resolved.
4. **Health Score Refresh**: Recalculates the farmer's financial health score immediately.
5. **Portfolio Real-Time Recalculation**: Total repaid amounts increment; live charts update.
6. **Audit Trail**: Appends immutable log `[REPAYMENT_RECORDED]`.
7. **Closure Verification**: If all EMIs are paid and balance = 0, transitions automatically to `CLOSED`.

---

## 📜 Cryptographic Audit Timeline (`AuditLog.js`)

Every single lifecycle event is recorded with an immutable audit entry:

| Audit Action | Stage | Description |
| :--- | :--- | :--- |
| `APPLICATION_SUBMITTED` | Farmer $\rightarrow$ FPO | Application details and requested capital recorded. |
| `OFFICER_ASSIGNED` | Admin $\rightarrow$ Officer | Caseload assigned to specific Loan Officer. |
| `DOCUMENT_VERIFICATION_STARTED` | Officer | Verification review begins on borrower documents. |
| `DOCUMENT_VERIFIED` | Officer | Individual or all KYC/land documents verified. |
| `DOCUMENT_REJECTED` | Officer | Document rejected with specific failure reason. |
| `ASSESSMENT_GENERATED` | System | Decision support scores, risk tier, and eligibility generated. |
| `OFFICER_RECOMMENDATION` | Officer $\rightarrow$ Admin | Officer recommendation submitted with rationale. |
| `ADMIN_DECISION` | Admin | Final lending decision committed with funding source. |
| `DISBURSEMENT_RECORDED` | Admin | Fund disbursement recorded from designated partner. |
| `LOAN_ACTIVATED` | System | Amortization schedule active; repayments ready. |
| `REPAYMENT_MONITORING_STARTED` | System | Active loan enters ongoing repayment monitoring. |
| `REPAYMENT_RECORDED` | Officer/Admin | EMI installment payment recorded with remaining balance. |
| `LOAN_CLOSED` | System | Loan successfully closed with zero outstanding balance. |

---

## 🗺 Interactive Geo-Analytics & Executive Dashboards

* **Executive Admin Dashboard**:
  * 11 real-time KPI tiles (Total Farmers, Applications, Approved Loans, Active Loans, Total Disbursed, Total Repaid, Outstanding Portfolio, Overdue Capital, Repayment Rate, Default Rate, Avg Health Score).
  * 5 Recharts visualizations (Crop Distribution, Risk Breakdown, Status Flow, Funding Source Allocations, Monthly Inflows/Outflows).
* **Interactive Borrower Geo-Map (`FarmerGeoMap.jsx`)**:
  * Powered by **Leaflet.js** and OpenStreetMap tiles.
  * Risk-coded borrower map markers (Green = Low, Amber = Medium, Red = High/Critical).
  * Farmer popup cards displaying primary crops, land holdings, financial health, and active debt.
* **Audit & Compliance Reports (`Reports.jsx`)**:
  * Exportable spreadsheet datasets (CSV format).
  * Printable PDF-formatted executive summaries for FPO board meetings and partner banks.

---

## 🛠 Technology Stack

### Backend
* **Runtime**: Node.js (v18+ / v22+)
* **Framework**: Express.js REST API
* **Database**: MongoDB with Mongoose ODM
* **Security & Auth**: JSON Web Tokens (JWT) with dual extraction (Header & Query Param), `bcryptjs` password hashing
* **File Processing**: Multer with strict MIME & extension verification

### Frontend
* **Core**: React 18 bootstrapped with **Vite**
* **Styling**: Tailwind CSS with responsive dark-slate design system
* **Routing**: React Router DOM (v6) with multi-role `ProtectedRoute` wrappers
* **HTTP Client**: Axios with centralized authorization interceptors and Blob streaming
* **Charts & Analytics**: Recharts (ResponsiveContainer, Bar, Line, Pie, Area)
* **Geographic Mapping**: Leaflet.js & React-Leaflet
* **Icons**: Lucide React

---

## 📂 Project Structure

```text
AgriLend360/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification (Header + Query token) & RBAC authorize
│   ├── models/
│   │   ├── User.js               # User accounts (Admin, Loan Officer, Farmer)
│   │   ├── Farmer.js             # Farmer agrarian profiles, GPS, crops, health score
│   │   ├── Loan.js               # Loan lifecycle records, funding source, officer recommendations
│   │   ├── Repayment.js          # Monthly reducing-balance EMI installments
│   │   ├── Document.js           # KYC & Land Patta file tracking & verification status
│   │   └── AuditLog.js           # Immutable timestamped audit log events
│   ├── routes/
│   │   ├── auth.js               # User login, registration, current profile
│   │   ├── farmers.js            # Farmer profiles & credit calculations
│   │   ├── loans.js              # Complete 13-stage loan workflow endpoints
│   │   ├── repayments.js         # Repayment recording, monitoring, closure
│   │   ├── documents.js          # Document upload, authenticated download, verification
│   │   ├── analytics.js          # Dashboard KPIs, chart distributions, risk alerts
│   │   └── reports.js            # Compliance, portfolio & audit reporting exports
│   ├── services/
│   │   ├── riskEngine.js         # 5-pillar decision support calculation engine
│   │   ├── financialHealth.js    # Farmer credit health score engine (0-100)
│   │   └── seed.js               # Database seeding script
│   ├── uploads/                  # Secure file storage for applicant documents
│   ├── test_verification.js      # Full 14-step automated verification suite
│   ├── server.js                 # Server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AboutModal.jsx    # System architecture & platform concept modal
│   │   │   └── Sidebar.jsx       # Role-aware navigation sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global user auth state & Axios config
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Login & Farmer Registration with Step 0 info
│   │   │   ├── AdminDashboard.jsx# Executive portfolio analytics console
│   │   │   ├── OfficerDashboard.jsx# Verification queue & caseload manager
│   │   │   ├── FarmerDashboard.jsx # Farmer portal with active loans & health score
│   │   │   ├── LoanDetails.jsx   # Complete 7-section loan workflow detail view
│   │   │   ├── LoanApplicationForm.jsx # Multi-step credit application form
│   │   │   ├── FarmersList.jsx   # Member directory & profile search
│   │   │   ├── FarmerProfile.jsx # Deep-dive farmer agrarian & financial profile
│   │   │   ├── FarmerGeoMap.jsx  # Leaflet interactive borrower geo-analytics
│   │   │   └── Reports.jsx       # Board report exporter & audit logs viewer
│   │   ├── App.jsx               # Route declarations & global header bar
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Installation & Local Execution

### Prerequisites
* **Node.js** (v18.x or v22.x recommended)
* **MongoDB** running locally on port `27017` (e.g. `mongodb://127.0.0.1:27017/agrilend360`)

### 1. Backend Server Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Populate database with demo farmers, loans, repayments, and audit histories:
   ```bash
   npm run seed
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Backend runs on **`http://localhost:5000`**.*

### 2. Frontend Setup
1. In a separate terminal, navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *Frontend opens at **`http://localhost:5173`**.*

---

## 🔑 Demo Access Credentials

The database seed script sets up credentials for testing all roles:

| Role | Email | Password | Primary Duties & Console |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@agrilend360.com` | `admin123` | Executive Dashboard, Assign Officers, Final Decisions, Record Disbursements, Geo Map, Reports. |
| **Loan Officer** | `officer@agrilend360.com` | `officer123` | Verification Queue, Verify Documents, Decision Support, Submit Recommendations, Record Repayments. |
| **Farmer** | `farmer@agrilend360.com` | `farmer123` | Farmer Dashboard, Apply for Credit, Upload KYC Documents, View EMI Calendars. |

---

## 🧪 Automated End-to-End Verification Suite

AgriLend360 includes a comprehensive automated verification test suite:

```bash
cd backend
node test_verification.js
```

This test suite programmatically executes:
* **Part A: Role Authorization Boundaries**: Verifies that unauthorized roles (e.g. farmers attempting recommendations/approvals, officers attempting final disbursements, admins submitting officer recommendations) are strictly blocked with `HTTP 403 Forbidden`.
* **Part B: Alternative Exception Paths**: Tests `NEEDS_INFORMATION` and `REJECTED` paths, verifying that non-approved loans cannot be disbursed.
* **Part C: Full Primary Workflow (14 Steps)**:
  1. Farmer submits loan application $\rightarrow$ `PENDING`
  2. Documents uploaded $\rightarrow$ `PENDING`
  3. Admin assigns officer $\rightarrow$ `UNDER REVIEW`
  4. Officer begins verification $\rightarrow$ `DOCUMENT VERIFICATION`
  5. Officer verifies all documents $\rightarrow$ `DOCUMENT VERIFIED`
  6. Decision-support generated $\rightarrow$ `ASSESSMENT COMPLETED`
  7. Officer submits recommendation $\rightarrow$ `RECOMMENDED`
  8. Admin commits approval with funding source $\rightarrow$ `APPROVED`
  9. Admin records disbursement $\rightarrow$ `DISBURSED`
  10. Loan activated for repayments $\rightarrow$ `ACTIVE`
  11. First repayment recorded $\rightarrow$ `REPAYMENT MONITORING`
  12. All installments paid $\rightarrow$ Remaining balance = 0
  13. Strict closure condition verified $\rightarrow$ `CLOSED`
  14. Audit trail validated with 25 cryptographically chained events

---

## 📝 Step-by-Step Live Demonstration Guide

To demonstrate the full AgriLend360 platform in the browser:

1. **Step 0: Platform Definition**:
   * Open `http://localhost:5173`.
   * Click **"About AgriLend360"** on the login screen or in the top header.
   * Review the real-world FPO lending model and operating principles.
2. **Step 1: Farmer Submits Application**:
   * Sign in as `farmer@agrilend360.com` (`farmer123`).
   * Click **"Apply for Credit"**, fill out loan purpose, amount, duration, and upload KYC/Land proofs.
   * Submit application $\rightarrow$ Status is `PENDING`.
3. **Step 2: Admin Assigns Officer**:
   * Sign in as `admin@agrilend360.com` (`admin123`).
   * Navigate to the new loan application. In Section 1, assign **Loan Officer Ramesh Patel**.
   * Application transitions to `UNDER REVIEW`.
4. **Step 3: Officer Verifies Documents & Submits Recommendation**:
   * Sign in as `officer@agrilend360.com` (`officer123`).
   * Open the assigned loan.
   * In Section 2, click **Verify** on both documents $\rightarrow$ Transitions through `DOCUMENT VERIFICATION` to `DOCUMENT VERIFIED`, auto-triggering `ASSESSMENT COMPLETED`.
   * Review the **Decision Support Summary** in Section 3 (Risk probability, risk tier, recommended range, contributing factors).
   * In Section 4, submit **"RECOMMEND APPROVAL"** $\rightarrow$ Transitions to `RECOMMENDED`.
5. **Step 4: Admin Approval & Disbursement Recording**:
   * Sign in as `admin@agrilend360.com` (`admin123`).
   * In Section 5, record final lending decision: **"Approve"** and select **"Commercial Partner Bank"** as Funding Source $\rightarrow$ Transitions to `APPROVED`.
   * Click **"Record Disbursement"** modal and confirm fund release $\rightarrow$ Transitions `APPROVED` $\rightarrow$ `DISBURSED` $\rightarrow$ `ACTIVE`.
6. **Step 5: Repayment Monitoring**:
   * Scroll down to Section 6 (**Repayment Schedule & Amortization**).
   * Click **"Record Pay"** on the first installment $\rightarrow$ Transitions `ACTIVE` $\rightarrow$ `REPAYMENT MONITORING`.
   * Note how the farmer's health score increases and outstanding balance decrements.
7. **Step 6: Loan Closure**:
   * Record the remaining scheduled installments.
   * Once the final installment is paid and outstanding balance reaches ₹0, the loan automatically transitions: `REPAYMENT MONITORING` $\rightarrow$ **`CLOSED`**.
8. **Step 7: Audit Timeline Oversight**:
   * Scroll down to Section 7 (**Application Audit History Timeline**) to inspect the complete, immutable timeline of all actions taken by each actor.
