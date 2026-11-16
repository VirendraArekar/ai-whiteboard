import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum AiChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  DONUT = 'donut',
}

export class AiChartDto {
  @ApiProperty({ description: 'Target whiteboard ID' })
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty({ example: 'Quarterly active users growth from Q1 to Q4' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ enum: AiChartType, default: AiChartType.BAR })
  @IsEnum(AiChartType)
  @IsOptional()
  chartType?: AiChartType = AiChartType.BAR;
}
