import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationService } from './collaboration.service';
import { PrismaService } from '../database/prisma.service';
import { BoardRole } from '../common/enums/board-role.enum';

describe('CollaborationService', () => {
  let service: CollaborationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      whiteboard: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CollaborationService>(CollaborationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyBoardAccess', () => {
    it('should return OWNER if user is board owner', async () => {
      prisma.whiteboard.findUnique.mockResolvedValue({
        id: 'board-1',
        ownerId: 'user-1',
        members: [],
      });

      const role = await service.verifyBoardAccess('board-1', 'user-1');
      expect(role).toBe(BoardRole.OWNER);
    });

    it('should return role from members if not owner', async () => {
      prisma.whiteboard.findUnique.mockResolvedValue({
        id: 'board-1',
        ownerId: 'user-owner',
        members: [{ role: BoardRole.EDITOR }],
      });

      const role = await service.verifyBoardAccess('board-1', 'user-editor');
      expect(role).toBe(BoardRole.EDITOR);
    });

    it('should return null if board not found', async () => {
      prisma.whiteboard.findUnique.mockResolvedValue(null);

      const role = await service.verifyBoardAccess('board-unknown', 'user-1');
      expect(role).toBeNull();
    });
  });

  describe('room roster tracking', () => {
    it('should add user to room and track active users', () => {
      const user = { id: 'u1', name: 'Alice', email: 'alice@test.com' };
      const presence = service.addUserToRoom('b1', 'sock-1', user, BoardRole.OWNER);

      expect(presence.userId).toBe('u1');
      expect(presence.color).toBeDefined();

      const activeUsers = service.getActiveUsers('b1');
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].name).toBe('Alice');
    });

    it('should clean up user on disconnect', () => {
      const user = { id: 'u1', name: 'Alice', email: 'alice@test.com' };
      service.addUserToRoom('b1', 'sock-1', user, BoardRole.OWNER);

      const removals = service.handleDisconnect('sock-1');
      expect(removals).toHaveLength(1);
      expect(removals[0].boardId).toBe('b1');
      expect(service.getActiveUsers('b1')).toHaveLength(0);
    });
  });
});
