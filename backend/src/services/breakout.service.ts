import prisma from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class BreakoutRoomService {
  async createBreakoutRooms(
    meetingId: string,
    userId: string,
    rooms: { name: string; participantIds: string[] }[],
    duration?: number,
  ) {
    // Verify user is host
    const participant = await prisma.meetingParticipant.findFirst({
      where: { meetingId, userId, role: { in: ['HOST', 'CO_HOST'] } },
    });
    if (!participant) {
      throw new ForbiddenError('Only hosts can create breakout rooms');
    }

    const createdRooms = await Promise.all(
      rooms.map(async (room) => {
        return prisma.breakoutRoom.create({
          data: {
            meetingId,
            name: room.name,
            duration: duration || null,
            participants: {
              create: room.participantIds.map((uid) => ({ userId: uid })),
            },
          },
          include: { participants: true },
        });
      }),
    );

    logger.info({ meetingId, roomCount: createdRooms.length }, 'Breakout rooms created');
    return createdRooms;
  }

  async closeBreakoutRooms(meetingId: string, userId: string) {
    const participant = await prisma.meetingParticipant.findFirst({
      where: { meetingId, userId, role: { in: ['HOST', 'CO_HOST'] } },
    });
    if (!participant) {
      throw new ForbiddenError('Only hosts can close breakout rooms');
    }

    await prisma.breakoutRoom.updateMany({
      where: { meetingId, isActive: true },
      data: { isActive: false, closedAt: new Date() },
    });

    logger.info({ meetingId }, 'All breakout rooms closed');
    return { success: true };
  }

  async getBreakoutRooms(meetingId: string) {
    return prisma.breakoutRoom.findMany({
      where: { meetingId, isActive: true },
      include: { participants: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async moveParticipant(breakoutRoomId: string, userId: string, movedByUserId: string) {
    const room = await prisma.breakoutRoom.findUnique({
      where: { id: breakoutRoomId },
      include: { meeting: true },
    });
    if (!room) throw new NotFoundError('Breakout room');
    if (!room.isActive) throw new ValidationError('Breakout room is closed');

    // Verify host
    const participant = await prisma.meetingParticipant.findFirst({
      where: { meetingId: room.meetingId, userId: movedByUserId, role: { in: ['HOST', 'CO_HOST'] } },
    });
    if (!participant) throw new ForbiddenError('Only hosts can move participants');

    // Remove from all other rooms in this meeting
    await prisma.breakoutParticipant.deleteMany({
      where: {
        userId,
        breakoutRoom: { meetingId: room.meetingId },
      },
    });

    // Add to new room
    await prisma.breakoutParticipant.create({
      data: { breakoutRoomId, userId },
    });

    return { success: true };
  }

  async broadcastToRooms(meetingId: string, userId: string, message: string) {
    const participant = await prisma.meetingParticipant.findFirst({
      where: { meetingId, userId, role: { in: ['HOST', 'CO_HOST'] } },
    });
    if (!participant) throw new ForbiddenError('Only hosts can broadcast');

    // This returns the rooms; actual broadcast happens via Socket.IO
    const rooms = await prisma.breakoutRoom.findMany({
      where: { meetingId, isActive: true },
    });

    return { rooms, message };
  }
}

export const breakoutRoomService = new BreakoutRoomService();
