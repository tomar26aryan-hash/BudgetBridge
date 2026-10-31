# 💰 BudgetBridge – Personal Finance Tracker

A full-stack personal finance management web application that helps users track income, expenses, and budgets with real-time analytics and visual dashboards.

## 🚀 Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | React.js, React Router, Recharts                  |
| Backend  | Node.js, Express.js, REST API                     |
| Database | MySQL (relational schema with joins)              |
| Auth     | JWT-based authentication, bcrypt password hashing |

## ✨ Features

- **User Authentication** – Secure register/login with JWT tokens
- **Transaction Management** – Add, view, filter, and delete income/expense transactions
- **Budget Tracking** – Set monthly category-wise budgets with live progress bars and overspend alerts
- **Analytics Dashboard** – Monthly bar chart, category-wise pie chart, balance summary cards
- **RESTful API** – Clean backend API with protected routes and MySQL aggregations

## 📁 Project Structure

```
BudgetBridge/
├── package.json              # Root scripts used by hosting (build / start)
├── render.yaml               # Optional one-click Render blueprint
├── DEPLOYMENT.md             # Step-by-step deployment guide
├── backend/
│   ├── config/
│   │   ├── env.js            # Loads .env, validates JWT_SECRET
│   │   ├── dbConfig.js       # DB settings (DATABASE_URL or DB_* vars, SSL)
│   │   └── db.js             # MySQL connection pool
│   ├── middleware/auth.js    # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js           # POST /register, /login
│   │   ├── transactions.js   # CRUD + category grouping
│   │   ├── budgets.js        # Budget with live spending JOIN
│   │   └── dashboard.js      # Summary + monthly aggregates
│   ├── scripts/init-db.js    # Creates tables from schema.sql (npm run db:init)
│   ├── schema.sql            # MySQL schema
│   ├── .env.example          # Backend environment template
│   └── server.js             # Express app (API + serves the React build)
└── frontend/
    └── src/
        ├── api.js                    # Shared axios client (base URL, auth header)
        ├── context/AuthContext.jsx   # Global auth state
        ├── pages/                    # Dashboard, Transactions, Budgets, Login, Register
        └── components/Navbar.jsx
```

## ⚙️ Run Locally

You need Node.js 20+ and MySQL 8 (or MariaDB).

```bash
# 1. Create the empty database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS budgetbridge"

# 2. Backend  (http://localhost:5000)
cd backend
npm install
cp .env.example .env      # then edit DB_PASSWORD etc.
npm run db:init           # creates the tables
npm run dev

# 3. Frontend  (http://localhost:3000) - in a second terminal
cd frontend
npm install
npm start
```

In development the React dev server proxies `/api` calls to the backend, so no extra configuration is needed. Open http://localhost:3000 and register an account.

## 🚢 Deploy

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full step-by-step guide (free setup: Render + Aiven MySQL).

In production a single Node process serves both the API and the built React app:

```bash
npm run build      # installs deps + builds the frontend
npm start          # starts Express on $PORT, serves API + frontend
```

## 🔌 API Endpoints

| Method | Endpoint                      | Description                          |
| ------ | ----------------------------- | ------------------------------------ |
| GET    | /api/health                   | Health check (also tests the DB)     |
| POST   | /api/auth/register            | Register new user                    |
| POST   | /api/auth/login               | Login + get JWT                      |
| GET    | /api/transactions             | Get all transactions                 |
| POST   | /api/transactions             | Add transaction                      |
| DELETE | /api/transactions/:id         | Delete transaction                   |
| GET    | /api/transactions/by-category | Spending by category                 |
| GET    | /api/budgets                  | Get budgets with live spent (month)  |
| POST   | /api/budgets                  | Set/update budget                    |
| GET    | /api/dashboard/summary        | Monthly summary + charts data        |

All endpoints except `/api/health` and `/api/auth/*` require an `Authorization: Bearer <token>` header.

## 👩‍💻 Author
Aryan Tomar(Teammate:Akshita Bhardwaj) | B.Tech CSE | Graphic Era University
