/**
 * Business validators that go beyond the structural Zod schema.
 *
 * - validateForTargets: given an IR and a list of device ids, decide which
 *   devices can compile this IR and which must be rejected (and why).
 *
 * - estimateMemoryUsage: rough static estimate to fail fast on out-of-budget IRs.
 *
 * - validateProductionReadiness: gating rules for a build (e.g. ip_review_status).
 *
 * These are pure functions — no IO. Suitable for both Backend (server) and
 * Garmin SDK Agent (build pipeline).
 */

import type {
  WatchFaceIR,
  ComplicationElement,
  ProgressArcElement,
} from './types.js';
import {
  DEVICES,
  getDevice,
  deviceSupportsComplication,
  type DeviceSpec,
} from './devices.js';

// ─────────────────────────────────────────────────────────
//  validateForTargets
// ─────────────────────────────────────────────────────────

export interface DeviceValidationResult {
  device: string;
  status: 'accepted' | 'rejected';
  reasons: string[];
}

export interface TargetsValidationReport {
  accepted: string[];
  rejected: { device: string; reasons: string[] }[];
  details: DeviceValidationResult[];
}

/** Memory budget (in KB): we never let the watch face exceed 70% of device memKb. */
const MEMORY_BUDGET_FRACTION = 0.7;

export function validateForTargets(
  ir: WatchFaceIR,
  targetIds: readonly string[],
): TargetsValidationReport {
  const details: DeviceValidationResult[] = [];

  for (const id of targetIds) {
    const device = getDevice(id);
    if (!device) {
      details.push({
        device: id,
        status: 'rejected',
        reasons: [`Unknown device id "${id}". See DEVICE_MATRIX.`],
      });
      continue;
    }
    const reasons = checkOneDevice(ir, device);
    details.push({
      device: id,
      status: reasons.length === 0 ? 'accepted' : 'rejected',
      reasons,
    });
  }

  return {
    accepted: details.filter((d) => d.status === 'accepted').map((d) => d.device),
    rejected: details
      .filter((d) => d.status === 'rejected')
      .map((d) => ({ device: d.device, reasons: d.reasons })),
    details,
  };
}

function checkOneDevice(ir: WatchFaceIR, device: DeviceSpec): string[] {
  const reasons: string[] = [];

  // 1. shape match
  if (ir.canvas.shape !== device.shape) {
    reasons.push(
      `IR canvas.shape="${ir.canvas.shape}" does not match device shape "${device.shape}".`,
    );
  }

  // 2. AOD coherence
  const wantsAod = ir.layout.elements.some((el) => el.visibility.aod_visible);
  if (wantsAod && !device.aodSupported) {
    reasons.push(
      `IR uses aod_visible elements but device does not support AOD.`,
    );
  }
  if (
    ir.performance_hints.aod_strategy === 'full' &&
    device.aodStrategyMax !== 'full'
  ) {
    reasons.push(
      `IR requests aod_strategy="full" but device max is "${device.aodStrategyMax}". Lower hint or drop device.`,
    );
  }
  if (
    ir.performance_hints.aod_strategy === 'minimal_seconds' &&
    device.aodStrategyMax === 'static'
  ) {
    reasons.push(
      `IR requests aod_strategy="minimal_seconds" but device only supports "static".`,
    );
  }

  // 3. complication sensor support
  for (const el of ir.layout.elements) {
    if (el.type === 'complication') {
      const c = el as ComplicationElement;
      if (!deviceSupportsComplication(device, c.props.data_type)) {
        reasons.push(
          `Element "${el.id}" requires data_type="${c.props.data_type}" not available on this device.`,
        );
      }
    }
    // Body battery / stress used via progress_arc?
    if (el.type === 'progress_arc') {
      const p = el as ProgressArcElement;
      if (
        p.props.data_type === 'battery_progress' ||
        p.props.data_type === 'steps_progress' ||
        p.props.data_type === 'calories_progress' ||
        p.props.data_type === 'active_minutes_progress'
      ) {
        // all baseline, supported on every device
      }
    }
  }

  // 4. CJK support if any localized text uses CJK locales
  const usesCjkLocale =
    ir.layout.elements.some(
      (el) =>
        el.type === 'date' &&
        ['zh-CN', 'ja-JP', 'ko-KR'].includes((el.props as { locale: string }).locale),
    );
  if (usesCjkLocale && !device.cjkSupport) {
    reasons.push(
      `IR includes CJK-locale elements but device lacks CJK font support. Provide fallback or drop device.`,
    );
  }

  // 5. Memory budget
  const estimateKb = estimateMemoryUsage(ir, device);
  const budget = Math.floor(device.memKb * MEMORY_BUDGET_FRACTION);
  if (estimateKb > budget) {
    reasons.push(
      `Estimated memory usage ${estimateKb}KB exceeds budget ${budget}KB (70% of ${device.memKb}KB).`,
    );
  }

  // 6. Min SDK — informational only here; real check happens at compile time.

  return reasons;
}

