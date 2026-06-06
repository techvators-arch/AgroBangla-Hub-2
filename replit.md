# AgroBangla — এগ্রোবাংলা

A premium digital agriculture platform for Bangladesh farmers with 8 AI-powered modules: crop disease detection, farmer Q&A, fertilizer guides, consultancy booking, crop recommendations, marketplace, Agro Map, and Krishok Card verification.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS v4, Shadcn UI, Framer Motion, Wouter routing
- API: Express 5, esbuild bundle
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → `lib/api-spec/openapi.yaml`)
- Map: Leaflet + react-leaflet (dynamic import in agro-map.tsx)

## Where things live

- **OpenAPI spec**: `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- **DB schema**: `lib/db/src/schema/` — questions, consultants, marketplace, krishok_cards tables
- **API routes**: `artifacts/api-server/src/routes/` — stats, disease, qa, fertilizer, consultancy, crops, marketplace, krishok_card
- **Frontend pages**: `artifacts/agrobangla/src/pages/` — all 8 feature pages
- **Theme**: `artifacts/agrobangla/src/index.css` — green/white color scheme (primary: hsl(142 76% 36%))
- **Generated hooks**: `lib/api-client-react/src/generated/api.ts`
- **Generated Zod schemas**: `lib/api-zod/src/generated/api.ts`

## Architecture decisions

- Contract-first API: OpenAPI spec drives Orval codegen for both React Query hooks and Zod validation schemas
- Disease detection is rule-based (keyword matching from symptoms), not a real ML model
- Crop recommendations are rule-based scoring based on soil/season combinations
- Leaflet map uses dynamic import (`await import("leaflet")`) to avoid SSR/build issues
- API server uses esbuild for fast CJS bundle — must restart workflow to pick up route changes

## Product

- **Agro Map**: Leaflet-based map of Bangladesh's 10 agricultural zones with crop/soil/farmer data
- **Disease Detector**: Symptom-based disease identification for 5 major crops with treatment advice
- **Farmer Q&A**: Community forum where farmers post questions and experts answer
- **Fertilizer Guide**: N/P/K dosage guides per acre for 8 major crops with application schedules
- **Consultancy**: Book sessions with 6 real agricultural experts (with ratings, experience, fees)
- **Crop Recommendation**: AI-style recommendation engine based on soil type, season, district
- **Marketplace**: List/buy agricultural products directly from farmers across Bangladesh
- **Krishok Card**: Apply for farmer identity cards and verify existing cards (test: KSK-2025-123456)

## User preferences

- Bengali language UI (primary), with English transliterations
- Green/white theme, dark mode supported
- No authentication required — all features open to all users

## Gotchas

- API server is not hot-reload — must restart the workflow after adding/changing route files
- Leaflet requires `pnpm --filter @workspace/agrobangla add leaflet react-leaflet @types/leaflet` — already done
- Test Krishok Card: number `KSK-2025-123456`, NID `1990123456789`
- react-leaflet has peer dep warnings with React 19 but works fine at runtime

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
