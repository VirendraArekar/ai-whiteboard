import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AiDiagramDto {
  @ApiProperty({ description: 'Target whiteboard ID' })
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty({ example: 'Microservices architecture with API Gateway, Auth Service, Order Service, and PostgreSQL' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ example: 'architecture', default: 'flowchart' })
  @IsString()
  @IsOptional()
  diagramType?: string = 'flowchart';
}
