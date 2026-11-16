import { Test, TestingModule } from '@nestjs/testing';
import { WhiteboardsService } from './whiteboards.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardRole } from '../common/enums/board-role.enum';

describe('WhiteboardsService', () => {
  let service: WhiteboardsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      whiteboard: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      whiteboardMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhiteboardsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WhiteboardsService>(WhiteboardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create whiteboard and assign owner role', async () => {
      const mockBoard = {
        id: 'board-1',
        title: 'New Canvas',
        description: null,
        ownerId: 'user-1',
        owner: { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatarUrl: null },
      };
      prisma.whiteboard.create.mockResolvedValue(mockBoard);

      const result = await service.create('user-1', { title: 'New Canvas' });
      expect(result.id).toBe('board-1');
      expect(result.role).toBe(BoardRole.OWNER);
      expect(prisma.whiteboard.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if whiteboard does not exist', async () => {
      prisma.whiteboard.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user has no membership', async () => {
      prisma.whiteboard.findUnique.mockResolvedValue({
        id: 'board-1',
        ownerId: 'other-user',
        members: [],
        elements: [],
      });

      await expect(service.findOne('board-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return whiteboard if user is owner', async () => {
      const mockBoard = {
        id: 'board-1',
        title: 'Board 1',
        description: 'Test description',
        thumbnailUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: 'user-1',
        owner: { id: 'user-1', name: 'User 1', email: 'u1@example.com', avatarUrl: null },
        members: [],
        elements: [],
      };
      prisma.whiteboard.findUnique.mockResolvedValue(mockBoard);

      const result = await service.findOne('board-1', 'user-1');
      expect(result.id).toBe('board-1');
      expect(result.role).toBe(BoardRole.OWNER);
    });
  });
});
