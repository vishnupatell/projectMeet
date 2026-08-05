import prisma from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class PollService {
  async createPoll(meetingId: string, userId: string, data: { question: string; options: string[]; isAnonymous?: boolean }) {
    // Verify user is host/co-host
    const participant = await prisma.meetingParticipant.findFirst({
      where: { meetingId, userId, role: { in: ['HOST', 'CO_HOST'] } },
    });
    if (!participant) {
      throw new ForbiddenError('Only hosts can create polls');
    }

    const options = data.options.map((text, idx) => ({ id: `opt_${idx}`, text }));

    const poll = await prisma.poll.create({
      data: {
        meetingId,
        question: data.question,
        options,
        isAnonymous: data.isAnonymous || false,
      },
      include: { votes: true },
    });

    logger.info({ pollId: poll.id, meetingId }, 'Poll created');
    return poll;
  }

  async votePoll(pollId: string, userId: string, optionId: string) {
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) throw new NotFoundError('Poll');
    if (!poll.isActive) throw new ValidationError('Poll is closed');

    // Validate option exists
    const options = poll.options as Array<{ id: string; text: string }>;
    if (!options.find((o) => o.id === optionId)) {
      throw new ValidationError('Invalid option');
    }

    const vote = await prisma.pollVote.upsert({
      where: { pollId_userId: { pollId, userId } },
      update: { optionId },
      create: { pollId, userId, optionId },
    });

    return vote;
  }

  async closePoll(pollId: string, userId: string) {
    const poll = await prisma.poll.findUnique({ where: { id: pollId }, include: { meeting: true } });
    if (!poll) throw new NotFoundError('Poll');

    const participant = await prisma.meetingParticipant.findFirst({
      where: { meetingId: poll.meetingId, userId, role: { in: ['HOST', 'CO_HOST'] } },
    });
    if (!participant) throw new ForbiddenError('Only hosts can close polls');

    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { isActive: false, closedAt: new Date() },
      include: { votes: true },
    });

    return updated;
  }

  async getPollResults(pollId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { votes: { include: { user: { select: { id: true, displayName: true } } } } },
    });
    if (!poll) throw new NotFoundError('Poll');

    const options = poll.options as Array<{ id: string; text: string }>;
    const results = options.map((opt) => ({
      ...opt,
      votes: poll.votes.filter((v) => v.optionId === opt.id).length,
      voters: poll.isAnonymous ? [] : poll.votes.filter((v) => v.optionId === opt.id).map((v) => v.user),
    }));

    return { ...poll, results };
  }

  async getMeetingPolls(meetingId: string) {
    return prisma.poll.findMany({
      where: { meetingId },
      include: { votes: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const pollService = new PollService();
