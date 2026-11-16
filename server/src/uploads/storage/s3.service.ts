import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('s3.endpoint') || 'http://localhost:9000';
    this.bucket = this.configService.get<string>('s3.bucket') || 'ai-whiteboard';

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get<string>('s3.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKey') || 'minioadmin',
        secretAccessKey: this.configService.get<string>('s3.secretKey') || 'minioadmin',
      },
      forcePathStyle: this.configService.get<boolean>('s3.forcePathStyle') ?? true,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`S3/MinIO bucket "${this.bucket}" verified.`);
    } catch (error: any) {
      if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Created S3/MinIO bucket "${this.bucket}".`);
        } catch (createErr) {
          this.logger.warn(`Could not auto-create bucket: ${createErr.message}`);
        }
      } else {
        this.logger.warn(`S3 connection check skipped or bucket exists: ${error.message}`);
      }
    }
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ key: string; url: string }> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    // Build public accessibility URL
    const url = `${this.endpoint}/${this.bucket}/${key}`;
    return { key, url };
  }

  async getFileStream(key: string): Promise<{ stream: Readable; contentType: string }> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || 'application/octet-stream',
    };
  }
}
