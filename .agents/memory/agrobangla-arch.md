---
name: AgroBangla architecture
description: Key decisions for the AgroBangla pnpm monorepo — route wiring, codegen, DB schema locations
---

# AgroBangla Architecture

## API Server route wiring
- Adding a new route file requires: (1) write `artifacts/api-server/src/routes/<name>.ts`, (2) import + mount it in `artifacts/api-server/src/routes/index.ts`, (3) **restart the workflow** — esbuild bundles on start, there is no hot-reload.

**Why:** The API dev script is `pnpm run build && pnpm run start` — it compiles once at startup. Forgetting the restart causes 404s even with correct code.

**How to apply:** After any route change, always run `restart_workflow "artifacts/api-server: API Server"`.

## DB schema
- Tables live in `lib/db/src/schema/` (one file per domain), all re-exported from `lib/db/src/schema/index.ts`.
- After schema changes run: `pnpm --filter @workspace/db run push`

## Codegen
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
- Generates React Query hooks → `lib/api-client-react/src/generated/api.ts`
- Generates Zod schemas → `lib/api-zod/src/generated/api.ts`
- Mutations are exported as `export const use<Name>` (arrow function), not `export function use<Name>`.

## Test data
- Verified Krishok Card: `KSK-2025-123456` / NID `1990123456789`
