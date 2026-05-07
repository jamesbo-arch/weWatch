import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// SEC-01: fail fast if required secrets are missing
if (!process.env['JWT_SECRET']) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  // SEC-02: parse cookies so JwtStrategy can read the httpOnly ww_token cookie
  app.use(cookieParser());

  // SEC-03: explicit CORS origin whitelist
  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:3000'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  await app.listen(process.env['PORT'] ?? 3001);
}

bootstrap();
