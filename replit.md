# DataLens — AI-Powered Business Intelligence Dashboard

A full-stack SaaS analytics platform built for data/AI engineers: real-time metrics, KPI tracking, AI-powered chat assistant, and beautiful data visualizations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/insight-ai run dev` — run the frontend (port 23334)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, TailwindCSS v4, Recharts, Framer Motion, Wouter
- Auth: Clerk (`@clerk/react@6`, `@clerk/express`)
- API: Express 5 + Pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)
- AI: OpenAI via Replit AI integrations (streaming SSE)

## Where things live

- `artifacts/insight-ai/` — React frontend (landing, dashboard, metrics, reports, KPIs, AI assistant, settings)
- `artifacts/api-server/` — Express API server with all routes
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/` — Generated React Query hooks + Zod schemas
- `lib/api-zod/` — Generated Zod schemas for server-side validation
- `lib/db/` — Drizzle ORM schema and migrations
- `lib/integrations-openai-ai-server/` — OpenAI AI integration for server
- `lib/integrations-openai-ai-react/` — OpenAI AI integration for client

## Architecture decisions

- **OpenAPI-first**: All API contracts defined in `lib/api-spec/openapi.yaml` before implementation. Frontend hooks and server Zod schemas auto-generated from the spec.
- **Clerk v6**: Using `@clerk/react@6` due to incompatibility in `@clerk/react@5.54.0` with `@clerk/shared`. Added `@clerk/*` to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`.
- **SSE streaming**: AI assistant uses manual `fetch` + `ReadableStream` for streaming (not React Query mutation) since SSE requires streaming response handling.
- **Isolated DB types**: `numeric` Postgres columns stored as `string` in Drizzle, converted to `number` in route handlers before sending to client.
- **Clerk proxy**: API server proxies Clerk JS bundle (`/api/__clerk`) so auth works correctly in the Replit proxied environment.

## Product

- **Landing page**: Public marketing page with scroll animations
- **Dashboard**: Overview KPIs, trend charts, category breakdowns, activity feed
- **Metrics**: Full CRUD — create/view/delete metrics with trend visualization
- **Reports**: Report builder and viewer with category/type tagging
- **KPI Targets**: Progress tracking against goals with status badges (on_track/at_risk/behind/achieved)
- **AI Assistant**: Conversational analytics powered by OpenAI with streaming responses
- **Settings**: User account info via Clerk

## User preferences

- Dark-first, information-dense UI targeting data engineers
- Neon cyan primary accent (`hsl(180 100% 50%)`)
- No emojis anywhere in the UI
- All routes follow OpenAPI-first codegen pattern

## Gotchas

- **Do not run `pnpm dev` at workspace root** — use individual `--filter` commands or restart workflows
- **Always run codegen after changing openapi.yaml**: `pnpm --filter @workspace/api-spec run codegen`
- **After DB schema changes**: run `pnpm --filter @workspace/db run push` then restart the API server workflow
- **Clerk v5 is broken**: `@clerk/react@5.54.0` has incompatible peer deps with all `@clerk/shared` versions. Use v6.
- **`numeric` columns**: Drizzle returns them as strings — always `Number()` convert before sending JSON responses

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- DB schema: `lib/db/src/schema/`
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/api.ts`
