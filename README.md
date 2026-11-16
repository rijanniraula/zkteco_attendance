# ZKTeco Attendance Management System

An attendance system for ZKTeco biometric devices. The backend syncs device punches into its own SQLite database, so history stays available when the device is offline. Employees log in to see their own attendance. A super admin manages users, holidays, shift times and status corrections.

## Features

### 👤 Accounts and roles

- **Super admin**: manages users, links them to device users, configures holidays and shift groups, corrects attendance, exports reports
- **Employee**: sees only their own attendance history, with date filters
- Login with email and password (JWT). New and reset accounts must change their password at first login.

### 🔄 Device sync

- Pulls all punches and device users into SQLite at startup and every few minutes (configurable)
- Records live punches instantly and speaks "Thank You" or "Sorry Attendance not recorded"
- Remembers the device IP. It searches the local network only when the saved IP stops answering.

### 📋 Attendance rules

Each day's status comes from the first rule that applies:

1. **Admin correction**: always wins. Requires a reason and is recorded in the audit log.
2. **Holiday**: weekly days off (default Saturday and Sunday) or a specific holiday date
3. **Punches**: the first punch at or after the user's shift group "late after" time counts as Late, otherwise Present. Flexible groups are never late.
4. **No punch**: Absent for past days, Pending for today until the shift ends

Shift groups support per-weekday exceptions (for example, Friday ends at 13:15). The default groups are Regular (late after 09:41), Staff (late after 08:45) and Part-time (flexible).

### 📊 Reports

- Users × days grid with Present / Late / Absent / Leave / Holiday totals
- Click a cell to correct it, for example when the device was down
- Excel export, optionally with punch times

## Tech Stack

- **Backend**: Node.js, Express 5, SQLite (better-sqlite3), JWT (jsonwebtoken + bcryptjs), zod, zkteco-js, ExcelJS, say
- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Radix UI, Lucide icons

## Project Structure

```
attend_backend/
├── data/attendance.db      # SQLite database (gitignored, created automatically)
├── src/
│   ├── db/                 # connection, migration runner, migrations/*.sql
│   ├── services/           # device connection, sync, attendance rules, Excel, settings, audit
│   ├── middleware/         # auth (JWT + roles), request validation
│   ├── controllers/        # auth, me, admin/*
│   ├── routes/             # /api/auth, /api/me, /api/admin
│   ├── scripts/            # seed-admin, import-usermap
│   └── server.js
└── test/                   # node --test unit tests
attend_frontend/
└── src/
    ├── context/            # AuthContext (token + current user)
    ├── components/         # layout, attendance grid, dialogs, ui/*
    ├── pages/              # login, change-password, my-attendance, admin/*
    └── helpers/            # API client and constants
```

## Installation

### Prerequisites

- Node.js 20 or higher
- A ZKTeco device on the same network as the backend

### Backend

```bash
cd attend_backend
npm install
```

Create `attend_backend/.env`:

```env
PORT=3000
NODE_ENV=development
TZ=Asia/Kathmandu            # must match the device's local time

JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173   # comma-separated frontend origins; empty = allow all

SEED_ADMIN_NAME="Super Admin"
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=at-least-8-chars

ZK_IP=192.168.1.20           # optional fallback; the last found IP is saved in the database
ZK_PORT=4370
ZK_TIMEOUT=10000
ZK_INOUT=4000
# DB_PATH=./data/attendance.db
```

Create the first super admin, then start the server. Migrations run automatically on startup.

```bash
npm run seed:admin
npm run dev        # or: npm start
```

Running `seed:admin` again resets that admin's password to the value in `.env`.

#### Importing the old usersMap.js (optional)

If you have the old hard-coded `usersMap.js`, you can import it once. Each entry becomes an employee linked to its device user ID, gets the Staff, Part-time or Regular group based on the old UID lists, and gets a placeholder email (`user<id>@attendance.local`) that you can edit later on the Users page.

```bash
IMPORT_DEFAULT_PASSWORD=temporary-pass npm run import:usermap path/to/usersMap.js
```

### Frontend

```bash
cd attend_frontend
npm install
npm run dev
```

The frontend calls `http://localhost:3000/api/` by default. To point it at another backend (for example an ngrok URL), create `attend_frontend/.env`:

```env
VITE_API_URL=https://your-backend.example.com/api/
```

Also add the frontend's origin to the backend's `CORS_ORIGIN`.

## API

All routes except login need `Authorization: Bearer <token>`.

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/login` | anyone |
| GET | `/api/auth/me` · POST `/api/auth/change-password` | logged in |
| GET | `/api/me/attendance?start=YYYY-MM-DD&end=YYYY-MM-DD` | logged in (own data) |
| GET/POST/PATCH/DELETE | `/api/admin/users[/:id]` | super admin |
| GET | `/api/admin/device/info` · `/api/admin/device/users` · POST `/api/admin/device/sync` | super admin |
| GET | `/api/admin/attendance?start&end&userId` · POST `/api/admin/attendance/export` | super admin |
| PUT | `/api/admin/attendance/override` · DELETE `/api/admin/attendance/override/:id` | super admin |
| GET/POST/DELETE | `/api/admin/holidays[/:id]` (POST takes `date`, optional `endDate`, `name`) · POST `/api/admin/holidays/delete` `{ids}` | super admin |
| GET/PUT | `/api/admin/settings` (weekly_off_days, sync_interval_min, zk_ip) | super admin |
| GET/POST/PUT/DELETE | `/api/admin/shift-groups[/:id]` | super admin |

## Development

```bash
cd attend_backend && npm test     # attendance rule unit tests
cd attend_frontend && npm run lint
cd attend_frontend && npm run build
```

Schema changes go in a new file under `attend_backend/src/db/migrations/` (for example `002_add_x.sql`). It is applied once, in name order, on the next startup.
