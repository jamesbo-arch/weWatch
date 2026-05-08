import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginSchema } from './dto/login.dto.js';
import { RegisterSchema } from './dto/register.dto.js';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds, matches JWT expiry

function setAuthCookie(res: Response, token: string) {
  res.cookie('ww_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: COOKIE_MAX_AGE * 1000, // express uses milliseconds
    path: '/',
  });
}

// SEC-04: stricter rate limit for auth endpoints — 5 attempts per 15 minutes per IP
@Throttle({ default: { ttl: 900_000, limit: 5 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = RegisterSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    const { token } = await this.authService.register(result.data);
    // SEC-02: set httpOnly cookie instead of returning token in body
    setAuthCookie(res, token);
    return { success: true };
  }

  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = LoginSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    const { token } = await this.authService.login(result.data);
    // SEC-02: set httpOnly cookie instead of returning token in body
    setAuthCookie(res, token);
    return { success: true };
  }
}
