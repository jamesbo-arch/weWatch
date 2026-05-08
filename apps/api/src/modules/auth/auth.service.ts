import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { Db } from '../../infra/db/client.js';
import { DB_TOKEN } from '../../infra/db/database.module.js';
import { designers, users } from '../../infra/db/schema/index.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ token: string }> {
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);
    if (existing.length > 0) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const [user] = await this.db
      .insert(users)
      .values({ email: dto.email, passwordHash, role: 'designer' })
      .returning({ id: users.id, email: users.email, role: users.role });
    if (!user) throw new Error('Failed to create user');

    await this.db.insert(designers).values({ userId: user.id, brandName: dto.brandName });

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return { token };
  }

  async login(dto: LoginDto): Promise<{ token: string }> {
    // SEC-08: select only needed columns — never pull the full row into memory
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return { token };
  }
}
