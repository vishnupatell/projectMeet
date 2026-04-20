import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { parseDuration } from '../utils/helpers';
import { logger } from '../utils/logger';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });

    logger.info({ userId: user.id }, 'User registered');
    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);

    // Store session
    const refreshExpMs = parseDuration(config.jwt.refreshExpiration);
    await sessionRepository.create({
      user: { connect: { id: user.id } },
      refreshToken: tokens.refreshToken,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: new Date(Date.now() + refreshExpMs),
    });

    logger.info({ userId: user.id }, 'User logged in');
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await sessionRepository.deleteByRefreshToken(refreshToken);
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Delete old session
    await sessionRepository.deleteByRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = this.generateTokens(
      session.user.id,
      session.user.email,
      session.user.role,
    );

    // Create new session
    const refreshExpMs = parseDuration(config.jwt.refreshExpiration);
    await sessionRepository.create({
      user: { connect: { id: session.user.id } },
      refreshToken: tokens.refreshToken,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt: new Date(Date.now() + refreshExpMs),
    });

    return {
      ...tokens,
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        avatarUrl: session.user.avatarUrl,
        role: session.user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    await sessionRepository.deleteByRefreshToken(refreshToken);
    logger.info('User logged out');
  }

  async logoutAll(userId: string) {
    await sessionRepository.deleteAllForUser(userId);
    logger.info({ userId }, 'All sessions destroyed');
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  }

  private generateTokens(userId: string, email: string, role: string) {
    const accessToken = jwt.sign(
      { userId, email, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiration } as any,
    );

    const refreshToken = jwt.sign(
      { userId, email, role, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiration } as any,
    );

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
