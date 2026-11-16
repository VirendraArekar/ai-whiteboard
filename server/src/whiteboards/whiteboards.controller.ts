import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WhiteboardsService } from './whiteboards.service';
import { CreateWhiteboardDto } from './dto/create-whiteboard.dto';
import { UpdateWhiteboardDto } from './dto/update-whiteboard.dto';
import { QueryWhiteboardsDto } from './dto/query-whiteboards.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardRoleGuard } from '../common/guards/board-role.guard';
import { RequireBoardRoles } from '../common/decorators/roles.decorator';
import { BoardRole } from '../common/enums/board-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Whiteboards')
@ApiBearerAuth('bearer-jwt')
@UseGuards(JwtAuthGuard, BoardRoleGuard)
@Controller('whiteboards')
export class WhiteboardsController {
  constructor(private readonly whiteboardsService: WhiteboardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new whiteboard' })
  @ApiResponse({ status: 201, description: 'Whiteboard created' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWhiteboardDto,
  ) {
    return this.whiteboardsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List whiteboards with filtering and search' })
  @ApiResponse({ status: 200, description: 'List of whiteboards' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryWhiteboardsDto,
  ) {
    return this.whiteboardsService.findAll(userId, query);
  }

  @Get(':boardId')
  @RequireBoardRoles(BoardRole.VIEWER)
  @ApiOperation({ summary: 'Get whiteboard details and elements' })
  @ApiResponse({ status: 200, description: 'Whiteboard loaded' })
  async findOne(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whiteboardsService.findOne(boardId, userId);
  }

  @Patch(':boardId')
  @RequireBoardRoles(BoardRole.EDITOR)
  @ApiOperation({ summary: 'Update whiteboard metadata' })
  @ApiResponse({ status: 200, description: 'Whiteboard updated' })
  async update(
    @Param('boardId') boardId: string,
    @Body() dto: UpdateWhiteboardDto,
  ) {
    return this.whiteboardsService.update(boardId, dto);
  }

  @Delete(':boardId')
  @RequireBoardRoles(BoardRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete whiteboard' })
  @ApiResponse({ status: 200, description: 'Whiteboard deleted' })
  async delete(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whiteboardsService.delete(boardId, userId);
  }

  @Post(':boardId/duplicate')
  @RequireBoardRoles(BoardRole.VIEWER)
  @ApiOperation({ summary: 'Duplicate whiteboard and all canvas elements' })
  @ApiResponse({ status: 201, description: 'Whiteboard duplicated' })
  async duplicate(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whiteboardsService.duplicate(boardId, userId);
  }

  @Get(':boardId/members')
  @RequireBoardRoles(BoardRole.VIEWER)
  @ApiOperation({ summary: 'Get members of whiteboard' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getMembers(@Param('boardId') boardId: string) {
    return this.whiteboardsService.getMembers(boardId);
  }

  @Post(':boardId/members')
  @RequireBoardRoles(BoardRole.EDITOR)
  @ApiOperation({ summary: 'Invite member to whiteboard by email' })
  @ApiResponse({ status: 201, description: 'Member invited' })
  async addMember(
    @Param('boardId') boardId: string,
    @CurrentUser('id') inviterId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.whiteboardsService.addMember(boardId, inviterId, dto);
  }

  @Patch(':boardId/members/:memberId')
  @RequireBoardRoles(BoardRole.OWNER)
  @ApiOperation({ summary: 'Update member role (OWNER only)' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  async updateMemberRole(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.whiteboardsService.updateMemberRole(boardId, memberId, dto);
  }

  @Delete(':boardId/members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove member from whiteboard' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whiteboardsService.removeMember(boardId, memberId, userId);
  }
}
