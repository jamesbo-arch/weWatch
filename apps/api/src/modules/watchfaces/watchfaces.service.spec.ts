import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DB_TOKEN } from '../../infra/db/database.module.js';
import { R2Service } from '../../infra/r2/r2.service.js';
import { WatchfacesService } from './watchfaces.service.js';

// Thenable chain: all methods return the same chain, which can be awaited at any step.
function makeChain(result: unknown) {
  const chain = {} as Record<string, unknown>;
  chain['then'] = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  chain['catch'] = (rej: (e: unknown) => unknown) => Promise.resolve(result).catch(rej);
  for (const m of ['from', 'where', 'leftJoin', 'orderBy', 'limit', 'offset', 'values', 'returning']) {
    chain[m] = vi.fn(() => chain);
  }
  return chain;
}

// Real magic byte headers for SEC-05 magic-bytes validation
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'prg',
    originalname: 'face.prg',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: 1024,
    buffer: Buffer.from('fake'),
    stream: null as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

const DESIGNER_ID = 'designer-uuid';
const MOCK_DESIGNER = { userId: DESIGNER_ID };
const MOCK_WATCHFACE = { id: 'wf-uuid', title: 'Test Face', designerId: DESIGNER_ID };

describe('WatchfacesService', () => {
  let service: WatchfacesService;
  let mockDb: { select: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> };
  let mockR2: { upload: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDb = { select: vi.fn(), insert: vi.fn() };
    mockR2 = { upload: vi.fn().mockResolvedValue('https://r2.example.com/file') };

    const module = await Test.createTestingModule({
      providers: [
        WatchfacesService,
        { provide: DB_TOKEN, useValue: mockDb },
        { provide: R2Service, useValue: mockR2 },
      ],
    }).compile();

    service = module.get(WatchfacesService);
  });

  // ── list ─────────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns paginated watchfaces with total count', async () => {
      const items = [{ id: '1', title: 'Face A', designerBrandName: 'Studio X' }];
      mockDb.select
        .mockReturnValueOnce(makeChain(items))           // items query
        .mockReturnValueOnce(makeChain([{ value: 1n }])); // count query

      const result = await service.list({ page: 1, limit: 20 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(1);
      expect(result.items).toEqual(items);
    });

    it('returns total 0 when no watchfaces exist', async () => {
      mockDb.select
        .mockReturnValueOnce(makeChain([]))
        .mockReturnValueOnce(makeChain([{ value: 0n }]));

      const result = await service.list({ page: 1, limit: 20 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns correct page and limit metadata for page 2', async () => {
      mockDb.select
        .mockReturnValueOnce(makeChain([]))
        .mockReturnValueOnce(makeChain([{ value: 25n }]));

      const result = await service.list({ page: 2, limit: 10 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
    });
  });

  // ── upload ────────────────────────────────────────────────────────────────────

  describe('upload', () => {
    const dto = { title: 'Sunset', price: 0, deviceTargets: ['fenix7'] };
    const prgFile = makeFile({ fieldname: 'prg', originalname: 'face.prg', size: 500_000 });
    const thumbJpg = makeFile({
      fieldname: 'thumbnail',
      originalname: 'thumb.jpg',
      mimetype: 'image/jpeg',
      size: 100_000,
      buffer: JPEG_MAGIC,
    });

    it('uploads files to R2 and returns inserted watchface', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));
      mockDb.insert.mockReturnValueOnce(makeChain([MOCK_WATCHFACE]));

      const result = await service.upload(DESIGNER_ID, dto, prgFile, thumbJpg);

      expect(mockR2.upload).toHaveBeenCalledTimes(2);
      expect(mockR2.upload).toHaveBeenCalledWith(
        expect.stringContaining('/file.prg'),
        prgFile.buffer,
        'application/octet-stream',
      );
      expect(result).toEqual(MOCK_WATCHFACE);
    });

    it('throws ForbiddenException when caller is not a designer', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([]));

      await expect(service.upload('not-a-designer', dto, prgFile, thumbJpg)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockR2.upload).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when PRG file exceeds 10 MB (AC-U04)', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));
      const bigPrg = makeFile({ size: 10 * 1024 * 1024 + 1 });

      await expect(service.upload(DESIGNER_ID, dto, bigPrg, thumbJpg)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('accepts PRG file exactly at 10 MB boundary', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));
      mockDb.insert.mockReturnValueOnce(makeChain([MOCK_WATCHFACE]));
      const exactPrg = makeFile({ size: 10 * 1024 * 1024 });

      await expect(service.upload(DESIGNER_ID, dto, exactPrg, thumbJpg)).resolves.toBeDefined();
    });

    it('throws BadRequestException when thumbnail exceeds 2 MB (AC-U07)', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));
      const bigThumb = makeFile({ size: 2 * 1024 * 1024 + 1, mimetype: 'image/jpeg' });

      await expect(service.upload(DESIGNER_ID, dto, prgFile, bigThumb)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for webp thumbnail (AC-U06)', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));

      await expect(
        service.upload(DESIGNER_ID, dto, prgFile, makeFile({ mimetype: 'image/webp', originalname: 'thumb.webp' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for gif thumbnail (AC-U06)', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));

      await expect(
        service.upload(DESIGNER_ID, dto, prgFile, makeFile({ mimetype: 'image/gif', originalname: 'thumb.gif' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts JPEG thumbnail', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));
      mockDb.insert.mockReturnValueOnce(makeChain([MOCK_WATCHFACE]));

      await expect(service.upload(DESIGNER_ID, dto, prgFile, thumbJpg)).resolves.toBeDefined();
    });

    it('accepts PNG thumbnail', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));
      mockDb.insert.mockReturnValueOnce(makeChain([MOCK_WATCHFACE]));
      const pngThumb = makeFile({ mimetype: 'image/png', originalname: 'thumb.png', buffer: PNG_MAGIC });

      await expect(service.upload(DESIGNER_ID, dto, prgFile, pngThumb)).resolves.toBeDefined();
    });

    it('does not call R2 when validation fails', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_DESIGNER]));
      const bigPrg = makeFile({ size: 11 * 1024 * 1024 });

      await expect(service.upload(DESIGNER_ID, dto, bigPrg, thumbJpg)).rejects.toThrow();
      expect(mockR2.upload).not.toHaveBeenCalled();
    });
  });
});
