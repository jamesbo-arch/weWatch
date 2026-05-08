import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { ListWatchfacesQuerySchema } from './dto/list-watchfaces.dto.js';
import { UploadWatchfaceSchema } from './dto/upload-watchface.dto.js';
import { WatchfacesService } from './watchfaces.service.js';

interface AuthRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@Controller('watchfaces')
export class WatchfacesController {
  constructor(private readonly watchfacesService: WatchfacesService) {}

  @Get()
  async list(@Query() query: unknown) {
    const result = ListWatchfacesQuerySchema.safeParse(query);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    return this.watchfacesService.list(result.data);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'prg', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      // SEC-06: enforce file size limits at the Multer layer, before buffering into memory
      { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 2 } },
    ),
  )
  async upload(
    @Req() req: AuthRequest,
    @Body() body: unknown,
    @UploadedFiles()
    files: { prg?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    const parsed = UploadWatchfaceSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const prgFile = files.prg?.[0];
    const thumbnailFile = files.thumbnail?.[0];
    if (!prgFile) throw new BadRequestException('PRG file is required');
    if (!thumbnailFile) throw new BadRequestException('Thumbnail is required');

    return this.watchfacesService.upload(req.user.userId, parsed.data, prgFile, thumbnailFile);
  }
}
