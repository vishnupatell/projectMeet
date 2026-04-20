import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class SessionRepository {
  async create(data: Prisma.SessionCreateInput) {
    return prisma.session.create({ data });
  }

  async findByRefreshToken(refreshToken: string) {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  }

  async deleteByRefreshToken(refreshToken: string) {
    return prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  async deleteAllForUser(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}

export const sessionRepository = new SessionRepository();
