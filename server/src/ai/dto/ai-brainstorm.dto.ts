import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AiBrainstormDto {
  @ApiProperty({ description: 'Target whiteboard ID' })
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty({ example: 'Growth hacking strategies for B2B AI SaaS app' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ example: 6, default: 6 })
  @IsNumber()
  @Min(2)
  @Max(16)
  @IsOptional()
  count?: number = 6;
}
