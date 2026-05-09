import { BadRequestException, Body, Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ActivateSchema, CheckQuerySchema } from './dto/licenses.dto.js';
import { LicensesService } from './licenses.service.js';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('activate')
  async activate(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = ActivateSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    const { isNew, ...data } = await this.licensesService.activate(result.data.deviceSerial, result.data.watchfaceId);
    res.status(isNew ? HttpStatus.CREATED : HttpStatus.OK);
    return data;
  }

  @Get('check')
  async check(@Query() query: unknown) {
    const result = CheckQuerySchema.safeParse(query);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    return this.licensesService.check(result.data.deviceSerial, result.data.watchfaceId);
  }
}
