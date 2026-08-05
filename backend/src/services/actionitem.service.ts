import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class ActionItemService {
  async createActionItem(meetingId: string, data: { title: string; description?: string; assigneeId?: string; dueDate?: string }) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundError('Meeting');

    const actionItem = await prisma.actionItem.create({
      data: {
        meetingId,
        title: data.title,
        description: data.description || null,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    logger.info({ actionItemId: actionItem.id, meetingId }, 'Action item created');
    return actionItem;
  }

  async getMeetingActionItems(meetingId: string) {
    return prisma.actionItem.findMany({
      where: { meetingId },
      include: {
        assignee: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateActionItem(itemId: string, data: { title?: string; status?: string; assigneeId?: string; dueDate?: string }) {
    const item = await prisma.actionItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundError('Action item');

    return prisma.actionItem.update({
      where: { id: itemId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.status && { status: data.status as any }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      },
      include: {
        assignee: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async deleteActionItem(itemId: string) {
    const item = await prisma.actionItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundError('Action item');

    await prisma.actionItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  async extractFromTranscript(meetingId: string, transcript: string) {
    // This would typically call the AI service to extract action items
    // For now, we provide a placeholder that returns the raw items
    // The AI service endpoint /extract-actions handles the actual extraction
    logger.info({ meetingId }, 'Action item extraction requested');
    return { meetingId, transcript: transcript.substring(0, 200) };
  }
}

export const actionItemService = new ActionItemService();
