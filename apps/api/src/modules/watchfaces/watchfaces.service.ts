import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Db } from '../../infra/db/client.js';
import { DB_TOKEN } from '../../infra/db/database.module.js';
import { R2Service } from '../../infra/r2/r2.service.js';
import { designers, watchfaces } from '../../infra/db/schema/index.js';
import type { ListWatchfacesQuery, ListWatchfacesResponse } from './dto/list-watchfaces.dto.js';
import type { UploadWatchfaceDto } from './dto/upload-watchface.dto.js';

const PRG_MAX_BYTES = 10 * 1024 * 1024;
const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;

// SEC-05: detect MIME from magic bytes, ignoring client-supplied Content-Type
const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

function detectThumbnailMime(buf: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'image/png';
  return null;
}

@Injectable()
export class WatchfacesService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    @Inject(R2Service) private readonly r2: R2Service,
  ) {}

  async list(query: ListWatchfacesQuery): Promise<ListWatchfacesResponse> {
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    const whereClause = and(
      eq(watchfaces.status, 'published'),
      isNull(watchfaces.deletedAt),
    );

    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: watchfaces.id,
          title: watchfaces.title,
          description: watchfaces.description,
          thumbnailUrl: watchfaces.thumbnailUrl,
          price: watchfaces.price,
          designerId: watchfaces.designerId,
          designerBrandName: designers.brandName,
          deviceTargets: watchfaces.deviceTargets,
          downloadCount: watchfaces.downloadCount,
          createdAt: watchfaces.createdAt,
        })
        .from(watchfaces)
        .leftJoin(designers, eq(watchfaces.designerId, designers.userId))
        .where(whereClause)
        .orderBy(desc(watchfaces.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(watchfaces).where(whereClause),
    ]);

    const total = Number(countResult[0]?.value ?? 0);

    return { items, total, page, limit };
  }

  async upload(
    userId: string,
    dto: UploadWatchfaceDto,
    prgFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File,
  ) {
    // Verify caller is a registered designer
    const [designer] = await this.db
      .select({ userId: designers.userId })
      .from(designers)
      .where(eq(designers.userId, userId))
      .limit(1);
    if (!designer) throw new ForbiddenException('Only designers can upload watchfaces');

    // Validate file sizes
    if (prgFile.size > PRG_MAX_BYTES)
      throw new BadRequestException('PRG file exceeds 10 MB limit');
    if (thumbnailFile.size > THUMBNAIL_MAX_BYTES)
      throw new BadRequestException('Thumbnail exceeds 2 MB limit');

    // SEC-05: validate MIME from magic bytes, not client-supplied Content-Type
    // SEC-11: derive extension from detected MIME, not from client-supplied originalname
    const detectedMime = detectThumbnailMime(thumbnailFile.buffer);
    if (!detectedMime)
      throw new BadRequestException('Thumbnail must be JPEG or PNG');
    const thumbExt = MIME_EXT_MAP[detectedMime] ?? '.jpg';

    const id = randomUUID();

    const [prgUrl, thumbnailUrl] = await Promise.all([
      this.r2.upload(
        `watchfaces/${id}/file.prg`,
        prgFile.buffer,
        'application/octet-stream',
      ),
      this.r2.upload(
        `watchfaces/${id}/thumbnail${thumbExt}`,
        thumbnailFile.buffer,
        detectedMime,
      ),
    ]);

    const [watchface] = await this.db
      .insert(watchfaces)
      .values({
        id,
        designerId: userId,
        title: dto.title,
        description: dto.description,
        prgUrl,
        thumbnailUrl,
        fileSizeBytes: prgFile.size,
        prgOriginalName: prgFile.originalname,
        deviceTargets: dto.deviceTargets,
        price: dto.price,
        status: 'published',
      })
      // SEC-08: return only public-safe fields — exclude prgUrl, prgOriginalName, fileSizeBytes
      .returning({
        id: watchfaces.id,
        title: watchfaces.title,
        description: watchfaces.description,
        thumbnailUrl: watchfaces.thumbnailUrl,
        price: watchfaces.price,
        designerId: watchfaces.designerId,
        deviceTargets: watchfaces.deviceTargets,
        status: watchfaces.status,
        downloadCount: watchfaces.downloadCount,
        createdAt: watchfaces.createdAt,
      });

    return watchface;
  }
}
