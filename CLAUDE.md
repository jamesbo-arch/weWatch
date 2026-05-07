# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**weWatch** is a Garmin watch face marketplace platform. Users describe or upload watch face designs; an AI pipeline generates an Intermediate Representation (IR); a build worker compiles it to Garmin's Monkey C via the Garmin SDK; and the compiled `.prg` file is distributed through the marketplace.

## Monorepo Structure

pnpm + Turbo monorepo. Workspace roots: `apps/`, `packages/`, `workers/`, `agents/`, `tools/`.

- **`apps/api`** — NestJS REST API (PostgreSQL + Drizzle ORM)
- **`apps/web`** — Next.js frontend (consumer marketplace + designer + admin)
- **`packages/ir-schema`** — **Central contract package** (Zod schemas + TypeScript types for Watch Face IR)
- **`packages/api-types`** — Auto-generated OpenAPI → TypeScript types
- **`packages/shared-utils`** — Common utilities
- **`workers/build-worker`** — Polls jobs, spawns Garmin SDK Docker container, uploads `.prg` files
- **`workers/ai-pipeline`** — LLM prompt → IR generation → build-worker handoff
- **`agents/`** — AI subagent knowledge bases (garmin-sdk, backend, pm, ai-pipeline)

## Core Commands

```bash
pnpm bootstrap          # First-time setup: install + build + db migrate + seed
pnpm dev                # Start all apps + workers (Turbo, concurrency=12)
pnpm build              # Build all packages
pnpm test               # Run all unit tests (Vitest)
pnpm test:watch         # Watch mode
pnpm lint               # ESLint full scan
pnpm lint:fix           # ESLint auto-fix
pnpm typecheck          # tsc full check
pnpm format             # Prettier (TS/JS/JSON/MD/YAML)

# Target a single package
pnpm --filter @wewatch/ir-schema test
pnpm --filter @wewatch/ir-schema build

# Database (from apps/api)
pnpm --filter @wewatch/api db:migrate
pnpm --filter @wewatch/api db:seed

# Emit JSON Schema from IR (for non-TS consumers)
pnpm --filter @wewatch/ir-schema json-schema
```

## Local Dev Services (Docker Compose)

```bash
docker compose up -d                        # PostgreSQL 16, Redis 7, Meilisearch 1.10
docker compose --profile garmin build       # Build Garmin SDK image (optional, heavy)
```

Services are pre-configured with health checks and persistent volumes.

## `@wewatch/ir-schema` — The Central Contract

**Every package depends on this.** Before working on any app/worker, read `packages/ir-schema/src/schema.ts` and `packages/ir-schema/src/devices.ts`.

- `schema.ts` — Zod schemas for the Watch Face Intermediate Representation
- `types.ts` — TypeScript types inferred from Zod schemas
- `devices.ts` — Device capability matrix (30+ Garmin models)
- `validators.ts` — Device-specific validation rules
- `IR_VERSION` constant is exported from `index.ts`

Any change to IR must be reviewed for ripple effects across: web editor, API, build-worker, ai-pipeline, and the garmin-sdk-agent knowledge base.

## Import Conventions

ESLint bans deep relative imports (`../../*`). Always use workspace aliases:

```typescript
import { ... } from '@wewatch/ir-schema';
import { ... } from '@wewatch/api-types';
import { ... } from '@wewatch/shared-utils';
```

Aliases are defined in `tsconfig.base.json` and resolve to each package's `src/index.ts`.

## TypeScript Configuration

Base config (`tsconfig.base.json`): `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `target: ES2022`, `moduleResolution: Bundler`.

- `apps/api` extends base + adds `experimentalDecorators: true` (NestJS decorators)
- `apps/web` extends base + adds `jsx: "preserve"` (Next.js)

## ESLint (Flat Config)

ESLint 9 flat config in `eslint.config.js`. No `.eslintrc.json`. `@typescript-eslint/no-explicit-any` is an error. `no-console` is a warning (`.warn` and `.error` are allowed).

## AI Agents

The `agents/` directory contains knowledge bases for AI subagents, not human documentation. Each agent has a `SYSTEM_PROMPT.md`, domain-specific guides, and code/doc templates. Agent files must include `version: x.y.z` and `last_updated: YYYY-MM-DD` frontmatter; changes require PR review.

- **`garmin-sdk-agent`** — IR → Monkey C code generation, Garmin SDK compile/publish, device-specific performance budgets
- **`backend-agent`** — NestJS module design, Drizzle schema conventions, security rules
- **`ai-pipeline-agent`** — Prompt → IR pipeline, LLM model selection, image generation rules
- **`pm-agent`** — Product strategy, PRD templates, prioritization framework

## Garmin SDK

The Garmin SDK runs inside Docker (`infra/docker/Dockerfile.garmin-sdk`). The build-worker spawns it via `docker run`. The `connectiq-sdk-manager-windows/` directory contains the extracted SDK manager (Windows). Do not run SDK compilation outside Docker.

## Environment Variables

Required env vars (see `turbo.json` for the full list):
- `DATABASE_URL`, `REDIS_URL` — local services from Docker Compose
- `ANTHROPIC_API_KEY` — AI pipeline
- `REPLICATE_API_TOKEN` or `OPENAI_API_KEY` — image generation
- `GARMIN_DEVELOPER_KEY_PATH` — for signing compiled watch faces
- `STRIPE_*` — marketplace payments
- `R2_*` — Cloudflare R2 (compiled `.prg` storage)

No `.env.example` exists yet; create one when bootstrapping a fresh environment.

## Project Status

Phase 0 (prototype). `@wewatch/ir-schema` and all `agents/` knowledge bases are complete. Apps and workers are skeleton scaffolding — most `package.json` scripts echo `TODO`. Scaffold NestJS (`apps/api`) and Next.js (`apps/web`) before implementing features.
