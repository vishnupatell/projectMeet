import prisma from '../config/database';
import { logger } from '../utils/logger';

export class AnalyticsService {
  async initAnalytics(meetingId: string) {
    const existing = await prisma.meetingAnalytics.findUnique({ where: { meetingId } });
    if (existing) return existing;

    return prisma.meetingAnalytics.create({
      data: { meetingId, joinLeaveLog: [], speakingData: {} },
    });
  }

  async recordJoin(meetingId: string, userId: string) {
    const analytics = await this.getOrCreate(meetingId);
    const log = (analytics.joinLeaveLog as any[]) || [];
    log.push({ userId, action: 'join', timestamp: new Date().toISOString() });

    const activeCount = await prisma.meetingParticipant.count({
      where: { meetingId, leftAt: null },
    });

    await prisma.meetingAnalytics.update({
      where: { meetingId },
      data: {
        joinLeaveLog: log,
        totalParticipants: { increment: 1 },
        peakParticipants: Math.max(analytics.peakParticipants, activeCount),
      },
    });
  }

  async recordLeave(meetingId: string, userId: string) {
    const analytics = await this.getOrCreate(meetingId);
    const log = (analytics.joinLeaveLog as any[]) || [];
    log.push({ userId, action: 'leave', timestamp: new Date().toISOString() });

    await prisma.meetingAnalytics.update({
      where: { meetingId },
      data: { joinLeaveLog: log },
    });
  }

  async updateSpeakingTime(meetingId: string, userId: string, seconds: number) {
    const analytics = await this.getOrCreate(meetingId);
    const speakingData = (analytics.speakingData as Record<string, number>) || {};
    speakingData[userId] = (speakingData[userId] || 0) + seconds;

    await prisma.meetingAnalytics.update({
      where: { meetingId },
      data: { speakingData },
    });
  }

  async finalizeMeeting(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) return;

    const duration = meeting.startedAt && meeting.endedAt
      ? Math.round((meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 1000)
      : 0;

    await prisma.meetingAnalytics.upsert({
      where: { meetingId },
      update: { totalDuration: duration },
      create: { meetingId, totalDuration: duration, joinLeaveLog: [], speakingData: {} },
    });
  }

  async getAnalytics(meetingId: string) {
    return prisma.meetingAnalytics.findUnique({
      where: { meetingId },
      include: { meeting: { select: { title: true, startedAt: true, endedAt: true, code: true } } },
    });
  }

  async getAdminStats() {
    const [totalUsers, totalMeetings, activeMeetings, totalRecordings] = await Promise.all([
      prisma.user.count(),
      prisma.meeting.count(),
      prisma.meeting.count({ where: { status: 'ACTIVE' } }),
      prisma.recording.count(),
    ]);

    const recentMeetings = await prisma.meeting.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { displayName: true, email: true } }, _count: { select: { participants: true } } },
    });

    return { totalUsers, totalMeetings, activeMeetings, totalRecordings, recentMeetings };
  }

  private async getOrCreate(meetingId: string) {
    let analytics = await prisma.meetingAnalytics.findUnique({ where: { meetingId } });
    if (!analytics) {
      analytics = await prisma.meetingAnalytics.create({
        data: { meetingId, joinLeaveLog: [], speakingData: {} },
      });
    }
    return analytics;
  }
}

export const analyticsService = new AnalyticsService();
