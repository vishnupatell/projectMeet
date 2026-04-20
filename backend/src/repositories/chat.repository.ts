import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class ChatRepository {
  async findById(id: string) {
    return prisma.chat.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async findByMeetingId(meetingId: string) {
    return prisma.chat.findUnique({
      where: { meetingId },
    });
  }

  async create(data: Prisma.ChatCreateInput) {
    return prisma.chat.create({
      data,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async createForMeeting(meetingId: string, memberIds: string[]) {
    return prisma.chat.create({
      data: {
        meetingId,
        type: 'GROUP',
        members: {
          create: memberIds.map((userId) => ({ userId })),
        },
      },
    });
  }

  async addMember(chatId: string, userId: string) {
    return prisma.chatMember.upsert({
      where: {
        chatId_userId: { chatId, userId },
      },
      update: {},
      create: { chatId, userId },
    });
  }

  async getUserChats(userId: string) {
    return prisma.chat.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, displayName: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(chatId: string, cursor?: string, limit: number = 50) {
    return prisma.message.findMany({
      where: { chatId },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async createMessage(data: Prisma.MessageCreateInput) {
    return prisma.message.create({
      data,
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }
}

export const chatRepository = new ChatRepository();
