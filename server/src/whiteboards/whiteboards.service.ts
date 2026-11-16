import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateWhiteboardDto } from './dto/create-whiteboard.dto';
import { UpdateWhiteboardDto } from './dto/update-whiteboard.dto';
import {
  QueryWhiteboardsDto,
  WhiteboardTab,
  WhiteboardSortBy,
  SortOrder,
} from './dto/query-whiteboards.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { BoardRole } from '../common/enums/board-role.enum';

@Injectable()
export class WhiteboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWhiteboardDto) {
    const title = dto.title.trim() || 'Untitled Whiteboard';

    const whiteboard = await this.prisma.whiteboard.create({
      data: {
        title,
        description: dto.description?.trim(),
        ownerId: userId,
        members: {
          create: {
            userId,
            role: BoardRole.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return {
      ...whiteboard,
      role: BoardRole.OWNER,
      memberCount: 1,
      elementCount: 0,
    };
  }

  async findAll(userId: string, query: QueryWhiteboardsDto) {
    const { tab = WhiteboardTab.ALL, search, sortBy = WhiteboardSortBy.UPDATED_AT, order = SortOrder.DESC } = query;

    const where: any = {};

    if (tab === WhiteboardTab.MINE) {
      where.ownerId = userId;
    } else if (tab === WhiteboardTab.SHARED) {
      where.ownerId = { not: userId };
      where.members = {
        some: { userId },
      };
    } else {
      // ALL or RECENT
      where.OR = [
        { ownerId: userId },
        { members: { some: { userId } } },
      ];
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const orderBy: any = {};
    if (sortBy === WhiteboardSortBy.TITLE) {
      orderBy.title = order;
    } else if (sortBy === WhiteboardSortBy.CREATED_AT) {
      orderBy.createdAt = order;
    } else {
      orderBy.updatedAt = order;
    }

    const whiteboards = await this.prisma.whiteboard.findMany({
      where,
      orderBy,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: {
            members: true,
            elements: true,
          },
        },
      },
    });

    return whiteboards.map((b) => {
      let role: BoardRole = BoardRole.VIEWER;
      if (b.ownerId === userId) {
        role = BoardRole.OWNER;
      } else if (b.members.length > 0) {
        role = b.members[0].role as BoardRole;
      }

      return {
        id: b.id,
        title: b.title,
        description: b.description,
        thumbnailUrl: b.thumbnailUrl,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        owner: b.owner,
        role,
        memberCount: b._count.members,
        elementCount: b._count.elements,
      };
    });
  }

  async findOne(boardId: string, userId: string) {
    const board = await this.prisma.whiteboard.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        elements: {
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Whiteboard not found');
    }

    const isOwner = board.ownerId === userId;
    const userMembership = board.members.find((m) => m.userId === userId);

    if (!isOwner && !userMembership) {
      throw new ForbiddenException('You do not have access to this whiteboard');
    }

    const userRole = isOwner ? BoardRole.OWNER : (userMembership!.role as BoardRole);

    return {
      id: board.id,
      title: board.title,
      description: board.description,
      thumbnailUrl: board.thumbnailUrl,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      owner: board.owner,
      role: userRole,
      members: board.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
      elements: board.elements,
    };
  }

  async update(boardId: string, dto: UpdateWhiteboardDto) {
    return this.prisma.whiteboard.update({
      where: { id: boardId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.thumbnailUrl !== undefined ? { thumbnailUrl: dto.thumbnailUrl?.trim() } : {}),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async delete(boardId: string, userId: string) {
    const board = await this.prisma.whiteboard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Whiteboard not found');
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('Only the whiteboard owner can delete this board');
    }

    await this.prisma.whiteboard.delete({
      where: { id: boardId },
    });

    return { success: true, message: 'Whiteboard deleted successfully' };
  }

  async duplicate(boardId: string, userId: string) {
    const original = await this.prisma.whiteboard.findUnique({
      where: { id: boardId },
      include: {
        elements: true,
      },
    });

    if (!original) {
      throw new NotFoundException('Source whiteboard not found');
    }

    const duplicated = await this.prisma.whiteboard.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        thumbnailUrl: original.thumbnailUrl,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: BoardRole.OWNER,
          },
        },
        elements: {
          create: original.elements.map((el) => ({
            type: el.type,
            data: el.data as any,
            positionX: el.positionX,
            positionY: el.positionY,
            width: el.width,
            height: el.height,
            rotation: el.rotation,
            zIndex: el.zIndex,
            createdById: userId,
          })),
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return {
      ...duplicated,
      role: BoardRole.OWNER,
      elementCount: original.elements.length,
      memberCount: 1,
    };
  }

  async getMembers(boardId: string) {
    return this.prisma.whiteboardMember.findMany({
      where: { whiteboardId: boardId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(boardId: string, inviterId: string, dto: AddMemberDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!targetUser) {
      throw new NotFoundException('User with this email is not registered');
    }

    const board = await this.prisma.whiteboard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Whiteboard not found');
    }

    if (board.ownerId === targetUser.id) {
      throw new BadRequestException('This user is already the owner of this whiteboard');
    }

    const existingMember = await this.prisma.whiteboardMember.findUnique({
      where: {
        whiteboardId_userId: {
          whiteboardId: boardId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this whiteboard');
    }

    const member = await this.prisma.whiteboardMember.create({
      data: {
        whiteboardId: boardId,
        userId: targetUser.id,
        role: dto.role,
        invitedById: inviterId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return member;
  }

  async updateMemberRole(boardId: string, memberId: string, dto: UpdateMemberRoleDto) {
    const member = await this.prisma.whiteboardMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.whiteboardId !== boardId) {
      throw new NotFoundException('Member record not found on this whiteboard');
    }

    if (member.role === BoardRole.OWNER) {
      throw new BadRequestException('Cannot alter owner membership through this endpoint');
    }

    return this.prisma.whiteboardMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async removeMember(boardId: string, memberId: string, requestingUserId: string) {
    const member = await this.prisma.whiteboardMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.whiteboardId !== boardId) {
      throw new NotFoundException('Member record not found on this whiteboard');
    }

    const board = await this.prisma.whiteboard.findUnique({
      where: { id: boardId },
    });

    const isOwner = board?.ownerId === requestingUserId;
    const isSelfRemoval = member.userId === requestingUserId;

    if (!isOwner && !isSelfRemoval) {
      throw new ForbiddenException('Only the board owner or the member themselves can remove access');
    }

    if (member.role === BoardRole.OWNER) {
      throw new BadRequestException('Cannot remove board owner');
    }

    await this.prisma.whiteboardMember.delete({
      where: { id: memberId },
    });

    return { success: true, message: 'Member removed successfully' };
  }
}