// ─────────────────────────────────────────────────────────
//  estimateMemoryUsage
// ─────────────────────────────────────────────────────────

/**
 * Very rough static estimate. Use as a "left-shift" filter; the real test is
 * the actual `monkeyc` build report. Numbers calibrated against
 * PERFORMANCE_BUDGET.md baselines and refined after Phase 0 measurements.
 */
export function estimateMemoryUsage(
  ir: WatchFaceIR,
  device: DeviceSpec,
): number {
  let kb = 0;

  // Per-element overhead
  for (const el of ir.layout.elements) {
    switch (el.type) {
      case 'time':
      case 'date':
      case 'text':
      case 'indicator':
        kb += 1.5;
        break;
      case 'shape':
        kb += 0.5;
        break;
      case 'complication':
        kb += 3; // includes runtime cache for sensor read
        break;
      case 'progress_arc':
        kb += 2;
        break;
      case 'image':
        kb += estimateImageKb(device);
        break;
      default: {
        // unknown — be generous
        kb += 5;
      }
    }
  }

  // Background
  switch (ir.canvas.background.type) {
    case 'solid':
      break;
    case 'gradient':
      kb += 2;
      break;
    case 'image':
      kb += estimateImageKb(device);
      break;
    case 'layered':
      kb += 6; // multiple layers — more conservative
      break;
  }

  // Color/font/typography static
  kb += 2;

  // Bytecode baseline
  kb += 12;

  // Data bindings runtime cache
  kb += ir.data_bindings.length * 0.5;

  // Escape hatch snippets — assume each adds runtime cost
  if (ir.escape_hatch?.monkey_c_snippets?.length) {
    kb += ir.escape_hatch.monkey_c_snippets.length * 4;
  }

  return Math.round(kb * 10) / 10;
}

function estimateImageKb(device: DeviceSpec): number {
  // Rough: width × height × bpp / 1024, adjusted for device class
  const [w, h] = device.resolution;
  const bpp = device.display === 'amoled' ? 2 : 1; // assume 16-bit AMOLED, 8-bit MIP
  return Math.round(((w * h * bpp) / 1024) * 1.2 * 10) / 10;
}

// ─────────────────────────────────────────────────────────
//  validateProductionReadiness
// ─────────────────────────────────────────────────────────

export interface ProductionGateResult {
  ready: boolean;
  blockers: string[];
}

/** Strict gate before allowing a build job to enter the pipeline. */
export function validateProductionReadiness(ir: WatchFaceIR): ProductionGateResult {
  const blockers: string[] = [];

  if (ir.meta.ip_review_status !== 'approved') {
    blockers.push(
      `meta.ip_review_status must be "approved" before production build (was "${ir.meta.ip_review_status}").`,
    );
  }

  if (
    ir.escape_hatch?.monkey_c_snippets?.length &&
    ir.escape_hatch.monkey_c_snippets.length > 0
  ) {
    // Note: the *signed designer* check happens at the API layer; we just signal here
    blockers.push(
      `escape_hatch.monkey_c_snippets requires the API layer to verify the designer is "signed" tier and the snippet has passed Security Agent audit.`,
    );
  }

  return { ready: blockers.length === 0, blockers };
}

// ─────────────────────────────────────────────────────────
//  Convenience: pick targets that should be auto-included
// ─────────────────────────────────────────────────────────

/**
 * Returns the subset of a candidate target list whose shape matches the IR.
 * Useful for "auto-fan-out" features in the editor.
 */
export function autoFanOutTargets(
  ir: WatchFaceIR,
  candidateIds: readonly string[] = DEVICES.map((d) => d.id),
): string[] {
  return candidateIds.filter((id) => {
    const d = getDevice(id);
    return d != null && d.shape === ir.canvas.shape;
  });
}
