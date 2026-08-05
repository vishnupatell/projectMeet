import prisma from '../config/database';
import { ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AdminService {
  async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          isActive: true,
          role: true,
          createdAt: true,
          _count: { select: { meetingsOwned: true, participants: true } },
        },
      }),
      prisma.user.count(),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserActive(adminUserId: string, targetUserId: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenError('Admin access required');

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new ForbiddenError('User not found');

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: !user.isActive },
    });

    logger.info({ adminUserId, targetUserId, isActive: updated.isActive }, 'User active status toggled');
    return updated;
  }

  async promoteToAdmin(adminUserId: string, targetUserId: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenError('Admin access required');

    return prisma.user.update({
      where: { id: targetUserId },
      data: { role: 'ADMIN' },
    });
  }

  async demoteFromAdmin(adminUserId: string, targetUserId: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenError('Admin access required');
    if (adminUserId === targetUserId) throw new ForbiddenError('Cannot demote yourself');

    return prisma.user.update({
      where: { id: targetUserId },
      data: { role: 'USER' },
    });
  }

  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      totalMeetings,
      activeMeetings,
      totalRecordings,
      totalMessages,
      storageUsed,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.meeting.count(),
      prisma.meeting.count({ where: { status: 'ACTIVE' } }),
      prisma.recording.count(),
      prisma.message.count(),
      prisma.recording.aggregate({ _sum: { fileSize: true } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalMeetings,
      activeMeetings,
      totalRecordings,
      totalMessages,
      storageUsedBytes: Number(storageUsed._sum.fileSize || 0),
    };
  }

  async getAuditLog(page: number = 1, limit: number = 50) {
    // Recent meetings as audit trail
    const skip = (page - 1) * limit;
    const meetings = await prisma.meeting.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { displayName: true, email: true } },
        _count: { select: { participants: true, recordings: true } },
      },
    });

    return meetings;
  }
}

export const adminService = new AdminService();
