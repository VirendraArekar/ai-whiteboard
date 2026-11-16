import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BoardRole } from '../common/enums/board-role.enum';

export interface CollaboratorPresence {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: BoardRole;
  color: string;
  lastActive: Date;
}

const COLLABORATOR_COLORS = [
  '#2D6A4F', // Forest green
  '#E63946', // Coral red
  '#457B9D', // Steel blue
  '#E76F51', // Burnt orange
  '#9B5DE5', // Purple
  '#F15BB5', // Pink
  '#00BBF9', // Cyan
  '#00F5D4', // Mint
  '#FFB703', // Amber
  '#3A86FF', // Royal blue
];

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  // Map of boardId -> Map of socketId -> CollaboratorPresence
  private readonly roomRosters = new Map<string, Map<string, CollaboratorPresence>>();

  constructor(private readonly prisma: PrismaService) {}

  getColorForUser(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
    return COLLABORATOR_COLORS[index];
  }

  async verifyBoardAccess(boardId: string, userId: string): Promise<BoardRole | null> {
    const board = await this.prisma.whiteboard.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!board) return null;
    if (board.ownerId === userId) return BoardRole.OWNER;
    if (board.members.length > 0) return board.members[0].role as BoardRole;
    return null;
  }

  addUserToRoom(
    boardId: string,
    socketId: string,
    user: { id: string; name: string; email: string; avatarUrl?: string | null },
    role: BoardRole,
  ): CollaboratorPresence {
    if (!this.roomRosters.has(boardId)) {
      this.roomRosters.set(boardId, new Map());
    }

    const room = this.roomRosters.get(boardId)!;
    const presence: CollaboratorPresence = {
      socketId,
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      role,
      color: this.getColorForUser(user.id),
      lastActive: new Date(),
    };

    room.set(socketId, presence);
    return presence;
  }

  removeUserFromRoom(boardId: string, socketId: string): CollaboratorPresence | null {
    const room = this.roomRosters.get(boardId);
    if (!room) return null;

    const presence = room.get(socketId) || null;
    room.delete(socketId);

    if (room.size === 0) {
      this.roomRosters.delete(boardId);
    }

    return presence;
  }

  handleDisconnect(socketId: string): { boardId: string; presence: CollaboratorPresence }[] {
    const removals: { boardId: string; presence: CollaboratorPresence }[] = [];

    for (const [boardId, room] of this.roomRosters.entries()) {
      if (room.has(socketId)) {
        const presence = room.get(socketId)!;
        room.delete(socketId);
        removals.push({ boardId, presence });
        if (room.size === 0) {
          this.roomRosters.delete(boardId);
        }
      }
    }

    return removals;
  }

  getActiveUsers(boardId: string): CollaboratorPresence[] {
    const room = this.roomRosters.get(boardId);
    if (!room) return [];
    return Array.from(room.values());
  }
}
