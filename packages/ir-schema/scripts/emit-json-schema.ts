/**
 * Emit JSON Schema for IR (consumed by Garmin SDK Agent's `validate_ir.js`
 * and any non-TypeScript tooling).
 *
 * Run:
 *   pnpm json-schema > packages/ir-schema/dist/ir.schema.json
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import { WatchFaceIRSchema } from '../src/schema.js';

const json = zodToJsonSchema(WatchFaceIRSchema, {
  name: 'WatchFaceIR',
  $refStrategy: 'root',
});

process.stdout.write(JSON.stringify(json, null, 2) + '\n');
