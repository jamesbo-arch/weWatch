# Changelog

All notable changes to `@wewatch/ir-schema` will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), Semver.

## [Unreleased]

## [0.1.0] - 2026-04-26

### Added
- Initial IR schema in Zod (matches `agents/garmin-sdk-agent/IR_SCHEMA.md` v0.1.0)
- Top-level `WatchFaceIRSchema` with `ir_version`, `meta`, `canvas`, `color_scheme`,
  `typography`, `layout`, `data_bindings`, `interactions`, `performance_hints`,
  `escape_hatch`
- Element discriminated union: `time`, `date`, `text`, `image`, `shape`,
  `complication`, `indicator`, `progress_arc`
- Cross-cutting refinements: unique element ids, font_ref resolution,
  AOD coherence
- Devices catalog (`devices.ts`) with 28 Garmin devices
- Business validators (`validators.ts`):
  - `validateForTargets(ir, deviceIds)` → per-device accept/reject report
  - `estimateMemoryUsage(ir, device)` → static memory estimate (KB)
  - `validateProductionReadiness(ir)` → gating check before build
  - `autoFanOutTargets(ir, candidates)` → shape-matched device subset
- Demo (`examples/demo.ts`) and smoke tests (`schema.test.ts`)
- JSON Schema emitter (`scripts/emit-json-schema.ts`)

### Notes
- Memory budget = 70% of `device.memKb` (calibrate after Phase 0)
- IR version is the gate — only `0.1.x` supported by this validator
- Spec doc remains authoritative for narrative semantics; this package is
  authoritative for structural validation
