import { Module } from '@nestjs/common';
import { ElementsService } from './elements.service';
import { ElementsController } from './elements.controller';
import { BoardRoleGuard } from '../common/guards/board-role.guard';

@Module({
  controllers: [ElementsController],
  providers: [ElementsService, BoardRoleGuard],
  exports: [ElementsService],
})
export class ElementsModule {}
