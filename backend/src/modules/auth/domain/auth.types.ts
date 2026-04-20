import { UserRole } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface AuthUserRecord extends AuthenticatedUser {
  isActive: boolean;
  passwordHash: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthSessionRecord {
  user: AuthenticatedUser;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}

export interface AuthLoginResult extends AuthTokens {
  user: AuthenticatedUser;
}

export interface SessionDeviceMeta {
  userAgent?: string;
  ipAddress?: string;
}
