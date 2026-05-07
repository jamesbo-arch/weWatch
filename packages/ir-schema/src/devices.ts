/**
 * Garmin device capability matrix.
 * Mirror of `agents/garmin-sdk-agent/DEVICE_MATRIX.md`.
 *
 * Used by validators.ts to decide whether an IR can target a given device.
 *
 * IMPORTANT: this catalog must be kept in sync with the spec doc.
 * Numeric values (memKb, minSdk) are baseline estimates — calibrate after Phase 0.
 */

import type { ComplicationDataType } from './types.js';

export type DeviceShape = 'round' | 'square' | 'rectangle';
export type DisplayKind = 'mip' | 'amoled' | 'hybrid';
export type AodStrategy = 'static' | 'minimal_seconds' | 'full';

export interface DeviceSpec {
  /** Stable internal id. */
  id: string;
  /** Human-readable Garmin product name. */
  name: string;
  shape: DeviceShape;
  /** [width, height] in pixels. */
  resolution: [number, number];
  display: DisplayKind;
  /** Available memory for a watch face binary + runtime, in KB. */
  memKb: number;
  aodSupported: boolean;
  /** Maximum AOD strategy this device can sustain. */
  aodStrategyMax: AodStrategy;
  /** Sensors / data sources available on this device. */
  sensors: {
    heartRate: boolean;
    gps: boolean;
    weather: boolean;
    barometer: boolean;
    bodyBattery: boolean;
    stress: boolean;
  };
  /** Minimum Connect IQ SDK API level. */
  minSdk: string;
  /** Whether the device can render CJK glyphs adequately. */
  cjkSupport: boolean;
  /** Free-form notes (positioning, quirks). */
  notes?: string;
}

const fullSensors = {
  heartRate: true,
  gps: true,
  weather: true,
  barometer: true,
  bodyBattery: true,
  stress: true,
};

const noBaroNoBodyBattery = { ...fullSensors, barometer: false, bodyBattery: false, stress: false };

