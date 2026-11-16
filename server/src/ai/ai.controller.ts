import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiBrainstormDto } from './dto/ai-brainstorm.dto';
import { AiOutlineDto } from './dto/ai-outline.dto';
import { AiDiagramDto } from './dto/ai-diagram.dto';
import { AiChartDto } from './dto/ai-chart.dto';
import { AiEditDto } from './dto/ai-edit.dto';
import { AiSummaryDto } from './dto/ai-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardRoleGuard } from '../common/guards/board-role.guard';
import { RequireBoardRoles } from '../common/decorators/roles.decorator';
import { BoardRole } from '../common/enums/board-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI')
@ApiBearerAuth('bearer-jwt')
@UseGuards(JwtAuthGuard, BoardRoleGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('brainstorm')
  @RequireBoardRoles(BoardRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate brainstormed sticky notes using Gemini AI' })
  @ApiResponse({ status: 200, description: 'Brainstormed notes created' })
  async brainstorm(
    @CurrentUser('id') userId: string,
    @Body() dto: AiBrainstormDto,
  ) {
    return this.aiService.brainstorm(userId, dto);
  }

  @Post('outline')
  @RequireBoardRoles(BoardRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate structured roadmap or outline using Gemini AI' })
  @ApiResponse({ status: 200, description: 'Roadmap elements created' })
  async outline(
    @CurrentUser('id') userId: string,
    @Body() dto: AiOutlineDto,
  ) {
    return this.aiService.outline(userId, dto);
  }

  @Post('diagram')
  @RequireBoardRoles(BoardRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate architecture or flowchart diagram using Gemini AI' })
  @ApiResponse({ status: 200, description: 'Diagram components created' })
  async diagram(
    @CurrentUser('id') userId: string,
    @Body() dto: AiDiagramDto,
  ) {
    return this.aiService.diagram(userId, dto);
  }

  @Post('chart')
  @RequireBoardRoles(BoardRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate structured chart data and element using Gemini AI' })
  @ApiResponse({ status: 200, description: 'Chart element created' })
  async chart(
    @CurrentUser('id') userId: string,
    @Body() dto: AiChartDto,
  ) {
    return this.aiService.chart(userId, dto);
  }

  @Post('edit')
  @RequireBoardRoles(BoardRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rewrite, summarize, or improve selected elements using Gemini AI' })
  @ApiResponse({ status: 200, description: 'Elements updated with original IDs preserved' })
  async edit(
    @CurrentUser('id') userId: string,
    @Body() dto: AiEditDto,
  ) {
    return this.aiService.edit(userId, dto);
  }

  @Post('summary')
  @RequireBoardRoles(BoardRole.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate comprehensive board summary and action items using Gemini AI' })
  @ApiResponse({ status: 200, description: 'Summary generated' })
  async summary(
    @CurrentUser('id') userId: string,
    @Body() dto: AiSummaryDto,
  ) {
    return this.aiService.summary(userId, dto);
  }
}
