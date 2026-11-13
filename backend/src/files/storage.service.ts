import { randomUUID } from 'node:crypto';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@/config/env.validation';

export interface StoredFile {
  body: Buffer;
  /** MIME type detected from the file content, not the one sent by the client */
  contentType: string;
  /** Extension without the dot, e.g. "png" */
  extension: string;
}

/**
 * Keeps uploaded files in S3-compatible storage (MinIO locally, R2 or AWS in production).
 * The database stores only the object key; the public URL is built from S3_PUBLIC_URL,
 * so moving the files to another host only needs a config change.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.s3 = new S3Client({
      endpoint: config.get('S3_ENDPOINT', { infer: true }),
      region: config.get('S3_REGION', { infer: true }),
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE', { infer: true }),
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY', { infer: true }),
        secretAccessKey: config.get('S3_SECRET_KEY', { infer: true }),
      },
    });
    this.bucket = config.get('S3_BUCKET', { infer: true });
    this.publicUrl = config.get('S3_PUBLIC_URL', { infer: true }).replace(/\/+$/, '');
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucket();
  }

  /** Saves the file under a new random key and returns the key. */
  async upload(file: StoredFile): Promise<string> {
    const key = `${randomUUID()}.${file.extension}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.body,
        ContentType: file.contentType,
        // The key never changes for other content, so browsers may cache the file for good
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return key;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Creates the bucket on first start and opens it for public reading, so `<img src>` works.
   * An existing bucket is left as it is: in production it is set up in the provider's
   * dashboard (R2 does not support bucket policies).
   */
  private async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch (error) {
      if (!(error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404)) {
        throw error;
      }
    }

    await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    await this.s3.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }),
      }),
    );
    this.logger.log(`Created public-read bucket "${this.bucket}"`);
  }
}
