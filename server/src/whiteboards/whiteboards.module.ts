import { Module } from '@nestjs/common';
import { WhiteboardsService } from './whiteboards.service';
import { WhiteboardsController } from './whiteboards.controller';
import { BoardRoleGuard } from '../common/guards/board-role.guard';

@Module({
  controllers: [WhiteboardsController],
  providers: [WhiteboardsService, BoardRoleGuard],
  exports: [WhiteboardsService, BoardRoleGuard],
})
export class WhiteboardsModule {}
