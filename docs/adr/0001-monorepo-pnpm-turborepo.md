---
type: adr
adr_id: adr-0001
title: Monorepo with pnpm + Turborepo
status: accepted
date: 2026-04-26
deciders: [founder]
supersedes: null
superseded_by: null
---

# ADR 0001: Monorepo with pnpm + Turborepo

## Context

weWatch will ship multiple deployables (api, web, mobile, several workers)
that share substantial code (IR schema, API types, utilities). We're a
single-founder project (initially) using AI Subagents heavily; tooling
must be:

- Fast to spin up locally
- Friendly to AI agents (consistent file structure, predictable scripts)
- Cheap to run in CI (incremental builds + caching)
- Easy to scale to 5-10 packages without becoming a maintenance burden

## Decision

Single repository (`weWatch`) with the following layout:

```
apps/        long-running deployables
packages/    libraries imported by multiple apps/workers
workers/     queue consumers / batch jobs
agents/      AI agent knowledge bases
docs/        cross-cutting docs
```

Tooling:

- **pnpm** as package manager (workspaces)
- **Turborepo** as task orchestrator (caching, dependency graph, remote cache later)
- **TypeScript** project-references-free (lean on Turbo cache instead)
- **Vitest** for testing
- **ESLint + Prettier** shared at root

## Alternatives Considered

| Option | Pros | Cons | Why not |
|---|---|---|---|
| Polyrepo (one repo per app) | Clean isolation; smaller PRs | Cross-package changes are painful; agents must navigate multiple repos; CI duplication | Too many repos for a 1-person team |
| Yarn Berry workspaces | Strong PnP; built-in Plug'n'Play | PnP breaks too many tools (NestJS, Drizzle); team mind-share lower | Risk > benefit |
| Nx | Heavier; great if many code generators | Steeper learning; overkill for our scale today | Adopt later if needed |
| Lerna | Mature | Largely superseded by Turbo + pnpm | No |
| Bazel | Best correctness | Massive overhead; not JS-first | Way too heavy |

## Consequences

### Positive

- One `pnpm install` sets everything up
- Cross-package refactors (e.g. IR schema changes) land in one PR
- CI uses Turbo cache → 60-80% time savings on incremental builds
- AI agents can navigate a consistent `apps/* | packages/* | workers/*` structure
- Future "extract a service" is straightforward (copy to new repo with worktree)

### Negative

- All code visible to all developers (acceptable for now; revisit if hiring contractors)
- Single CI failure can block all PRs (mitigate: independent jobs per package)
- `node_modules` deduplication means subtle hoisting issues sometimes (mitigate: `pnpm` strict mode)

### Neutral

- Forces discipline around package boundaries (`@wewatch/ir-schema` cannot import from `apps/api`)

## Reversibility

- **Reversal cost**: Medium. Splitting back to polyrepo is mechanical (git filter-repo) but disruptive
- **Trigger to reverse**: If we have > 30 contributors, or any package needs strict access isolation, or build times exceed acceptable thresholds despite caching

## Related

- `agents/backend-agent/ARCHITECTURE.md`
- `package.json` (root), `pnpm-workspace.yaml`, `turbo.json`
