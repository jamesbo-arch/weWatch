import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { DB_TOKEN } from '../../infra/db/database.module.js';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Thenable chain: all methods return the same chain, which can be awaited at any step.
function makeChain(result: unknown) {
  const chain = {} as Record<string, unknown>;
  chain['then'] = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  chain['catch'] = (rej: (e: unknown) => unknown) => Promise.resolve(result).catch(rej);
  for (const m of ['from', 'where', 'leftJoin', 'orderBy', 'limit', 'offset', 'values', 'returning']) {
    chain[m] = vi.fn(() => chain);
  }
  return chain;
}

const MOCK_USER = {
  id: 'user-uuid-1',
  email: 'designer@test.com',
  passwordHash: 'hashed',
  role: 'designer',
  locale: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let mockDb: { select: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> };
  let mockJwt: { sign: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDb = { select: vi.fn(), insert: vi.fn() };
    mockJwt = { sign: vi.fn().mockReturnValue('signed-token') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DB_TOKEN, useValue: mockDb },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates user + designer and returns JWT token', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([])); // email check → not found
      const newUser = { id: MOCK_USER.id, email: MOCK_USER.email, role: MOCK_USER.role };
      mockDb.insert
        .mockReturnValueOnce(makeChain([newUser])) // users insert
        .mockReturnValueOnce(makeChain([]));        // designers insert

      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-pw' as never);

      const result = await service.register({
        email: 'designer@test.com',
        password: 'password123',
        brandName: 'My Studio',
      });

      expect(result).toEqual({ token: 'signed-token' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockJwt.sign).toHaveBeenCalledWith({ sub: newUser.id, email: newUser.email, role: newUser.role });
    });

    it('throws ConflictException when email already exists', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([{ id: 'existing-id' }]));

      await expect(
        service.register({ email: 'taken@test.com', password: 'password123', brandName: 'Studio' }),
      ).rejects.toThrow(ConflictException);
    });

    it('does not call insert when email already exists', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([{ id: 'existing-id' }]));

      await expect(
        service.register({ email: 'taken@test.com', password: 'pw12345678', brandName: 'S' }),
      ).rejects.toThrow(ConflictException);

      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns JWT token for correct credentials', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_USER]));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login({ email: MOCK_USER.email, password: 'password123' });

      expect(result).toEqual({ token: 'signed-token' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', MOCK_USER.passwordHash);
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([]));

      await expect(
        service.login({ email: 'ghost@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([MOCK_USER]));
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({ email: MOCK_USER.email, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns same error message for missing user vs wrong password (prevents enumeration)', async () => {
      mockDb.select.mockReturnValueOnce(makeChain([]));
      let err1: Error | null = null;
      try { await service.login({ email: 'no@test.com', password: 'pw' }); }
      catch (e) { err1 = e as Error; }

      mockDb.select.mockReturnValueOnce(makeChain([MOCK_USER]));
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      let err2: Error | null = null;
      try { await service.login({ email: MOCK_USER.email, password: 'bad' }); }
      catch (e) { err2 = e as Error; }

      expect(err1?.message).toBe(err2?.message);
    });
  });
});
