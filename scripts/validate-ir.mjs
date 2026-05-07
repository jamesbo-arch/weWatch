#!/usr/bin/env node
/**
 * CLI wrapper: validate an IR JSON file against @wewatch/ir-schema and target devices.
 *
 * Usage:
 *   node scripts/validate-ir.mjs path/to/ir.json fr255,venu3
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WatchFaceIRSchema } from '@wewatch/ir-schema';
import { validateForTargets, validateProductionReadiness } from '@wewatch/ir-schema/validators';

const [, , irArg, targetsArg] = process.argv;

if (!irArg || !targetsArg) {
  console.error('Usage: validate-ir.mjs <ir.json> <fr255,venu3,...>');
  process.exit(2);
}

const irPath = resolve(process.cwd(), irArg);
const ir = JSON.parse(readFileSync(irPath, 'utf8'));
const targets = targetsArg.split(',').map((s) => s.trim()).filter(Boolean);

const parsed = WatchFaceIRSchema.safeParse(ir);
if (!parsed.success) {
  console.error('IR is structurally invalid:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const prod = validateProductionReadiness(parsed.data);
console.log('Production readiness:', prod.ready ? 'READY' : 'BLOCKED');
for (const b of prod.blockers) console.log('  blocker:', b);

const report = validateForTargets(parsed.data, targets);
console.log(`\nAccepted (${report.accepted.length}): ${report.accepted.join(', ') || '<none>'}`);
console.log(`Rejected (${report.rejected.length}):`);
for (const r of report.rejected) {
  console.log(`  ${r.device}:`);
  for (const reason of r.reasons) console.log(`    - ${reason}`);
}

if (report.accepted.length === 0) {
  console.error('\nNo target accepted. Build cannot proceed.');
  process.exit(1);
}
