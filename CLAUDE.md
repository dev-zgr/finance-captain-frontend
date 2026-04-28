# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Finance Captain is a personal finance management frontend built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui. It communicates with a backend REST API and integrates AI features for transaction categorization and VLM (Vision Language Model) image extraction.

## Commands

```bash
npm run dev        # Start dev server with Turbopack
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier (formats all .ts/.tsx)
npm run typecheck  # TypeScript type check without emitting
```

There is no test suite configured in this project.

## Architecture

### Directory Structure

- `app/` — Next.js App Router pages. Each feature has its own subdirectory (e.g., `app/checking-account/`, `app/dashboard/`).
- `components/ui/` — shadcn/ui primitives (Button, Card, Input, etc.)
- `components/layout/` — Shared layout components (Footer, etc.)
- `components/components/` — Feature-specific components, mirroring the `app/` feature structure (e.g., `components/components/checking-account/`)
- `lib/` — Business logic, organized by domain:
  - `lib/store.ts` — Redux store (currently only `auth` reducer)
  - `lib/slices/` — Redux Toolkit slices
  - `lib/auth/` — Auth helpers: `session.ts` (localStorage persistence), `errors.ts`, `use-require-auth.ts` (redirect hook)
  - `lib/checking-account/` — Domain types, API calls, constants, and validation for the checking account feature
  - `lib/constants/api.ts` — Centralized `API_ENDPOINTS` using `NEXT_PUBLIC_API_BASE_URL`

### Authentication Flow

Auth state lives in Redux (`lib/slices/authSlice.ts`). On app load, `app/providers.tsx` hydrates it from `localStorage` via `restoreAuthFromStorage()` (`lib/auth/session.ts`). The `isHydrated` flag prevents redirect flickering — protected pages use `useRequireAuth()` (`lib/auth/use-require-auth.ts`), which waits for hydration before redirecting unauthenticated users to `/login`.

Token is stored in `localStorage` under the key `"auth"` as a `{ content, expiresAt }` envelope.

### API Layer

All API calls use `axios` with `validateStatus: () => true` (so HTTP errors don't throw). Responses are typed as `ApiSuccessResponse<T> | ApiErrorResponse` (defined in `lib/checking-account/types.ts`). The bearer token is passed as `Authorization: Bearer <token>` on every authenticated request.

Base URL is set via `NEXT_PUBLIC_API_BASE_URL` environment variable (configure in `.env.local`).

### Adding a New Feature

1. Create `app/<feature>/page.tsx` for the page route.
2. Add feature components under `components/components/<feature>/`.
3. Add API functions in `lib/<feature>/api.ts`, types in `lib/<feature>/types.ts`, and register new endpoints in `lib/constants/api.ts`.
4. If new Redux state is needed, add a slice in `lib/slices/` and register it in `lib/store.ts`.

### UI Conventions

- Icons: use `@remixicon/react` (Remix Icons), not Lucide, unless the component already uses Lucide.
- Components are added via `npx shadcn@latest add <component>` and placed in `components/ui/`.
- Tailwind CSS v4 is used — no `tailwind.config.js`; configuration is in `app/globals.css`.
