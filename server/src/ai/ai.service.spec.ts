import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { PrismaService } from '../database/prisma.service';

describe('AiService', () => {
  let service: AiService;
  let prisma: any;
  let config: any;

  beforeEach(async () => {
    prisma = {
      element: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: data.id || 'mock-el-id',
          ...data,
        })),
        findMany: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }) => ({
          id: where.id,
          ...data,
        })),
      },
      aiUsage: {
        create: jest.fn().mockResolvedValue({ id: 'usage-1' }),
      },
      $transaction: jest.fn(async (promises) => Promise.all(promises)),
    };

    config = {
      get: jest.fn((key: string) => {
        if (key === 'gemini.apiKey') return '';
        if (key === 'gemini.model') return 'gemini-2.5-flash';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('brainstorm', () => {
    it('should generate structured sticky notes and log usage', async () => {
      const result = await service.brainstorm('user-1', {
        boardId: 'board-1',
        prompt: 'Launch strategies for SaaS',
        count: 4,
      });

      expect(result.elements).toBeDefined();
      expect(result.elements.length).toBe(4);
      expect(result.elements[0].type).toBe('sticky_note');
      expect(prisma.aiUsage.create).toHaveBeenCalled();
    });
  });

  describe('chart', () => {
    it('should generate a structured chart element and persist in database', async () => {
      const result = await service.chart('user-1', {
        boardId: 'board-1',
        prompt: 'Quarterly sales targets',
        chartType: 'bar' as any,
      });

      expect(result.element).toBeDefined();
      expect(result.element.type).toBe('chart');
      expect((result.element.data as any).labels).toBeDefined();
      expect(prisma.element.create).toHaveBeenCalled();
    });
  });

  describe('summary', () => {
    it('should generate an executive board summary', async () => {
      prisma.element.findMany.mockResolvedValue([
        { id: '1', type: 'sticky_note', data: { text: 'Note 1' } },
        { id: '2', type: 'shape', data: { text: 'Shape 1' } },
      ]);

      const result = await service.summary('user-1', { boardId: 'board-1' });

      expect(result.title).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.actionItems).toBeDefined();
      expect(result.elementCount).toBe(2);
    });
  });
});
