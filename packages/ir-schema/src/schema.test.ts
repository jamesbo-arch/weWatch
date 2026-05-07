/**
 * Smoke tests for IR Zod schemas. Run with: pnpm test
 */

import { describe, it, expect } from 'vitest';
import { WatchFaceIRSchema, IR_VERSION } from './index.js';
import {
  validateForTargets,
  estimateMemoryUsage,
  validateProductionReadiness,
} from './validators.js';
import { getDevice, listDeviceIds } from './devices.js';

const baseIr = () =>
  ({
    ir_version: '0.1.0',
    meta: {
      id: 'wf_test',
      designer_id: 'ds_test',
      name: { default: 'Test' },
      tags: [],
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
    },
    typography: {
      fonts: [{ id: 'main', family: 'system-numeric-large' }],
    },
    layout: {
      engine: 'anchor',
      elements: [
        {
          id: 'el_time',
          type: 'time',
          anchor: { x: 0.5, y: 0.5, align_x: 'center', align_y: 'middle' },
          size: { mode: 'auto' },
          style: { font_ref: 'main', color_ref: 'primary', opacity: 1, shadow: null },
          visibility: { always: true, aod_visible: true, conditions: [] },
          fallback_strategy: 'drop_device',
          props: { format: 'HH:mm', show_leading_zero: true },
        },
      ],
    },
    data_bindings: [],
    interactions: [],
    performance_hints: { redraw_budget: 'low', aod_strategy: 'minimal_seconds' },
  }) as const;

describe('IR_VERSION constant', () => {
  it('is 0.1.0', () => {
    expect(IR_VERSION).toBe('0.1.0');
  });
});

describe('WatchFaceIRSchema', () => {
  it('parses a minimal valid IR', () => {
    const r = WatchFaceIRSchema.safeParse(baseIr());
    expect(r.success).toBe(true);
  });

  it('rejects unknown ir_version', () => {
    const ir = { ...baseIr(), ir_version: '1.0.0' };
    const r = WatchFaceIRSchema.safeParse(ir);
    expect(r.success).toBe(false);
  });

  it('rejects invalid hex color', () => {
    const ir = baseIr();
    (ir.color_scheme as { primary: string }).primary = 'red';
    const r = WatchFaceIRSchema.safeParse(ir);
    expect(r.success).toBe(false);
  });

  it('rejects duplicate element ids', () => {
    const ir = baseIr() as unknown as { layout: { elements: unknown[] } };
    const dup = JSON.parse(JSON.stringify((ir.layout.elements as object[])[0]));
    ir.layout.elements.push(dup);
    const r = WatchFaceIRSchema.safeParse(ir);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('Duplicate'))).toBe(true);
    }
  });

  it('rejects unknown font_ref', () => {
    const ir = baseIr() as unknown as {
      layout: { elements: { style: { font_ref: string } }[] };
    };
    ir.layout.elements[0]!.style.font_ref = 'nonexistent';
    const r = WatchFaceIRSchema.safeParse(ir);
    expect(r.success).toBe(false);
  });

  it('rejects aod_visible elements when supports_aod=false', () => {
    const ir = baseIr() as unknown as {
      color_scheme: { supports_aod: boolean };
    };
    ir.color_scheme.supports_aod = false;
    const r = WatchFaceIRSchema.safeParse(ir);
    expect(r.success).toBe(false);
  });
});

describe('validateForTargets', () => {
  it('accepts a round IR for round devices', () => {
    const r = validateForTargets(baseIr(), ['fr265', 'venu3']);
    expect(r.accepted).toContain('fr265');
    expect(r.accepted).toContain('venu3');
    expect(r.rejected).toHaveLength(0);
  });

  it('rejects unknown device id', () => {
    const r = validateForTargets(baseIr(), ['no_such_device']);
    expect(r.rejected).toHaveLength(1);
    expect(r.rejected[0]!.reasons[0]).toContain('Unknown device');
  });

  it('rejects MIP devices when IR uses minimal_seconds AOD', () => {
    // FR255 is MIP, AOD strategy max = static
    const r = validateForTargets(baseIr(), ['fr255']);
    expect(r.rejected.length).toBeGreaterThan(0);
  });
});

describe('estimateMemoryUsage', () => {
  it('returns a positive number', () => {
    const dev = getDevice('venu3')!;
    const kb = estimateMemoryUsage(baseIr(), dev);
    expect(kb).toBeGreaterThan(0);
  });

  it('image background dominates memory', () => {
    const dev = getDevice('venu3')!;
    const baseKb = estimateMemoryUsage(baseIr(), dev);

    const irWithImage = baseIr() as unknown as {
      canvas: { background: unknown };
    };
    irWithImage.canvas.background = {
      type: 'image',
      image: { asset_id: 'bg_test', fit: 'cover', tint: null },
    };
    const imgKb = estimateMemoryUsage(irWithImage as never, dev);
    expect(imgKb).toBeGreaterThan(baseKb);
  });
});

describe('validateProductionReadiness', () => {
  it('passes when ip_review_status=approved and no escape hatch', () => {
    const r = validateProductionReadiness(baseIr() as never);
    expect(r.ready).toBe(true);
  });

  it('blocks when ip_review_status=pending', () => {
    const ir = baseIr() as unknown as { meta: { ip_review_status: string } };
    ir.meta.ip_review_status = 'pending';
    const r = validateProductionReadiness(ir as never);
    expect(r.ready).toBe(false);
    expect(r.blockers[0]).toContain('ip_review_status');
  });
});

describe('devices catalog', () => {
  it('has at least 25 devices', () => {
    expect(listDeviceIds().length).toBeGreaterThanOrEqual(25);
  });

  it('each device has a unique id', () => {
    const ids = listDeviceIds();
    const set = new Set(ids);
    expect(set.size).toBe(ids.length);
  });

  it('venu3 is AMOLED with full AOD', () => {
    const v = getDevice('venu3')!;
    expect(v.display).toBe('amoled');
    expect(v.aodStrategyMax).toBe('full');
  });
});
