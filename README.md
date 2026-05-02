# Job Matching Platform

Enterprise monorepo with separate **Backend** (Express + Prisma) and **Frontend** (Next.js).

## Architecture

```
├── apps/
│   └── web/                  # Next.js Frontend (Port 3000)
│       └── src/
│           ├── app/          # Pages & Routing
│           ├── components/   # UI Components
│           ├── lib/          # Client Utils (auth, api, siteConfig)
│           ├── data/         # Admin Mock Data
│           ├── i18n/         # Internationalization
│           └── messages/     # Translation Files
├── packages/
│   ├── backend/              # Express API Server (Port 4000)
│   │   └── src/
│   │       ├── config/       # Prisma Client, Environment
│   │       ├── controllers/  # Request/Response Handling
│   │       ├── services/     # Business Logic
│   │       ├── middleware/    # Auth, Validation
│   │       ├── routes/       # Route Definitions
│   │       └── database/     # Prisma Schema, Migrations, Seed
│   └── shared/               # Shared TypeScript Types
│       └── src/index.ts
└── .env                      # Environment Variables
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Seed demo users
npm run db:seed

# 4. Start both servers
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

## API Endpoints

| Method | Endpoint             | Auth | Description          |
|--------|----------------------|------|----------------------|
| POST   | /api/auth/register   | No   | Register new user    |
| POST   | /api/auth/login      | No   | Login, returns JWT   |
| GET    | /api/auth/session    | Yes  | Validate JWT session |
| GET    | /health              | No   | Server health check  |

## Demo Accounts

| Role       | Email                    | Password      |
|------------|--------------------------|---------------|
| Admin      | admin@gjej-pune.com      | admin123      |
| Employer   | employer@gjej-pune.com   | employer123   |
| Job Seeker | jobseeker@gjej-pune.com  | jobseeker123  |

## Scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start backend + frontend           |
| `npm run build`   | Build all packages                 |
| `npm run db:generate` | Generate Prisma client         |
| `npm run db:seed`     | Seed demo users                |
| `npm run db:studio`   | Open Prisma Studio             |
| `npm run db:migrate`  | Run database migrations        |

## Tech Stack

- **Backend:** Express.js, Prisma ORM, SQLite, JWT, bcryptjs
- **Frontend:** Next.js 16, React 19, TailwindCSS 4, next-intl
- **Shared:** TypeScript, npm Workspaces
