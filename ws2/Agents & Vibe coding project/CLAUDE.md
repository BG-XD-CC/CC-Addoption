@AGENTS.md

# Employee Experience Platform

## Tech Stack

- **Framework**: Next.js 16.2.2 (App Router, Turbopack)
- **Language**: TypeScript 5 (strict mode)
- **React**: 19.2.4
- **Styling**: Tailwind CSS v4, `clsx`, `tailwind-merge`, `class-variance-authority`
- **UI Components**: shadcn/ui, `@base-ui/react`, `lucide-react` icons
- **Theming**: `next-themes` (light/dark with system detection)
- **Database**: SQLite via Prisma ORM (v6.19.3)
- **Charts**: Recharts (v3.8.1)
- **Animations**: Framer Motion (v12.38.0), `canvas-confetti`
- **Tables**: `@tanstack/react-table` (sorting, filtering, pagination, CSV export)
- **Linting**: ESLint v9 with `eslint-config-next`

## Project Structure

```
app/                  → Pages and API routes (App Router)
  employees/          → Employee list, detail views, loading states
  api/employees/      → CSV export endpoint
components/           → UI, layout, dashboard, employee components
lib/                  → Utilities, Prisma client, server actions
types/                → TypeScript interfaces
prisma/               → Schema and seed scripts
```

## Key Patterns

- Server actions with `"use server"` for data mutations
- `revalidatePath()` for cache invalidation
- Path alias `@/*` maps to project root
- Prisma client singleton in `lib/prisma.ts`

## Commands

```bash
npm run dev           # Dev server (Turbopack)
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npx prisma db seed    # Seed database
```

## Agent Workflow

After `code-reviewer` produces a report, dispatch these three agents **in parallel** with the report as input:

1. **code-fixer** — implements the fixes from the report
2. **test-writer** — writes regression tests for each bug found
3. **docs-writer** — updates docstrings and comments to reflect fixed behavior

All three agents are independent and can run concurrently.
