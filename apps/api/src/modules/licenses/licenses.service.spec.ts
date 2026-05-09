import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DB_TOKEN } from '../../infra/db/database.module.js';
import { LicensesService } from './licenses.service.js';

const DEVICE_SERIAL = 'GARMIN-TEST-001';
const WATCHFACE_ID = '11111111-1111-1111-1111-111111111111';
const HMAC_SECRET = 'test-hmac-secret';
const SAMPLE_RENDER_SPEC = { v: 1, bg: '000000', elements: [] };

function makeChain(result: unknown) {
  const chain = {} as Record<string, unknown>;
  chain['then'] = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  chain['catch'] = (rej: (e: unknown) => unknown) => Promise.resolve(result).catch(rej);
  for (const m of ['from', 'where', 'and', 'eq', 'select', 'limit', 'set', 'values', 'returning', 'update']) {
    chain[m] = vi.fn(() => chain);
  }
  return chain;
}

describe('LicensesService', () => {
  let service: LicensesService;
  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    process.env['LICENSE_HMAC_SECRET'] = HMAC_SECRET;

    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        LicensesService,
        { provide: DB_TOKEN, useValue: mockDb },
      ],
    }).compile();

    service = module.get(LicensesService);
  });

  // ── computeLicenseKey ─────────────────────────────────────────────────────────

  describe('computeLicenseKey', () => {
    it('returns a hex string', () => {
      const key = service.computeLicenseKey(DEVICE_SERIAL, WATCHFACE_ID);
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic — same inputs always produce same output', () => {
      const k1 = service.computeLicenseKey(DEVICE_SERIAL, WATCHFACE_ID);
      const k2 = service.computeLicenseKey(DEVICE_SERIAL, WATCHFACE_ID);
      expect(k1).toBe(k2);
    });

    it('changes when deviceSerial changes', () => {
      const k1 = service.computeLicenseKey('DEVICE-A', WATCHFACE_ID);
      const k2 = service.computeLicenseKey('DEVICE-B', WATCHFACE_ID);
      expect(k1).not.toBe(k2);
    });

    it('changes when watchfaceId changes', () => {
      const k1 = service.computeLicenseKey(DEVICE_SERIAL, '11111111-1111-1111-1111-111111111111');
      const k2 = service.computeLicenseKey(DEVICE_SERIAL, '22222222-2222-2222-2222-222222222222');
      expect(k1).not.toBe(k2);
    });
  });

  // ── activate ─────────────────────────────────────────────────────────────────

  describe('activate', () => {
    it('creates a new license and returns licenseKey on first activation', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([]));
      mockDb.insert.mockReturnValueOnce(makeChain([{ id: 'new-uuid' }]));
      mockDb.select.mockReturnValueOnce(makeChain([{ renderSpec: SAMPLE_RENDER_SPEC }]));

      const result = await service.activate(DEVICE_SERIAL, WATCHFACE_ID);

      expect(result.activated).toBe(true);
      expect(result.licenseKey).toMatch(/^[0-9a-f]{64}$/);
      expect(result.renderSpec).toEqual(SAMPLE_RENDER_SPEC);
      expect(mockDb.insert).toHaveBeenCalledOnce();
    });

    it('returns same licenseKey on repeat activation (idempotent)', async () => {
      const expectedKey = service.computeLicenseKey(DEVICE_SERIAL, WATCHFACE_ID);
      mockDb.select.mockReturnValueOnce(
        makeChain([{ id: 'existing-uuid', status: 'activated', licenseKey: expectedKey }])
      );
      mockDb.select.mockReturnValueOnce(makeChain([{ renderSpec: SAMPLE_RENDER_SPEC }]));

      const result = await service.activate(DEVICE_SERIAL, WATCHFACE_ID);

      expect(result.activated).toBe(true);
      expect(result.licenseKey).toBe(expectedKey);
      expect(result.renderSpec).toEqual(SAMPLE_RENDER_SPEC);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('upgrades pending license to activated', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([{ id: 'pending-uuid', status: 'pending' }]));
      mockDb.update.mockReturnValueOnce(makeChain([]));
      mockDb.select.mockReturnValueOnce(makeChain([{ renderSpec: null }]));

      const result = await service.activate(DEVICE_SERIAL, WATCHFACE_ID);

      expect(result.activated).toBe(true);
      expect(result.renderSpec).toBeNull();
      expect(mockDb.update).toHaveBeenCalledOnce();
    });

    it('returns null renderSpec when watchface has no render spec', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([]));
      mockDb.insert.mockReturnValueOnce(makeChain([{ id: 'new-uuid' }]));
      mockDb.select.mockReturnValueOnce(makeChain([{ renderSpec: null }]));

      const result = await service.activate(DEVICE_SERIAL, WATCHFACE_ID);

      expect(result.activated).toBe(true);
      expect(result.renderSpec).toBeNull();
    });

    it('throws BadRequestException when insert returns empty (invalid watchfaceId)', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([]));
      mockDb.insert.mockReturnValueOnce(makeChain([]));

      await expect(service.activate(DEVICE_SERIAL, WATCHFACE_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── check ─────────────────────────────────────────────────────────────────────

  describe('check', () => {
    it('returns valid: true when licenseKey matches', async () => {
      const licenseKey = service.computeLicenseKey(DEVICE_SERIAL, WATCHFACE_ID);
      mockDb.select.mockReturnValueOnce(makeChain([{ licenseKey, status: 'activated' }]));

      const result = await service.check(DEVICE_SERIAL, WATCHFACE_ID);
      expect(result.valid).toBe(true);
    });

    it('returns valid: false when no license exists', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([]));

      const result = await service.check(DEVICE_SERIAL, WATCHFACE_ID);
      expect(result.valid).toBe(false);
    });

    it('returns valid: false when licenseKey is tampered', async () => {
      mockDb.select.mockReturnValueOnce(
        makeChain([{ licenseKey: 'tampered-key-000', status: 'activated' }])
      );

      const result = await service.check(DEVICE_SERIAL, WATCHFACE_ID);
      expect(result.valid).toBe(false);
    });

    it('returns valid: false when license exists but status is pending', async () => {
      const licenseKey = service.computeLicenseKey(DEVICE_SERIAL, WATCHFACE_ID);
      mockDb.select.mockReturnValueOnce(makeChain([{ licenseKey, status: 'pending' }]));

      const result = await service.check(DEVICE_SERIAL, WATCHFACE_ID);
      expect(result.valid).toBe(false);
    });
  });
});
