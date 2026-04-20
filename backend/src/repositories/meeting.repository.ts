import prisma from '../config/database';
import { Prisma, MeetingStatus } from '@prisma/client';

export class MeetingRepository {
  async findById(id: string) {
    return prisma.meeting.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
        chat: true,
      },
    });
  }

  async findByCode(code: string) {
    return prisma.meeting.findUnique({
      where: { code },
      include: {
        owner: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
        chat: true,
      },
    });
  }

  async create(data: Prisma.MeetingCreateInput) {
    return prisma.meeting.create({
      data,
      include: {
        owner: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        chat: true,
      },
    });
  }

  async update(id: string, data: Prisma.MeetingUpdateInput) {
    return prisma.meeting.update({
      where: { id },
      data,
    });
  }

  async findByOwner(ownerId: string) {
    return prisma.meeting.findMany({
      where: { ownerId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUserMeetings(userId: string) {
    return prisma.meeting.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { participants: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addParticipant(meetingId: string, userId: string, role: 'HOST' | 'CO_HOST' | 'PARTICIPANT' = 'PARTICIPANT') {
    return prisma.meetingParticipant.upsert({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      update: { leftAt: null },
      create: {
        meetingId,
        userId,
        role,
      },
    });
  }

  async removeParticipant(meetingId: string, userId: string) {
    return prisma.meetingParticipant.updateMany({
      where: { meetingId, userId },
      data: { leftAt: new Date() },
    });
  }

  async getActiveParticipants(meetingId: string) {
    return prisma.meetingParticipant.findMany({
      where: { meetingId, leftAt: null },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async updateStatus(id: string, status: MeetingStatus) {
    const updateData: Prisma.MeetingUpdateInput = { status };
    if (status === 'ACTIVE') updateData.startedAt = new Date();
    if (status === 'ENDED') updateData.endedAt = new Date();
    return prisma.meeting.update({ where: { id }, data: updateData });
  }
}

export const meetingRepository = new MeetingRepository();
