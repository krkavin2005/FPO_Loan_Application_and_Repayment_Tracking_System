# AgriLend360: Intelligent Loan, Repayment & Risk Analytics Platform for FPOs

AgriLend360 is a production-quality full-stack web application designed for Farmer Producer Organizations (FPOs) to digitally manage the complete agricultural loan lifecycle.

The system incorporates:
1. **Default Risk Prediction**: Calculates default probability and categorizes risk (LOW, MEDIUM, HIGH, CRITICAL) using a weighted parameter assessment model.
2. **Farmer Financial Profiles**: Highlights agrarian properties, crop cycles, incomes, and credit scores (0-100).
3. **Loan & Repayment Analytics**: Monitors outstanding capitals, principal-interest reductions, and cash flow trends.
4. **Geo-Based Farmer Visualization**: Leverages Leaflet maps with risk-coded markers to analyze agricultural borrower density.

---

## 🛠 Technology Stack

### Backend
* **Node.js** with **Express.js** REST API framework
* **MongoDB** & **Mongoose** Object Document Mapper (ODM)
* **JWT** (JSON Web Tokens) for secure session headers
* **bcryptjs** for credential password hashing
* **Multer** for multipart loan verification documents upload

### Frontend
* **React.js** bootstrapped via **Vite**
* **Tailwind CSS** for responsive styling layouts
* **React Router DOM** for multi-role router guards
* **Axios** for centralized HTTP API requests
* **Recharts** for premium dashboard charts (line, bar, pie)
* **Leaflet.js** and **React Leaflet** for interactive geo-mapping maps
* **Lucide React** for modern financial icons

---

## 📂 Project Structure

```text
AgriLend360/
│
├── backend/
│   ├── config/              # MongoDB connection configurations
│   ├── middleware/          # JWT auth validation & multer checks
│   ├── models/              # Mongoose database schemas
│   ├── routes/              # Express API routers (auth, farmers, loans, etc.)
│   ├── services/            # Risk calculator, health scoring & seed script
│   ├── utils/               # Token generators
│   └── server.js            # Express server configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Common UI components (Sidebar)
│   │   ├── context/         # Auth state context manager
│   │   └── pages/           # Farmer, Admin, Officer pages & forms
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Installation & Local Execution

### Prerequisites
* **Node.js** (v18.x or v22.x recommended)
* **MongoDB** (Ensure a local instance is running at `mongodb://127.0.0.1:27017/` or update connection details in `.env`)

### 1. Backend Server Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. The `.env` configuration file has been pre-configured:
   ```text
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/agrilend360
   JWT_SECRET=agrilend360_super_secure_jwt_token_secret_9988776655
   NODE_ENV=development
   ```
3. Run the Mongoose seeding script to populate metrics, mock coordinates, and EMI lists:
   ```bash
   npm run seed
   ```
4. Start the Express API server:
   ```bash
   npm start
   ```
   *The server runs locally on **`http://localhost:5000`**.*

### 2. Frontend React Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client app runs locally on **`http://localhost:5173`** (or the port specified by Vite).*

---

## 🔑 Demo Access Credentials

The database seeding script pre-populates three default role profiles. You can test each dashboard experience immediately:

| Role | Username / Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@agrilend360.com` | `admin123` | Inspects FPO analytics, approves loans, generates reports, views geo-map. |
| **Loan Officer** | `officer@agrilend360.com` | `officer123` | Reviews farmer assets, verifies KYC docs, records repayments. |
| **Farmer** | `farmer@agrilend360.com` | `farmer123` | Applies for credit, uploads Aadhaar/land proofs, reviews EMI calendars. |

---

## 🛡 Security Controls
* Passwords are hashed with a 10-round salt using `bcryptjs` before storage.
* Farmer document uploads are protected behind JWT authentication middleware and served securely via Express binary streaming; they are not exposed publicly in static assets.
* Cross-Origin Resource Sharing (CORS) is enabled between port `5173` and `5000`.
