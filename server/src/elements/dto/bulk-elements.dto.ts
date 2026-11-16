import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateElementDto } from './create-element.dto';

export class BulkUpdateItemDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  data?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  positionX?: number;

  @IsNumber()
  @IsOptional()
  positionY?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  rotation?: number;

  @IsNumber()
  @IsOptional()
  zIndex?: number;
}

export class BulkElementsDto {
  @ApiPropertyOptional({ type: [CreateElementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateElementDto)
  @IsOptional()
  create?: CreateElementDto[];

  @ApiPropertyOptional({ type: [BulkUpdateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateItemDto)
  @IsOptional()
  update?: BulkUpdateItemDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  delete?: string[];
}
