# FixDesk

A modern repair shop management system built with Next.js, Electron, Prisma, and SQLite.

## Features

- **Repair Tracking** - Manage repair tickets from intake to delivery
- **Client Management** - Keep track of customers and their devices
- **AI Assistant** - Get intelligent summaries and insights about your repairs
- **Desktop App** - Native desktop experience with Electron

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** SQLite
- **Desktop:** Electron
- **AI:** Ollama integration for local AI summaries

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended)
- Ollama (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/alfredfonher/fixdesk.git
cd fixdesk

# Install dependencies
pnpm install

# Set up the database
npx prisma generate
npx prisma db push

# Start the development server
pnpm dev
```

### Desktop App

```bash
# Build the Electron app
pnpm electron:build
```

## Project Structure

```
fixdesk/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/          # API routes
│   │   └── page.tsx      # Main application
│   ├── components/       # React components
│   └── lib/              # Utilities and database
├── prisma/               # Database schema
├── electron/             # Electron main process
└── public/               # Static assets
```

## License

This software is proprietary and confidential. See [LICENSE](LICENSE) for details.

## Support

For issues and questions, please open an issue on GitHub.
