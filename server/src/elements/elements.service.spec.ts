import { Test, TestingModule } from '@nestjs/testing';
import { ElementsService } from './elements.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ElementsService', () => {
  let service: ElementsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      element: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ElementsService>(ElementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an element with specified coordinates and data', async () => {
      const mockElement = {
        id: 'el-1',
        whiteboardId: 'board-1',
        type: 'rectangle',
        data: { fill: '#ffffff' },
        positionX: 50,
        positionY: 60,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        createdById: 'user-1',
      };
      prisma.element.create.mockResolvedValue(mockElement);

      const result = await service.create('board-1', 'user-1', {
        type: 'rectangle',
        data: { fill: '#ffffff' },
        positionX: 50,
        positionY: 60,
        width: 100,
        height: 100,
      });

      expect(result.id).toBe('el-1');
      expect(result.type).toBe('rectangle');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if element does not belong to board', async () => {
      prisma.element.findUnique.mockResolvedValue({
        id: 'el-1',
        whiteboardId: 'different-board',
      });

      await expect(
        service.update('board-1', 'el-1', { positionX: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update element properties', async () => {
      prisma.element.findUnique.mockResolvedValue({
        id: 'el-1',
        whiteboardId: 'board-1',
      });
      prisma.element.update.mockResolvedValue({
        id: 'el-1',
        whiteboardId: 'board-1',
        positionX: 150,
      });

      const result = await service.update('board-1', 'el-1', { positionX: 150 });
      expect(result.positionX).toBe(150);
    });
  });

  describe('bulkOperations', () => {
    it('should execute bulk creates, updates, and deletes in transaction', async () => {
      prisma.element.deleteMany.mockResolvedValue({ count: 1 });
      prisma.element.updateMany.mockResolvedValue({ count: 1 });
      prisma.element.create.mockResolvedValue({ id: 'new-el' });
      prisma.element.findMany.mockResolvedValue([{ id: 'new-el' }]);

      const result = await service.bulkOperations('board-1', 'user-1', {
        delete: ['del-1'],
        update: [{ id: 'upd-1', positionX: 200 }],
        create: [
          {
            type: 'text',
            data: { text: 'Hello' },
            positionX: 10,
            positionY: 10,
            width: 100,
            height: 40,
          },
        ],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
