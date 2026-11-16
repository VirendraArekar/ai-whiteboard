import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { BoardRoleGuard } from '../common/guards/board-role.guard';

@Module({
  controllers: [AiController],
  providers: [AiService, BoardRoleGuard],
  exports: [AiService],
})
export class AiModule {}
