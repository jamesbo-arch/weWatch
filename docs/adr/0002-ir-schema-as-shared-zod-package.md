---
type: adr
adr_id: adr-0002
title: IR Schema as a shared Zod package
status: accepted
date: 2026-04-26
deciders: [founder]
supersedes: null
---

# ADR 0002: IR Schema as a shared Zod package

## Context

The Watch Face IR is the central contract between Backend (validates incoming
designer/AI uploads), Frontend (visual editor produces IR), Garmin SDK Agent
(translates IR → Monkey C), and AI Pipeline Agent (generates IR from prompts).

Without a single source of truth, drift is guaranteed: Backend would accept
IRs that Garmin SDK can't compile; AI Pipeline would generate IRs that
Frontend can't render; etc.

## Decision

Implement the IR as a **Zod schema** shipped as `@wewatch/ir-schema`. All
four agents consume the same package version. TypeScript types are inferred
from Zod (`z.infer`), not hand-written.

For non-TypeScript consumers (Python tools, Garmin SDK Agent's internal
codegen scripts), we emit JSON Schema via `zod-to-json-schema`
(`pnpm json-schema`).

The narrative spec lives at `agents/garmin-sdk-agent/IR_SCHEMA.md`. PRs
modifying one MUST modify both.

## Alternatives Considered

| Option | Pros | Cons | Why not |
|---|---|---|---|
| OpenAPI as source of truth | Standard, widely supported | Verbose YAML; weaker discriminated union support; runtime validation requires extra layer | Worse DX for IR's nested unions |
| Protobuf / FlatBuffers | Schema evolution rules built-in; fast | Overkill for HTTP/JSON workflow; binary makes debugging harder | Wrong tool |
| TypeBox / Valibot | Similar to Zod | Smaller community / less mature | No clear win over Zod |
| Hand-written interfaces + ad-hoc validators | Simple | Drift guaranteed within 3 months | Not acceptable |

## Consequences

### Positive

- Adding/changing a field is one PR touching one file (Zod schema)
- TS types are always in sync (inference)
- Backend gets free runtime validation
- Garmin SDK Agent has a single canonical reference for all IR semantics
- AI Pipeline can pass `WatchFaceIRSchema` to the LLM API for structured output

### Negative

- All consumers tied to Zod (vendor lock-in to a specific lib)
- LLM-friendly schema requires careful crafting (Zod descriptions, examples)
- JSON Schema export is lossy in edge cases (refinements don't translate fully)

### Neutral

- Versioning lives in two places: package version (npm semver) AND `ir_version` field inside the JSON; both must move together for breaking changes

## Reversibility

- **Reversal cost**: Medium. Migrating away from Zod is mechanical but touches many files
- **Trigger to reverse**: If Zod becomes unmaintained, or if a structural-validation library 10x better appears

## Related

- `packages/ir-schema/`
- `agents/garmin-sdk-agent/IR_SCHEMA.md`
- ADR-0001 (monorepo)
