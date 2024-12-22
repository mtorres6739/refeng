# Referral Engine

A modern, scalable referral management system built with Next.js 15.

## Features

- Client referral submission system
- Admin dashboard for referral management
- Client dashboard for content sharing and tracking
- Incentive program management
- Social media integration
- Gamification system
- Drawing/contest management
- Multi-tenant ready architecture

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma (Database ORM)
- PostgreSQL
- NextAuth.js (Authentication)
- tRPC (Type-safe API)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/                 # App router pages
├── components/          # Reusable components
├── lib/                 # Utility functions and shared logic
├── server/             # Server-side code
│   ├── api/            # API routes
│   ├── db/             # Database schemas and migrations
│   └── services/       # Business logic
├── types/              # TypeScript types
└── utils/              # Helper functions
```

## Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```