export const DEVICES: readonly DeviceSpec[] = [
  // ── Forerunner line ──
  {
    id: 'fr55', name: 'Forerunner 55', shape: 'round', resolution: [208, 208],
    display: 'mip', memKb: 32, aodSupported: false, aodStrategyMax: 'static',
    sensors: { ...fullSensors, barometer: false }, minSdk: '3.2', cjkSupport: false,
    notes: 'Entry runner watch',
  },
  {
    id: 'fr165', name: 'Forerunner 165', shape: 'round', resolution: [390, 390],
    display: 'amoled', memKb: 96, aodSupported: true, aodStrategyMax: 'minimal_seconds',
    sensors: { ...fullSensors, barometer: false }, minSdk: '5.0', cjkSupport: true,
    notes: 'Best price/perf AMOLED runner',
  },
  {
    id: 'fr255', name: 'Forerunner 255', shape: 'round', resolution: [260, 260],
    display: 'mip', memKb: 64, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: false,
    notes: 'Mainstream runner',
  },
  {
    id: 'fr265', name: 'Forerunner 265', shape: 'round', resolution: [416, 416],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'minimal_seconds',
    sensors: fullSensors, minSdk: '5.0', cjkSupport: true,
  },
  {
    id: 'fr955', name: 'Forerunner 955', shape: 'round', resolution: [260, 260],
    display: 'mip', memKb: 96, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: false,
  },
  {
    id: 'fr965', name: 'Forerunner 965', shape: 'round', resolution: [454, 454],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'minimal_seconds',
    sensors: fullSensors, minSdk: '5.0', cjkSupport: true,
  },

  // ── fenix line ──
  {
    id: 'fenix7', name: 'fenix 7', shape: 'round', resolution: [260, 260],
    display: 'mip', memKb: 96, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: false,
  },
  {
    id: 'fenix7s', name: 'fenix 7S', shape: 'round', resolution: [240, 240],
    display: 'mip', memKb: 96, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: false,
  },
  {
    id: 'fenix7x', name: 'fenix 7X', shape: 'round', resolution: [280, 280],
    display: 'mip', memKb: 96, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: false,
  },
  {
    id: 'fenix7pro', name: 'fenix 7 Pro', shape: 'round', resolution: [260, 260],
    display: 'mip', memKb: 128, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.2', cjkSupport: false,
  },
  {
    id: 'fenix7pro_amoled', name: 'fenix 7 Pro AMOLED', shape: 'round', resolution: [416, 416],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'full',
    sensors: fullSensors, minSdk: '5.0', cjkSupport: true,
  },

  // ── epix ──
  {
    id: 'epix2', name: 'epix (Gen 2)', shape: 'round', resolution: [416, 416],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'minimal_seconds',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: true,
  },
  {
    id: 'epix2pro_42', name: 'epix Pro Gen2 42mm', shape: 'round', resolution: [390, 390],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'full',
    sensors: fullSensors, minSdk: '4.2', cjkSupport: true,
  },
  {
    id: 'epix2pro_47', name: 'epix Pro Gen2 47mm', shape: 'round', resolution: [416, 416],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'full',
    sensors: fullSensors, minSdk: '4.2', cjkSupport: true,
  },
  {
    id: 'epix2pro_51', name: 'epix Pro Gen2 51mm', shape: 'round', resolution: [454, 454],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'full',
    sensors: fullSensors, minSdk: '4.2', cjkSupport: true,
  },

  // ── Venu ──
  {
    id: 'venu2', name: 'Venu 2', shape: 'round', resolution: [416, 416],
    display: 'amoled', memKb: 96, aodSupported: true, aodStrategyMax: 'minimal_seconds',
    sensors: { ...fullSensors, barometer: false }, minSdk: '3.2', cjkSupport: true,
  },
  {
    id: 'venu2s', name: 'Venu 2S', shape: 'round', resolution: [360, 360],
    display: 'amoled', memKb: 96, aodSupported: true, aodStrategyMax: 'minimal_seconds',
    sensors: { ...fullSensors, barometer: false }, minSdk: '3.2', cjkSupport: true,
  },
  {
    id: 'venu3', name: 'Venu 3', shape: 'round', resolution: [454, 454],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'full',
    sensors: { ...fullSensors, barometer: false }, minSdk: '5.0', cjkSupport: true,
  },
  {
    id: 'venu3s', name: 'Venu 3S', shape: 'round', resolution: [390, 390],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'full',
    sensors: { ...fullSensors, barometer: false }, minSdk: '5.0', cjkSupport: true,
  },
  {
    id: 'vivoactive5', name: 'Vivoactive 5', shape: 'round', resolution: [390, 390],
    display: 'amoled', memKb: 96, aodSupported: true, aodStrategyMax: 'minimal_seconds',
    sensors: { ...fullSensors, barometer: false }, minSdk: '5.0', cjkSupport: true,
  },

  // ── Instinct (rugged outdoor) ──
  {
    id: 'instinct2', name: 'Instinct 2', shape: 'round', resolution: [176, 176],
    display: 'mip', memKb: 32, aodSupported: false, aodStrategyMax: 'static',
    sensors: noBaroNoBodyBattery, minSdk: '3.2', cjkSupport: false,
    notes: 'Outdoor tough; small monochrome MIP',
  },
  {
    id: 'instinct2x', name: 'Instinct 2X', shape: 'round', resolution: [176, 176],
    display: 'mip', memKb: 32, aodSupported: false, aodStrategyMax: 'static',
    sensors: { ...noBaroNoBodyBattery, barometer: true }, minSdk: '3.2', cjkSupport: false,
  },

  // ── MARQ / tactix / Descent / Enduro ──
  {
    id: 'marq2', name: 'MARQ Gen2', shape: 'round', resolution: [416, 416],
    display: 'amoled', memKb: 128, aodSupported: true, aodStrategyMax: 'full',
    sensors: fullSensors, minSdk: '4.2', cjkSupport: true,
  },
  {
    id: 'tactix7', name: 'tactix 7', shape: 'round', resolution: [260, 260],
    display: 'mip', memKb: 96, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: false,
  },
  {
    id: 'descentmk2', name: 'Descent Mk2', shape: 'round', resolution: [280, 280],
    display: 'mip', memKb: 96, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: false,
  },
  {
    id: 'enduro2', name: 'Enduro 2', shape: 'round', resolution: [280, 280],
    display: 'mip', memKb: 96, aodSupported: false, aodStrategyMax: 'static',
    sensors: fullSensors, minSdk: '4.1', cjkSupport: false,
  },

  // ── Hybrid / niche ──
  {
    id: 'vivomove_trend', name: 'Vivomove Trend', shape: 'round', resolution: [390, 390],
    display: 'hybrid', memKb: 32, aodSupported: false, aodStrategyMax: 'static',
    sensors: { ...noBaroNoBodyBattery, gps: false, weather: true }, minSdk: '3.2', cjkSupport: true,
    notes: 'Hybrid analog+digital',
  },
  {
    id: 'swim2', name: 'Swim 2', shape: 'round', resolution: [208, 208],
    display: 'mip', memKb: 32, aodSupported: false, aodStrategyMax: 'static',
    sensors: { ...noBaroNoBodyBattery, weather: false }, minSdk: '3.2', cjkSupport: false,
  },
] as const;

const DEVICE_INDEX = new Map(DEVICES.map((d) => [d.id, d]));

export function getDevice(id: string): DeviceSpec | undefined {
  return DEVICE_INDEX.get(id);
}

export function listDeviceIds(): string[] {
  return DEVICES.map((d) => d.id);
}

/** Whether a device supports a given complication data type. */
export function deviceSupportsComplication(
  device: DeviceSpec,
  dataType: ComplicationDataType,
): boolean {
  switch (dataType) {
    case 'heart_rate':
    case 'stress':
      return device.sensors.heartRate;
    case 'body_battery':
      return device.sensors.bodyBattery;
    case 'weather_temp':
    case 'weather_condition':
      return device.sensors.weather;
    case 'steps':
    case 'calories':
    case 'active_minutes':
    case 'distance':
    case 'battery':
    case 'moonphase':
    case 'next_calendar':
      return true;
    default: {
      // exhaustive
      const _never: never = dataType;
      return false;
    }
  }
}
