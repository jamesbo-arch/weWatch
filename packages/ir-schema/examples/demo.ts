/**
 * Runnable example: parse an IR, validate against targets, print the report.
 *
 * Run: pnpm tsx packages/ir-schema/examples/demo.ts
 */

import {
  WatchFaceIRSchema,
  type WatchFaceIR,
} from '../src/index.js';
import {
  validateForTargets,
  validateProductionReadiness,
  estimateMemoryUsage,
} from '../src/validators.js';
import { getDevice } from '../src/devices.js';

const demoIr: WatchFaceIR = {
  ir_version: '0.1.0',
  meta: {
    id: 'wf_demo_001',
    designer_id: 'ds_founder',
    name: { default: 'weWatch Hello', 'zh-CN': 'weWatch 你好' },
    description: { default: 'Minimal demo' },
    tags: ['minimal', 'demo'],
    license: 'platform-default',
    ai_generated: false,
    ip_review_status: 'approved',
  },
  canvas: {
    shape: 'round',
    reference_resolution: [390, 390],
    background: { type: 'solid', solid: { color: '#000000' } },
  },
  color_scheme: {
    primary: '#FFFFFF',
    secondary: '#666666',
    accent: '#FF6600',
    danger: '#FF0033',
    background: '#000000',
    supports_aod: true,
    aod_overrides: { primary: '#888888', accent: '#444444' },
  },
  typography: {
    fonts: [
      { id: 'main', family: 'system-numeric-large', fallback: 'system-large' },
      { id: 'small', family: 'system-small' },
    ],
  },
  layout: {
    engine: 'anchor',
    elements: [
      {
        id: 'el_time',
        type: 'time',
        anchor: { x: 0.5, y: 0.5, align_x: 'center', align_y: 'middle' },
        size: { mode: 'auto' },
        style: { color_ref: 'primary', font_ref: 'main', opacity: 1, shadow: null },
        visibility: { always: true, aod_visible: true, conditions: [] },
        fallback_strategy: 'drop_device',
        props: { format: 'HH:mm', show_leading_zero: true },
      },
      {
        id: 'el_date',
        type: 'date',
        anchor: { x: 0.5, y: 0.7, align_x: 'center', align_y: 'middle' },
        size: { mode: 'auto' },
        style: { color_ref: 'secondary', font_ref: 'small', opacity: 1, shadow: null },
        visibility: { always: true, aod_visible: false, conditions: [] },
        fallback_strategy: 'drop_device',
        props: { format: 'ddd, MMM dd', locale: 'auto' },
      },
      {
        id: 'el_hr',
        type: 'complication',
        anchor: { x: 0.5, y: 0.85, align_x: 'center', align_y: 'middle' },
        size: { mode: 'auto' },
        style: { color_ref: 'accent', font_ref: 'small', opacity: 1, shadow: null },
        visibility: { always: true, aod_visible: false, conditions: [] },
        fallback_strategy: 'drop_device',
        props: {
          data_type: 'heart_rate',
          display_style: 'icon_value',
          label: 'BPM',
          unit_system: 'auto',
        },
      },
    ],
  },
  data_bindings: [{ id: 'hr', source: 'Toybox.ActivityMonitor', ttl_sec: 30 }],
  interactions: [],
  performance_hints: { redraw_budget: 'low', aod_strategy: 'minimal_seconds' },
};

// 1. Structural validation
const parsed = WatchFaceIRSchema.safeParse(demoIr);
if (!parsed.success) {
  console.error('IR is structurally invalid:', parsed.error.issues);
  process.exit(1);
}
console.log('Structural validation: OK');

// 2. Production readiness
const prod = validateProductionReadiness(parsed.data);
console.log('Production gate:', prod);

// 3. Targets validation
const targets = ['fr255', 'fr265', 'venu3', 'instinct2', 'fenix7pro_amoled'];
const report = validateForTargets(parsed.data, targets);
console.log('\nTargets report:');
for (const detail of report.details) {
  const dev = getDevice(detail.device);
  const memKb = dev ? estimateMemoryUsage(parsed.data, dev) : 0;
  console.log(
    `  ${detail.device.padEnd(20)} ${detail.status === 'accepted' ? 'OK ' : 'NO'}` +
      `   est. ${memKb}KB` +
      (detail.reasons.length > 0 ? `   reasons: ${detail.reasons.join('; ')}` : ''),
  );
}

console.log('\nAccepted:', report.accepted.join(', '));
console.log('Rejected:', report.rejected.map((r) => r.device).join(', '));
