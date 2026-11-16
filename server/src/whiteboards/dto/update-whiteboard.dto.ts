import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWhiteboardDto {
  @ApiPropertyOptional({ example: 'Updated Board Title' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated board description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://storage.../thumb.png' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}
