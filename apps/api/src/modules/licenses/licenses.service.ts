import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Db } from '../../infra/db/client.js';
import { DB_TOKEN } from '../../infra/db/database.module.js';
import { licenses, watchfaces } from '../../infra/db/schema/index.js';

@Injectable()
export class LicensesService {
  private readonly hmacSecret: string;

  constructor(@Inject(DB_TOKEN) private readonly db: Db) {
    const secret = process.env['LICENSE_HMAC_SECRET'];
    if (!secret) throw new Error('LICENSE_HMAC_SECRET environment variable is required');
    this.hmacSecret = secret;
  }

  computeLicenseKey(deviceSerial: string, watchfaceId: string): string {
    return createHmac('sha256', this.hmacSecret)
      .update(`${deviceSerial}:${watchfaceId}`)
      .digest('hex');
  }

  async activate(deviceSerial: string, watchfaceId: string) {
    const existing = await this.db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.deviceSerial, deviceSerial),
          eq(licenses.watchfaceId, watchfaceId),
        ),
      )
      .limit(1);

    const licenseKey = this.computeLicenseKey(deviceSerial, watchfaceId);

    if (existing[0]?.status === 'activated') {
      const renderSpec = await this.getRenderSpec(watchfaceId);
      return { activated: true, licenseKey: existing[0].licenseKey!, renderSpec };
    }

    if (existing[0]) {
      await this.db
        .update(licenses)
        .set({ deviceSerial, licenseKey, status: 'activated', activatedAt: new Date() })
        .where(eq(licenses.id, existing[0].id));
    } else {
      const inserted = await this.db
        .insert(licenses)
        .values({ watchfaceId, deviceSerial, licenseKey, status: 'activated', activatedAt: new Date() })
        .returning({ id: licenses.id });

      if (!inserted[0]) throw new BadRequestException('Failed to create license — watchfaceId may be invalid');
    }

    const renderSpec = await this.getRenderSpec(watchfaceId);
    return { activated: true, licenseKey, renderSpec };
  }

  private async getRenderSpec(watchfaceId: string): Promise<Record<string, unknown> | null> {
    const rows = await this.db
      .select({ renderSpec: watchfaces.renderSpec })
      .from(watchfaces)
      .where(eq(watchfaces.id, watchfaceId))
      .limit(1);
    return (rows[0]?.renderSpec as Record<string, unknown> | null) ?? null;
  }

  async check(deviceSerial: string, watchfaceId: string): Promise<{ valid: boolean }> {
    const row = await this.db
      .select({ licenseKey: licenses.licenseKey, status: licenses.status })
      .from(licenses)
      .where(
        and(
          eq(licenses.deviceSerial, deviceSerial),
          eq(licenses.watchfaceId, watchfaceId),
        ),
      )
      .limit(1);

    if (!row[0] || row[0].status !== 'activated') return { valid: false };

    const expected = this.computeLicenseKey(deviceSerial, watchfaceId);
    return { valid: row[0].licenseKey === expected };
  }
}
