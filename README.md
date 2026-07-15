# FixDesk

> Web-based repair shop management system with AI-powered summaries.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red)

## What it does

FixDesk helps repair shops manage their workflow:

- **Repair Tracking** — intake to delivery, full lifecycle
- **Client Management** — customers, devices, history
- **AI Assistant** — local Ollama-powered summaries and insights
- **Dashboard** — stats, charts, recent activity

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Prisma ORM |
| Database | SQLite |
| AI | Ollama (local inference) |

## Quick Start

```bash
git clone https://github.com/alfredfonher/fixdesk.git
cd fixdesk
pnpm install
pnpm run setup:web
pnpm run dev:web
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
fixdesk/
├── src/
│   ├── app/          # Next.js App Router + API
│   ├── components/   # React components
│   └── lib/          # Utilities, DB, auth
├── prisma/           # Database schema
├── scripts/          # Setup & utility scripts
└── public/           # Static assets
```

## License

Proprietary — All Rights Reserved. See [LICENSE](LICENSE).
