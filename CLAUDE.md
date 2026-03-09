# CLAUDE.md — Nervia Codebase Guide

This file provides guidance for AI assistants working in this repository.

---

## Project Overview

**Nervia** (v1.2.1) is a full-stack web application that lets users build a personal "Visual Intelligence Universe" — a 3D/2D knowledge graph where web pages and notes are saved as "Neurons," organized into groups, and visualized as a force-directed network. Optional AI features (Google Gemini) power semantic search, chat, and auto-categorization.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | TailwindCSS 4, Framer Motion |
| Database / Auth | Supabase (PostgreSQL + Row-Level Security) |
| AI | Google Generative AI (Gemini) |
| Graph Rendering | react-force-graph-2d, react-force-graph-3d, D3, Three.js |
| Payments | Lemon Squeezy |
| Email | Resend |
| Analytics | Vercel Analytics |
| API Docs | next-swagger-doc + Swagger UI |
| Browser Extension | Chrome Manifest v3 |

---

## Repository Structure

```
nervia/
├── app/                        # Next.js App Router (main application)
│   ├── api/                    # API route handlers
│   │   ├── ai/                 # AI endpoints (chat, search, process)
│   │   ├── extension/          # Chrome extension endpoints
│   │   ├── billing/            # Lemon Squeezy billing portal
│   │   ├── share/[slug]/       # Shared universe endpoints
│   │   ├── user/delete/        # Account deletion
│   │   ├── feedback/           # Mission feedback submission
│   │   ├── notifications/      # Notification tracking
│   │   └── webhooks/           # External service webhooks
│   ├── page.tsx                # Main dashboard (graph visualization home)
│   ├── layout.tsx              # Root layout (theme, analytics)
│   ├── login/                  # Login page
│   ├── demo/                   # Public demo universe
│   ├── share/[slug]/           # Public shared universe view
│   ├── settings/billing/       # Billing settings
│   ├── extension/              # Extension info page
│   ├── api-docs/               # Swagger UI page
│   ├── docs/                   # Documentation pages
│   ├── changelog/              # Changelog
│   └── roadmap/                # Product roadmap
├── src/
│   ├── components/             # Shared React components
│   │   ├── GraphNetwork.tsx    # Graph visualization orchestrator
│   │   ├── GraphNetwork2D.tsx  # 2D force-graph view
│   │   ├── GraphNetwork3D.tsx  # 3D force-graph view (Three.js)
│   │   ├── NeuralChat.tsx      # AI chat interface
│   │   ├── NeuralSearch.tsx    # Semantic search UI
│   │   ├── Sidebar.tsx         # Right sidebar
│   │   ├── LeftSidebar.tsx     # Controls sidebar
│   │   ├── CommandPalette.tsx  # ⌘K command/search palette
│   │   ├── AddModal.tsx        # Add new neuron modal
│   │   ├── CreateGroupModal.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── ShareModal.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── UpgradeModal.tsx
│   │   ├── ImportExport.tsx    # Bookmark import/export
│   │   ├── OnboardingTour.tsx  # react-joyride guided tour
│   │   ├── ThemeProvider.tsx   # Dark/light theme context
│   │   └── ui/                 # Primitive UI components
│   ├── hooks/                  # Custom React hooks
│   │   ├── useGraphData.ts     # Node/link data from Supabase
│   │   ├── useGraphUI.ts       # Graph UI state
│   │   ├── useAIProcessor.ts   # AI processing logic
│   │   ├── useGroups.ts        # Group management
│   │   ├── usePlan.ts          # Subscription plan tier
│   │   ├── useFeatureAccess.ts # Feature gating by plan
│   │   ├── useOnboarding.ts    # Onboarding state
│   │   ├── useNotifications.ts # Notification system
│   │   ├── useSharing.ts       # Universe sharing
│   │   └── useUniverseStats.ts # Statistics calculations
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser Supabase client
│   │   │   ├── server.ts       # Server-side Supabase client
│   │   │   └── admin.ts        # Service-role admin client
│   │   ├── bookmarkParser.ts   # HTML bookmark file import
│   │   ├── mockDemoData.ts     # Demo universe sample data
│   │   ├── notificationSound.ts
│   │   └── share-metadata.ts
│   └── utils/
│       └── graphAlgorithms.ts  # BFS pathfinding, graph utilities
├── nervia-landing/             # Separate Next.js landing page app
│   └── app/                    # Landing pages (about, pricing, FAQ, etc.)
├── chrome-extension/           # Chrome Web Clipper (Manifest v3)
│   ├── manifest.json
│   ├── content.js
│   └── popup.js
├── supabase/
│   └── migrations/             # SQL migration files
├── proxy.ts                    # Next.js middleware (auth/routing)
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── swagger.config.json
```

---

## Development Workflows

### Running the App

```bash
# Install dependencies
npm install

# Run main app in development
npm run dev

# Build (also generates Swagger spec)
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### Running the Landing Page

```bash
cd nervia-landing
npm install
npm run dev
```

### Environment Variables

Create a `.env.local` file in the root with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
GEMINI_API_KEY=
RESEND_API_KEY=
WEBHOOK_SECRET=
LEMON_SQUEEZY_WEBHOOK_SECRET=
NEXT_PUBLIC_EXTENSION_ID=
```

