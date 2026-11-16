import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateElementDto {
  @ApiPropertyOptional({ example: 'rectangle' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Updated JSON data' })
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({ example: 120 })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ example: 140 })
  @IsNumber()
  @IsOptional()
  positionY?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @IsOptional()
  rotation?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  zIndex?: number;
}
