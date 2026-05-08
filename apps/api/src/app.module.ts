import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './infra/db/database.module.js';
import { R2Module } from './infra/r2/r2.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { WatchfacesModule } from './modules/watchfaces/watchfaces.module.js';
import { LicensesModule } from './modules/licenses/licenses.module.js';

@Module({
  imports: [
    // SEC-04: global rate limiting — 100 requests per minute per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    R2Module,
    AuthModule,
    WatchfacesModule,
    LicensesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