### Database Migrations

Migration files live in `supabase/migrations/`. Apply them in order via the Supabase CLI or dashboard. Current migrations:

1. `20250227000000_add_groups_table.sql` — user group/cluster categories
2. `20250227100000_add_profiles_onboarding.sql` — user profile + onboarding state
3. `20250227200000_add_notifications_table.sql` — notification storage with realtime

---

## Key Conventions

### TypeScript

- **Strict mode** is enabled (`tsconfig.json`). Avoid using `any` or unnecessary `!` non-null assertions.
- Path alias `@/*` maps to the repository root. Use it for all cross-directory imports (e.g., `import { ... } from '@/src/lib/supabase/client'`).
- Manual type declarations for D3 force 3D are in `d3-force-3d.d.ts` and `global.d.ts`.

### File Organization

- Place new **React components** in `src/components/`. Complex feature components (anything beyond a simple UI primitive) go directly in `src/components/`. Primitive UI pieces go in `src/components/ui/`.
- Place new **custom hooks** in `src/hooks/`. Hooks should encapsulate a single domain (data fetching, UI state, a specific feature).
- Place new **utility functions** in `src/utils/`.
- Place new **API routes** under `app/api/` following Next.js App Router conventions (`route.ts`).
- **Do not** put business logic directly inside `app/page.tsx` — delegate to hooks and components.

### Supabase

- **Always use Row-Level Security (RLS).** Every new table must have RLS policies that restrict access to the owning user via `auth.uid()`.
- Use `src/lib/supabase/client.ts` for browser-side queries, `src/lib/supabase/server.ts` for server components and API routes, and `src/lib/supabase/admin.ts` only for privileged operations that bypass RLS (webhooks, admin tasks).
- Migration files must be named with a timestamp prefix (`YYYYMMDDHHMMSS_description.sql`) and must be idempotent where possible.

### API Routes

- All API routes are in `app/api/` as `route.ts` files.
- Authenticate server-side using the Supabase server client and validate the session before acting on data.
- The Chrome extension can call `POST /api/extension/save`, `POST /api/extension/token`, and `GET /api/extension/download`. These routes allow the extension CORS origin: `chrome-extension://nfegmgojbdgmkphphhnkjonomeeffhkj`.
- Webhook routes (`/api/webhooks/*`) validate incoming signatures (HMAC for Lemon Squeezy, `x-webhook-secret` header for Supabase).
- Add JSDoc comments to route handlers to auto-generate Swagger documentation (see `swagger.config.json`).

### Authentication & Routing

- `proxy.ts` is the Next.js middleware. Public routes are: `/demo`, `/login`, `/auth/*`, `/share/*`, and the extension/webhook API paths.
- All other routes require an authenticated Supabase session; unauthenticated users are redirected to `/login`.
- When adding a new public route, update the public route list in `proxy.ts`.

### Subscription Plans & Feature Gating

- Three tiers: **Genesis** (free), **Constellation** (mid), **Singularity** (premium).
- Use the `usePlan` hook to get the current user plan and `useFeatureAccess` to check whether a specific feature is available.
- Never hardcode plan logic outside of these two hooks.

### Styling

- Use **TailwindCSS 4** utility classes. Avoid inline `style` props unless absolutely necessary (e.g., dynamic values for D3 graph positioning).
- Dark/light mode is managed by `ThemeProvider` using `next-themes`. Always use theme-aware Tailwind classes (`dark:` prefix) rather than hardcoded colors.
- Animations are done with **Framer Motion**. Use sparingly for transitions and interactive feedback.

### AI Integration

- All Gemini calls go through the API routes in `app/api/ai/` — never call the Gemini SDK from client components directly (API key must stay server-side).
- The `useAIProcessor` hook coordinates AI processing state and communicates with the AI routes.
- Handle rate limiting gracefully with exponential backoff (pattern already used in `useAIProcessor.ts`).

---

## Database Schema Summary

| Table | Purpose |
|---|---|
| `auth.users` | Supabase built-in authentication users |
| `nodes` | Knowledge base items ("Neurons") |
| `links` | Connections between nodes |
| `groups` | User-defined category/cluster labels |
| `profiles` | Per-user profile and onboarding state |
| `notifications` | User notification records (realtime enabled) |

---

## Chrome Extension

The extension lives in `chrome-extension/` and is Manifest v3. It authenticates by fetching a token from `/api/extension/token` and saves pages via `POST /api/extension/save`. The extension ID is configured via `NEXT_PUBLIC_EXTENSION_ID`.

---

## Known Gaps

- **No automated tests.** The project has no test framework configured. When adding new features, consider adding tests (recommend Vitest + React Testing Library for unit/integration, Playwright for E2E).
- **No CI/CD pipeline.** No `.github/workflows/` configuration exists. Deployments are likely manual to Vercel.
- **Large page component.** `app/page.tsx` is ~45 KB. Avoid adding more logic there; extract into hooks and components instead.

---

## Monorepo Notes

The root `package.json` defines two workspaces:
- `app` — the main Nervia application
- `nervia-landing` — the marketing landing page

Run `npm install` from the root to install both. Run workspace-specific commands with `npm -w nervia-landing run dev`.
