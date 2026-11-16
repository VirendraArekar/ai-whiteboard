import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { S3Service } from './storage/s3.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async handleUpload(
    userId: string,
    file: Express.Multer.File,
    whiteboardId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, GIF, WebP, SVG`,
      );
    }

    if (file.size > MAX_SIZE) {
      throw new BadRequestException(
        `File size exceeds 5MB limit (provided: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      );
    }

    const fileExt = file.originalname.split('.').pop() || 'png';
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = crypto.randomUUID();
    const storageKey = `uploads/${uniqueId}-${cleanName}`;

    // Upload to S3/MinIO
    const { url } = await this.s3Service.uploadFile(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    // Save metadata to PostgreSQL
    const upload = await this.prisma.upload.create({
      data: {
        userId,
        whiteboardId: whiteboardId || null,
        originalFilename: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
      },
    });

    return {
      id: upload.id,
      storageKey: upload.storageKey,
      originalFilename: upload.originalFilename,
      mimeType: upload.mimeType,
      fileSize: Number(upload.fileSize),
      url,
      proxyUrl: `/api/uploads/file/${storageKey}`,
      createdAt: upload.createdAt,
    };
  }

  async getFileStream(storageKey: string) {
    return this.s3Service.getFileStream(storageKey);
  }
}
