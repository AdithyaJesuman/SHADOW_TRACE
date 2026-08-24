# SHADOW TRACE - Fraud Engine Dashboard

Your entire project is located in: **`C:\Users\adith\OneDrive\Desktop\db+fast api`**

---

## 📁 Project Architecture & File Map

### 🌐 The Backend API Layer (`app/` folder)
This folder is built with **FastAPI** and handles all web traffic, routing, and data validation.
* **`app/main.py`** — **The Entry Point:** Defines all API routes (`GET /transactions`, `POST /customers`) and serves the compiled React frontend.
* **`app/api_schemas.py`** — **The Bouncers:** Pydantic models that define the exact shape of incoming data and throw errors if fields are missing.
* **`app/model.py`** — **The Database Blueprint:** SQLAlchemy models that map Python classes directly to your Postgres database tables.
* **`app/database.py`** — **The Reader Connection:** Sets up the SQLAlchemy database connection used by `main.py` for reading data (`GET` requests).

### ⚙️ The Backend Engine Layer (`src/` folder)
This folder handles high-performance database inserts and custom business logic.
* **`src/adapters/ps.py`** — **The Heavy Lifter:** Contains raw `asyncpg` SQL queries used to insert data into Postgres, handling idempotency and complex writes for `POST` routes.
* **`src/adapters/base.py`** — **The Writer Connection:** Sets up the high-speed connection pool specifically for the `ps.py` script.
* **`src/logger.py`** — **The Terminal Output:** Custom logging script for color-coded terminal messages.

### ⚛️ The Frontend UI Layer (`frontend/` folder)
This folder contains the React application built with Vite, Tailwind CSS, and Recharts.
* **`frontend/src/App.jsx`** — **The Core Layout:** Contains the dark-mode Sidebar and navigation logic.
* **`frontend/src/services/api.js`** — **The Gateway:** The *only* file that communicates with the backend. It handles all `fetch()` calls.
* **`frontend/src/components/Dashboard.jsx`** — The Overview component with animated Recharts (Area and Donut charts).
* **`frontend/src/components/LiveFeed.jsx`** — The real-time transaction table with Framer Motion animations.
* **`frontend/src/components/ReviewQueue.jsx`** — The manual investigation queue.
* **`frontend/src/components/TransactionDetail.jsx`** — The slide-over panel showing deeply nested JSON data (Device, IP, Features).

### 🎛️ Configuration Files
* **`.env`** — Stores your secret `DATABASE_URL`.
* **`config.yaml`** — Stores settings for the fraud engine, like Neo4j credentials and feature flags.

---

## 🚀 How to turn it on (One-Click)

The backend and frontend are **Unified**. FastAPI serves the React app directly, so you only need to run one backend server!

Simply go to your project folder and double-click **`start.bat`**. This script will automatically:
1. Start the PostgreSQL Docker container.
2. Start the Neo4j Docker container.
3. Open a terminal window and run `uvicorn app.main:app` (using your Anaconda `base` environment).

Once the terminal pops up, your entire application is available at:
👉 **`http://localhost:8000`**

---

## 🌍 How to deploy the application

When you are ready to put this on the internet for real users, you deploy the databases and backend separately:

1. **Deploy the Databases:** Host PostgreSQL on **Supabase** (or Render) and Neo4j on **Neo4j AuraDB**. They will give you production URLs. Update your `.env` and `config.yaml` with these new URLs.
2. **Deploy the Unified Backend:** Push your code to a GitHub repository. Sign up for **Render.com** or **Railway.app** and connect your repo. Set the Start Command to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. 
*(Because FastAPI serves the React dist folder, deploying the backend automatically deploys the frontend too!)*
