import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { AuthModule } from '../auth/auth.module';
import { ElementsModule } from '../elements/elements.module';

@Module({
  imports: [AuthModule, ElementsModule],
  providers: [CollaborationGateway, CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
