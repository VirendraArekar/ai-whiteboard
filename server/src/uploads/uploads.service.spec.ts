import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from './uploads.service';
import { PrismaService } from '../database/prisma.service';
import { S3Service } from './storage/s3.service';
import { BadRequestException } from '@nestjs/common';

describe('UploadsService', () => {
  let service: UploadsService;
  let prisma: any;
  let s3: any;

  beforeEach(async () => {
    prisma = {
      upload: {
        create: jest.fn(),
      },
    };

    s3 = {
      uploadFile: jest.fn().mockResolvedValue({
        key: 'uploads/mock-key.png',
        url: 'http://localhost:9000/ai-whiteboard/uploads/mock-key.png',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3 },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleUpload', () => {
    it('should throw BadRequestException if no file provided', async () => {
      await expect(service.handleUpload('user-1', null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if MIME type is not allowed', async () => {
      const invalidFile: any = {
        mimetype: 'application/pdf',
        size: 1024,
        originalname: 'doc.pdf',
        buffer: Buffer.from('test'),
      };

      await expect(service.handleUpload('user-1', invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if file exceeds 5MB', async () => {
      const oversizedFile: any = {
        mimetype: 'image/png',
        size: 6 * 1024 * 1024,
        originalname: 'large.png',
        buffer: Buffer.from('test'),
      };

      await expect(service.handleUpload('user-1', oversizedFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upload valid image, save metadata in PostgreSQL, and return URLs', async () => {
      const validFile: any = {
        mimetype: 'image/png',
        size: 2048,
        originalname: 'diagram.png',
        buffer: Buffer.from('image bytes'),
      };

      prisma.upload.create.mockResolvedValue({
        id: 'upload-uuid',
        userId: 'user-1',
        whiteboardId: 'board-1',
        originalFilename: 'diagram.png',
        storageKey: 'uploads/uuid-diagram.png',
        mimeType: 'image/png',
        fileSize: BigInt(2048),
        createdAt: new Date(),
      });

      const result = await service.handleUpload('user-1', validFile, 'board-1');
      expect(result.id).toBe('upload-uuid');
      expect(result.mimeType).toBe('image/png');
      expect(result.fileSize).toBe(2048);
      expect(result.url).toBeDefined();
      expect(result.proxyUrl).toBeDefined();
      expect(s3.uploadFile).toHaveBeenCalled();
      expect(prisma.upload.create).toHaveBeenCalled();
    });
  });
});
