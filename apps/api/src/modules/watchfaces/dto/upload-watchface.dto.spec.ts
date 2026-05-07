import { describe, expect, it } from 'vitest';
import { UploadWatchfaceSchema } from './upload-watchface.dto.js';

describe('UploadWatchfaceSchema', () => {
  const valid = {
    title: 'Sunset Face',
    description: 'A beautiful sunset themed face',
    price: '199',
    deviceTargets: '["fenix7","fenix7s"]',
  };

  it('accepts valid input', () => {
    const r = UploadWatchfaceSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.price).toBe(199);
      expect(r.data.deviceTargets).toEqual(['fenix7', 'fenix7s']);
    }
  });

  it('coerces price string to number', () => {
    const r = UploadWatchfaceSchema.safeParse({ ...valid, price: '500' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.price).toBe(500);
  });

  it('defaults price to 0 when omitted', () => {
    const { price: _, ...rest } = valid;
    const r = UploadWatchfaceSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.price).toBe(0);
  });

  it('rejects negative price', () => {
    const r = UploadWatchfaceSchema.safeParse({ ...valid, price: '-1' });
    expect(r.success).toBe(false);
  });

  it('rejects empty title', () => {
    const r = UploadWatchfaceSchema.safeParse({ ...valid, title: '' });
    expect(r.success).toBe(false);
  });

  it('rejects title longer than 100 chars', () => {
    const r = UploadWatchfaceSchema.safeParse({ ...valid, title: 'x'.repeat(101) });
    expect(r.success).toBe(false);
  });

  it('rejects description longer than 500 chars', () => {
    const r = UploadWatchfaceSchema.safeParse({ ...valid, description: 'x'.repeat(501) });
    expect(r.success).toBe(false);
  });

  it('parses deviceTargets from comma-separated string', () => {
    const r = UploadWatchfaceSchema.safeParse({ ...valid, deviceTargets: 'fenix7, fenix7s' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.deviceTargets).toEqual(['fenix7', 'fenix7s']);
  });

  it('defaults deviceTargets to empty array when omitted', () => {
    const { deviceTargets: _, ...rest } = valid;
    const r = UploadWatchfaceSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.deviceTargets).toEqual([]);
  });
});
