import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { BulkElementsDto } from './dto/bulk-elements.dto';

@Injectable()
export class ElementsService {
  private readonly logger = new Logger(ElementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(boardId: string) {
    return this.prisma.element.findMany({
      where: { whiteboardId: boardId },
      orderBy: { zIndex: 'asc' },
    });
  }

  async create(boardId: string, userId: string, dto: CreateElementDto) {
    const data: any = {
      whiteboardId: boardId,
      type: dto.type,
      data: dto.data,
      positionX: dto.positionX,
      positionY: dto.positionY,
      width: dto.width,
      height: dto.height,
      rotation: dto.rotation ?? 0,
      zIndex: dto.zIndex ?? 0,
      createdById: userId,
    };

    if (dto.id) {
      data.id = dto.id;
    }

    return this.prisma.element.create({
      data,
    });
  }

  async update(boardId: string, elementId: string, dto: UpdateElementDto) {
    const element = await this.prisma.element.findUnique({
      where: { id: elementId },
    });

    if (!element || element.whiteboardId !== boardId) {
      throw new NotFoundException('Element not found on this whiteboard');
    }

    return this.prisma.element.update({
      where: { id: elementId },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.data !== undefined ? { data: dto.data } : {}),
        ...(dto.positionX !== undefined ? { positionX: dto.positionX } : {}),
        ...(dto.positionY !== undefined ? { positionY: dto.positionY } : {}),
        ...(dto.width !== undefined ? { width: dto.width } : {}),
        ...(dto.height !== undefined ? { height: dto.height } : {}),
        ...(dto.rotation !== undefined ? { rotation: dto.rotation } : {}),
        ...(dto.zIndex !== undefined ? { zIndex: dto.zIndex } : {}),
      },
    });
  }

  async delete(boardId: string, elementId: string) {
    const element = await this.prisma.element.findUnique({
      where: { id: elementId },
    });

    if (!element || element.whiteboardId !== boardId) {
      throw new NotFoundException('Element not found on this whiteboard');
    }

    await this.prisma.element.delete({
      where: { id: elementId },
    });

    return { success: true, message: 'Element deleted', id: elementId };
  }

  async bulkOperations(boardId: string, userId: string, dto: BulkElementsDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Process deletions
      if (dto.delete && dto.delete.length > 0) {
        await tx.element.deleteMany({
          where: {
            id: { in: dto.delete },
            whiteboardId: boardId,
          },
        });
      }

      // 2. Process updates
      if (dto.update && dto.update.length > 0) {
        for (const item of dto.update) {
          await tx.element.updateMany({
            where: {
              id: item.id,
              whiteboardId: boardId,
            },
            data: {
              ...(item.type !== undefined ? { type: item.type } : {}),
              ...(item.data !== undefined ? { data: item.data } : {}),
              ...(item.positionX !== undefined ? { positionX: item.positionX } : {}),
              ...(item.positionY !== undefined ? { positionY: item.positionY } : {}),
              ...(item.width !== undefined ? { width: item.width } : {}),
              ...(item.height !== undefined ? { height: item.height } : {}),
              ...(item.rotation !== undefined ? { rotation: item.rotation } : {}),
              ...(item.zIndex !== undefined ? { zIndex: item.zIndex } : {}),
            },
          });
        }
      }

      // 3. Process creations
      if (dto.create && dto.create.length > 0) {
        for (const item of dto.create) {
          const createData: any = {
            whiteboardId: boardId,
            type: item.type,
            data: item.data,
            positionX: item.positionX,
            positionY: item.positionY,
            width: item.width,
            height: item.height,
            rotation: item.rotation ?? 0,
            zIndex: item.zIndex ?? 0,
            createdById: userId,
          };
          if (item.id) {
            createData.id = item.id;
          }
          await tx.element.create({ data: createData });
        }
      }

      // Return updated elements
      return tx.element.findMany({
        where: { whiteboardId: boardId },
        orderBy: { zIndex: 'asc' },
      });
    });
  }
}
