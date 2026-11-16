import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum WhiteboardTab {
  ALL = 'all',
  MINE = 'mine',
  SHARED = 'shared',
  RECENT = 'recent',
}

export enum WhiteboardSortBy {
  UPDATED_AT = 'updatedAt',
  CREATED_AT = 'createdAt',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryWhiteboardsDto {
  @ApiPropertyOptional({ enum: WhiteboardTab, default: WhiteboardTab.ALL })
  @IsEnum(WhiteboardTab)
  @IsOptional()
  tab?: WhiteboardTab = WhiteboardTab.ALL;

  @ApiPropertyOptional({ description: 'Search term for title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: WhiteboardSortBy, default: WhiteboardSortBy.UPDATED_AT })
  @IsEnum(WhiteboardSortBy)
  @IsOptional()
  sortBy?: WhiteboardSortBy = WhiteboardSortBy.UPDATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder = SortOrder.DESC;
}
