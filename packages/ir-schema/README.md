# @wewatch/ir-schema

> Watch Face Intermediate Representation (IR) schema. Source of truth for all watch face descriptions in the weWatch platform.
>
> **Used by**:
> - `apps/api` — validates designer uploads, stores IR in DB, hands IR to build worker
> - `apps/web` — visual editor produces IR; displays previews
> - `agents/garmin-sdk-agent` — translates IR → Monkey C → .prg
> - `agents/ai-pipeline-agent` — generates IR from prompts
> - `apps/mobile` — renders local previews

This package is **single-source-of-truth**. Any change here ripples to all consumers — make changes via PR, run cross-package CI.

---

## Install

```bash
pnpm add @wewatch/ir-schema
```

## Usage

### Validate IR

```ts
import { WatchFaceIRSchema, type WatchFaceIR } from '@wewatch/ir-schema';

const result = WatchFaceIRSchema.safeParse(unknownInput);
if (!result.success) {
  console.error(result.error.issues);
} else {
  const ir: WatchFaceIR = result.data;
  // ...
}
```

### Validate against device targets (extra business rules)

```ts
import { validateForTargets } from '@wewatch/ir-schema/validators';

const report = validateForTargets(ir, ['fr255', 'venu3', 'instinct2']);
// report.passed: string[]
// report.rejected: { device, reason }[]
```

### Look up device capabilities

```ts
import { DEVICES, getDevice } from '@wewatch/ir-schema/devices';

const fr255 = getDevice('fr255');
// { id, name, shape, resolution, display, memKb, aodSupported, ... }
```

## Versioning

- Semver. **0.x** is unstable.
- IR_VERSION constant in code (`'0.1.0'`); IR JSON files carry `ir_version` field.
- **Backward-compatible** changes (additive): minor bump.
- **Breaking** changes: major bump + migration script in `migrations/`.

## Generating JSON Schema (for non-TS consumers)

```bash
pnpm json-schema > schema.json
```

Output is consumed by Garmin SDK Agent's `validate_ir.js` script and any non-Node tooling.

## Spec doc

The narrative spec lives at `agents/garmin-sdk-agent/IR_SCHEMA.md`. Code and spec must be kept in sync — PRs touching one must touch the other.

## Testing

```bash
pnpm test
```

Tests include:
- Round-trip parse of all examples in `examples/`
- Property-based tests on randomly generated IRs
- Cross-validation against `DEVICES` matrix

## Not in scope

- Rendering (frontend canvas)
- Code generation (Garmin SDK Agent)
- Persistence (Backend Agent)
- Asset upload / encoding (Backend Agent)

This package is **only** the schema + validators + devices catalog.
