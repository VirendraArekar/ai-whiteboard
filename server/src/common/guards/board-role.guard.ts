import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { BoardRole } from '../enums/board-role.enum';

@Injectable()
export class BoardRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<BoardRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    const boardId = request.params.boardId || request.body.boardId;
    if (!boardId) {
      // If no boardId in params/body, cannot determine board role
      return true;
    }

    const board = await this.prisma.whiteboard.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Whiteboard not found');
    }

    let userRole: BoardRole | null = null;
    if (board.ownerId === user.id) {
      userRole = BoardRole.OWNER;
    } else if (board.members.length > 0) {
      userRole = board.members[0].role as BoardRole;
    }

    if (!userRole) {
      throw new ForbiddenException('You do not have access to this whiteboard');
    }

    // Role hierarchy: OWNER > EDITOR > VIEWER
    const roleHierarchy: Record<BoardRole, number> = {
      [BoardRole.OWNER]: 3,
      [BoardRole.EDITOR]: 2,
      [BoardRole.VIEWER]: 1,
    };

    const hasPermission = requiredRoles.some(
      (required) => roleHierarchy[userRole!] >= roleHierarchy[required],
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Requires: ${requiredRoles.join(' or ')}`,
      );
    }

    // Attach role to request for downstream usage
    request.userBoardRole = userRole;
    return true;
  }
}
