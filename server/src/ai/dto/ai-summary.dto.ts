import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AiSummaryDto {
  @ApiProperty({ description: 'Target whiteboard ID' })
  @IsUUID()
  @IsNotEmpty()
  boardId: string;
}
