import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ActivateSchema, CheckQuerySchema } from './dto/licenses.dto.js';
import { LicensesService } from './licenses.service.js';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('activate')
  async activate(@Body() body: unknown) {
    const result = ActivateSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    return this.licensesService.activate(result.data.deviceSerial, result.data.watchfaceId);
  }

  @Get('check')
  async check(@Query() query: unknown) {
    const result = CheckQuerySchema.safeParse(query);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    return this.licensesService.check(result.data.deviceSerial, result.data.watchfaceId);
  }
}
