import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { CollaborationService } from './collaboration.service';
import { ElementsService } from '../elements/elements.service';
import { BoardRole } from '../common/enums/board-role.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly collaborationService: CollaborationService,
    private readonly elementsService: ElementsService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Collaboration WebSocket Gateway initialized');
  }

  async handleConnection(socket: Socket) {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token && typeof socket.handshake.query?.token === 'string') {
        token = socket.handshake.query.token;
      }

      if (!token) {
        this.logger.warn(`Socket connection rejected: No token provided (${socket.id})`);
        socket.disconnect();
        return;
      }

      const secret =
        this.configService.get<string>('jwt.accessSecret') ||
        'default_jwt_access_secret_key_minimum_32_chars!';

      const payload = this.jwtService.verify(token, { secret });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, avatarUrl: true },
      });

      if (!user) {
        socket.disconnect();
        return;
      }

      socket.data.user = user;
      this.logger.log(`Socket authenticated: ${user.name} (${socket.id})`);
    } catch (err) {
      this.logger.warn(`Socket connection unauthorized: ${err.message} (${socket.id})`);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const user = socket.data.user;
    const removals = this.collaborationService.handleDisconnect(socket.id);

    for (const { boardId, presence } of removals) {
      this.server.to(`board:${boardId}`).emit('presence:user-left', {
        userId: presence.userId,
        socketId: socket.id,
      });
      this.logger.log(`User ${presence.name} left room board:${boardId}`);
    }

    if (user) {
      this.logger.log(`Socket disconnected: ${user.name} (${socket.id})`);
    }
  }

  @SubscribeMessage('board:join')
  async handleJoinBoard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    const user = socket.data.user;
    if (!user || !data.boardId) {
      socket.emit('error', { message: 'Unauthorized or missing boardId' });
      return;
    }

    const role = await this.collaborationService.verifyBoardAccess(data.boardId, user.id);
    if (!role) {
      socket.emit('error', { message: 'Access denied: not a member of this whiteboard' });
      return;
    }

    const roomName = `board:${data.boardId}`;
    socket.join(roomName);

    const presence = this.collaborationService.addUserToRoom(
      data.boardId,
      socket.id,
      user,
      role,
    );

    const activeUsers = this.collaborationService.getActiveUsers(data.boardId);

    // Send acknowledgement to joining user
    socket.emit('board:joined', {
      boardId: data.boardId,
      role,
      user: presence,
      activeUsers,
    });

    // Notify other collaborators in room
    socket.to(roomName).emit('presence:user-joined', presence);
    this.logger.log(`User ${user.name} joined room ${roomName} as ${role}`);
  }

  @SubscribeMessage('board:leave')
  handleLeaveBoard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    if (!data.boardId) return;

    const roomName = `board:${data.boardId}`;
    socket.leave(roomName);

    const presence = this.collaborationService.removeUserFromRoom(data.boardId, socket.id);
    if (presence) {
      socket.to(roomName).emit('presence:user-left', {
        userId: presence.userId,
        socketId: socket.id,
      });
    }
  }

  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string; x: number; y: number },
  ) {
    const user = socket.data.user;
    if (!user || !data.boardId) return;

    const color = this.collaborationService.getColorForUser(user.id);

    // Broadcast ephemeral cursor movement directly to room (no DB write)
    socket.to(`board:${data.boardId}`).emit('presence:cursor-moved', {
      userId: user.id,
      socketId: socket.id,
      name: user.name,
      color,
      x: data.x,
      y: data.y,
    });
  }

  @SubscribeMessage('element:create')
  async handleElementCreate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string; element: any },
  ) {
    const user = socket.data.user;
    if (!user || !data.boardId || !data.element) return;

    try {
      await this.elementsService.create(data.boardId, user.id, data.element);
    } catch (err: any) {
      this.logger.debug(`Element create persist ignored/handled: ${err?.message}`);
    }

    socket.to(`board:${data.boardId}`).emit('element:created', {
      element: data.element,
      userId: user.id,
    });
  }

  @SubscribeMessage('element:update')
  async handleElementUpdate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string; element: any },
  ) {
    const user = socket.data.user;
    if (!user || !data.boardId || !data.element) return;

    try {
      await this.elementsService.update(data.boardId, data.element.id, data.element);
    } catch (err: any) {
      this.logger.debug(`Element update persist ignored/handled: ${err?.message}`);
    }

    socket.to(`board:${data.boardId}`).emit('element:updated', {
      element: data.element,
      userId: user.id,
    });
  }

  @SubscribeMessage('element:delete')
  async handleElementDelete(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string; elementId: string },
  ) {
    const user = socket.data.user;
    if (!user || !data.boardId || !data.elementId) return;

    try {
      await this.elementsService.delete(data.boardId, data.elementId);
    } catch (err: any) {
      this.logger.debug(`Element delete persist ignored/handled: ${err?.message}`);
    }

    socket.to(`board:${data.boardId}`).emit('element:deleted', {
      elementId: data.elementId,
      userId: user.id,
    });
  }

  @SubscribeMessage('elements:bulk-update')
  async handleBulkUpdate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string; elements: any[] },
  ) {
    const user = socket.data.user;
    if (!user || !data.boardId || !data.elements) return;

    try {
      await this.elementsService.bulkOperations(data.boardId, user.id, {
        update: data.elements,
      });
    } catch (err: any) {
      this.logger.debug(`Bulk update persist ignored/handled: ${err?.message}`);
    }

    socket.to(`board:${data.boardId}`).emit('elements:bulk-updated', {
      elements: data.elements,
      userId: user.id,
    });
  }

  @SubscribeMessage('draw:stroke-live')
  handleLiveStroke(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string; strokeId: string; point: number[]; color: string; width: number },
  ) {
    const user = socket.data.user;
    if (!user || !data.boardId) return;

    socket.to(`board:${data.boardId}`).emit('draw:stroke-live', {
      ...data,
      userId: user.id,
    });
  }

  @SubscribeMessage('draw:stroke-end')
  async handleStrokeEnd(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { boardId: string; element: any },
  ) {
    const user = socket.data.user;
    if (!user || !data.boardId || !data.element) return;

    try {
      await this.elementsService.create(data.boardId, user.id, data.element);
    } catch (err: any) {
      this.logger.debug(`Stroke element persist ignored/handled: ${err?.message}`);
    }

    socket.to(`board:${data.boardId}`).emit('draw:stroke-ended', {
      element: data.element,
      userId: user.id,
    });
  }
}
