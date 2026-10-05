import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class RuntimeAssetStore {
  private readonly client: S3Client;

  constructor(
    private readonly bucket = process.env.RUNTIME_ASSETS_BUCKET,
    config: S3ClientConfig = {},
  ) {
    this.client = new S3Client(config);
  }

  async uploadFile(key: string, path: string): Promise<void> {
    if (!this.bucket) throw new Error('RUNTIME_ASSETS_BUCKET is not configured');
    const file = await stat(path);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: createReadStream(path),
        ContentLength: file.size,
        ContentType: 'video/mp4',
      }),
    );
  }

  async createDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.bucket) throw new Error('RUNTIME_ASSETS_BUCKET is not configured');
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }
}
