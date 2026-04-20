import {
  AuthTokenPayload,
  AuthTokens,
  AuthUserProfile,
  AuthUserRecord,
  AuthSessionRecord,
} from '../domain/auth.types';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
}

export interface AuthUserRepositoryPort {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: string): Promise<AuthUserProfile | null>;
  create(input: CreateUserInput): Promise<AuthUserRecord>;
}

export interface CreateSessionInput {
  userId: string;
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}

export interface AuthSessionRepositoryPort {
  create(input: CreateSessionInput): Promise<void>;
  findByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | null>;
  deleteByRefreshToken(refreshToken: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}

export interface PasswordHasherPort {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}

export interface TokenServicePort {
  generateTokens(payload: AuthTokenPayload): AuthTokens;
}

export interface ClockPort {
  now(): Date;
}
