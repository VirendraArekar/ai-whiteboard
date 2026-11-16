import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWhiteboardDto {
  @ApiProperty({ example: 'Architecture Brainstorming', description: 'Whiteboard title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Design notes for Q4 roadmap', description: 'Optional description' })
  @IsString()
  @IsOptional()
  description?: string;
}
