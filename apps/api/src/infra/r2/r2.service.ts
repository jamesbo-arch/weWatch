import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const accountId = process.env['R2_ACCOUNT_ID'];
    const accessKeyId = process.env['R2_ACCESS_KEY_ID'];
    const secretAccessKey = process.env['R2_SECRET_ACCESS_KEY'];
    this.bucket = process.env['R2_BUCKET'] ?? 'wewatch-assets';
    this.publicUrl = process.env['R2_PUBLIC_URL'] ?? 'http://localhost:3001/placeholder';

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId ?? 'placeholder'}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId ?? 'placeholder',
        secretAccessKey: secretAccessKey ?? 'placeholder',
      },
    });
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      return `${this.publicUrl}/${key}`;
    } catch (err) {
      this.logger.error('R2 upload failed', err);
      throw new InternalServerErrorException('File upload failed');
    }
  }
}
