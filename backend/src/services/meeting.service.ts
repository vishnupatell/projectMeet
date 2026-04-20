import { meetingRepository } from '../repositories/meeting.repository';
import { chatRepository } from '../repositories/chat.repository';
import { CreateMeetingInput } from '../validators/meeting.validator';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { generateMeetingCode } from '../utils/helpers';
import { config } from '../config';
import { logger } from '../utils/logger';

export class MeetingService {
  async createMeeting(input: CreateMeetingInput, userId: string) {
    const code = generateMeetingCode();

    const meeting = await meetingRepository.create({
      title: input.title,
      description: input.description,
      code,
      owner: { connect: { id: userId } },
      scheduledAt: input.scheduledAt ?? null,
      maxParticipants: input.maxParticipants || 100,
      chat: {
        create: {
          type: 'GROUP',
          name: input.title,
          members: {
            create: [{ userId }],
          },
        },
      },
    });

    // Add owner as HOST participant
    await meetingRepository.addParticipant(meeting.id, userId, 'HOST');

    logger.info({ meetingId: meeting.id, code }, 'Meeting created');
    return meeting;
  }

  async getMeeting(meetingId: string) {
    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new NotFoundError('Meeting');
    }
    return meeting;
  }

  async getMeetingByCode(code: string) {
    const meeting = await meetingRepository.findByCode(code);
    if (!meeting) {
      throw new NotFoundError('Meeting');
    }
    return meeting;
  }

  async joinMeeting(code: string, userId: string) {
    const meeting = await meetingRepository.findByCode(code);
    if (!meeting) {
      throw new NotFoundError('Meeting');
    }

    if (meeting.status === 'ENDED' || meeting.status === 'CANCELLED') {
      throw new ValidationError('This meeting has ended');
    }

    // Check max participants
    const activeParticipants = await meetingRepository.getActiveParticipants(meeting.id);
    if (activeParticipants.length >= meeting.maxParticipants) {
      throw new ValidationError('Meeting is full');
    }

    // If meeting was scheduled, activate it when someone joins
    if (meeting.status === 'SCHEDULED') {
      await meetingRepository.updateStatus(meeting.id, 'ACTIVE');
    }

    await meetingRepository.addParticipant(meeting.id, userId, 'PARTICIPANT');

    // Add to meeting chat
    if (meeting.chat) {
      await chatRepository.addMember(meeting.chat.id, userId);
    }

    logger.info({ meetingId: meeting.id, userId }, 'User joined meeting');
    return meetingRepository.findById(meeting.id);
  }

  async leaveMeeting(meetingId: string, userId: string) {
    await meetingRepository.removeParticipant(meetingId, userId);

    // Check if meeting should be ended
    const activeParticipants = await meetingRepository.getActiveParticipants(meetingId);
    if (activeParticipants.length === 0) {
      await meetingRepository.updateStatus(meetingId, 'ENDED');
      logger.info({ meetingId }, 'Meeting ended - no participants');
    }

    logger.info({ meetingId, userId }, 'User left meeting');
  }

  async endMeeting(meetingId: string, userId: string) {
    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new NotFoundError('Meeting');
    }
    if (meeting.ownerId !== userId) {
      throw new ForbiddenError('Only the host can end the meeting');
    }

    await meetingRepository.updateStatus(meetingId, 'ENDED');
    logger.info({ meetingId }, 'Meeting ended by host');
    return meeting;
  }

  async getUserMeetings(userId: string) {
    return meetingRepository.findUserMeetings(userId);
  }

  getIceServers() {
    return [
      { urls: config.ice.stunUrl },
      {
        urls: config.ice.turnUrl,
        username: config.ice.turnUsername,
        credential: config.ice.turnPassword,
      },
    ];
  }
}

export const meetingService = new MeetingService();
