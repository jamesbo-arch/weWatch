import { Module } from '@nestjs/common';
import { R2Module } from '../../infra/r2/r2.module.js';
import { WatchfacesController } from './watchfaces.controller.js';
import { WatchfacesService } from './watchfaces.service.js';

@Module({
  imports: [R2Module],
  controllers: [WatchfacesController],
  providers: [WatchfacesService],
})
export class WatchfacesModule {}
