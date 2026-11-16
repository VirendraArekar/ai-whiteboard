import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ElementsService } from './elements.service';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { BulkElementsDto } from './dto/bulk-elements.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardRoleGuard } from '../common/guards/board-role.guard';
import { RequireBoardRoles } from '../common/decorators/roles.decorator';
import { BoardRole } from '../common/enums/board-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Elements')
@ApiBearerAuth('bearer-jwt')
@UseGuards(JwtAuthGuard, BoardRoleGuard)
@Controller('whiteboards/:boardId/elements')
export class ElementsController {
  constructor(private readonly elementsService: ElementsService) {}

  @Get()
  @RequireBoardRoles(BoardRole.VIEWER)
  @ApiOperation({ summary: 'Get all canvas elements for a whiteboard' })
  @ApiResponse({ status: 200, description: 'List of elements' })
  async findAll(@Param('boardId') boardId: string) {
    return this.elementsService.findAll(boardId);
  }

  @Post()
  @RequireBoardRoles(BoardRole.EDITOR)
  @ApiOperation({ summary: 'Create a single whiteboard element' })
  @ApiResponse({ status: 201, description: 'Element created' })
  async create(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateElementDto,
  ) {
    return this.elementsService.create(boardId, userId, dto);
  }

  @Post('bulk')
  @RequireBoardRoles(BoardRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk create, update, and delete elements in a transaction' })
  @ApiResponse({ status: 200, description: 'Bulk operation committed' })
  async bulkOperations(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BulkElementsDto,
  ) {
    return this.elementsService.bulkOperations(boardId, userId, dto);
  }

  @Patch(':elementId')
  @RequireBoardRoles(BoardRole.EDITOR)
  @ApiOperation({ summary: 'Update an existing element' })
  @ApiResponse({ status: 200, description: 'Element updated' })
  async update(
    @Param('boardId') boardId: string,
    @Param('elementId') elementId: string,
    @Body() dto: UpdateElementDto,
  ) {
    return this.elementsService.update(boardId, elementId, dto);
  }

  @Delete(':elementId')
  @RequireBoardRoles(BoardRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an element' })
  @ApiResponse({ status: 200, description: 'Element deleted' })
  async delete(
    @Param('boardId') boardId: string,
    @Param('elementId') elementId: string,
  ) {
    return this.elementsService.delete(boardId, elementId);
  }
}
