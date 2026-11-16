import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Body,
  Res,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiBearerAuth('bearer-jwt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload an image file (max 5MB, JPG/PNG/SVG/WebP/GIF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        whiteboardId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('whiteboardId') whiteboardId?: string,
  ) {
    return this.uploadsService.handleUpload(userId, file, whiteboardId);
  }

  @Get('file/*key')
  @ApiOperation({ summary: 'Proxy stream an uploaded asset from object storage' })
  async streamFile(
    @Param('key') keyParam: string | string[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let storageKey = '';
    if (Array.isArray(keyParam)) {
      storageKey = keyParam.join('/');
    } else if (typeof keyParam === 'string' && keyParam.length > 0) {
      storageKey = keyParam;
    } else {
      const rawUrl = req.originalUrl || req.url;
      storageKey = rawUrl.includes('/api/uploads/file/') ? rawUrl.split('/api/uploads/file/')[1]?.split('?')[0] : '';
    }

    if (!storageKey) {
      throw new NotFoundException('Storage key required');
    }

    try {
      const { stream, contentType } = await this.uploadsService.getFileStream(decodeURIComponent(storageKey));
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      stream.pipe(res);
    } catch {
      throw new NotFoundException('File not found in storage');
    }
  }
}
