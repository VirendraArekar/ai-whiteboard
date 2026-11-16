import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AiOutlineDto {
  @ApiProperty({ description: 'Target whiteboard ID' })
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty({ example: 'Q1-Q4 Product Engineering Roadmap with 4 milestones' })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
