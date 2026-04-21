import prisma from '../config/database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { mailService } from './mail.service';

interface InviteContext {
  meetingId: string;
  meetingCode: string;
  meetingTitle: string;
  scheduledAt: Date | null;
  inviterName: string;
  emails: string[];
}

function buildMeetingLink(code: string): string {
  return `${config.appUrl.replace(/\/$/, '')}/meeting/${code}`;
}

function formatWhen(scheduledAt: Date | null): string {
  if (!scheduledAt) return 'Starting now';
  return scheduledAt.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

function renderEmail(ctx: {
  meetingTitle: string;
  meetingLink: string;
  when: string;
  inviterName: string;
}) {
  const text = [
    `${ctx.inviterName} invited you to a ProjectMeet meeting.`,
    '',
    `Title: ${ctx.meetingTitle}`,
    `When: ${ctx.when}`,
    `Join: ${ctx.meetingLink}`,
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 8px; color: #0A4E5E;">You're invited to a meeting</h2>
      <p style="color: #1F3138; margin: 0 0 16px;">
        <strong>${escapeHtml(ctx.inviterName)}</strong> invited you to join
        <strong>${escapeHtml(ctx.meetingTitle)}</strong>.
      </p>
      <p style="color: #1F3138; margin: 0 0 24px;">
        <strong>When:</strong> ${escapeHtml(ctx.when)}
      </p>
      <a href="${ctx.meetingLink}"
         style="display: inline-block; background: #0F758C; color: #fff; text-decoration: none;
                padding: 12px 20px; border-radius: 10px; font-weight: 600;">
        Join meeting
      </a>
      <p style="color: #68818B; font-size: 12px; margin-top: 24px;">
        Or paste this link into your browser:<br />
        <a href="${ctx.meetingLink}" style="color: #0F758C;">${ctx.meetingLink}</a>
      </p>
    </div>
  `;

  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class InvitationService {
  /**
   * Persist invitation rows (PENDING), pre-provision registered invitees as
   * meeting participants so they see the meeting in their list immediately,
   * then send emails in the background. Returns fast.
   */
  async inviteEmails(ctx: InviteContext): Promise<void> {
    const uniqueEmails = Array.from(
      new Set(ctx.emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
    );
    if (uniqueEmails.length === 0) return;

    await prisma.meetingInvitation.createMany({
      data: uniqueEmails.map((email) => ({
        meetingId: ctx.meetingId,
        email,
        status: 'PENDING' as const,
      })),
      skipDuplicates: true,
    });

    await this.linkRegisteredInvitees(ctx.meetingId, uniqueEmails);

    void this.sendAll(ctx, uniqueEmails);
  }

  /**
   * For each email that matches an existing User, add them as a PARTICIPANT
   * of the meeting (and as a member of the meeting chat). Idempotent.
   */
  private async linkRegisteredInvitees(meetingId: string, emails: string[]): Promise<void> {
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true },
    });
    if (users.length === 0) return;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, chat: { select: { id: true } } },
    });
    if (!meeting) return;

    await Promise.all(
      users.map(async (u) => {
        try {
          await prisma.meetingParticipant.upsert({
            where: { meetingId_userId: { meetingId, userId: u.id } },
            update: {},
            create: { meetingId, userId: u.id, role: 'PARTICIPANT' },
          });
          if (meeting.chat) {
            await prisma.chatMember.upsert({
              where: { chatId_userId: { chatId: meeting.chat.id, userId: u.id } },
              update: {},
              create: { chatId: meeting.chat.id, userId: u.id },
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          logger.error(
            { meetingId, userId: u.id, err: message },
            'Failed to link invited user as participant',
          );
        }
      }),
    );
  }

  /**
   * Called on user registration. If this email had pending invitations,
   * enroll the new user as a participant in each of those meetings.
   */
  async attachPendingInvitationsToUser(userId: string, email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const invitations = await prisma.meetingInvitation.findMany({
      where: { email: normalized },
      select: { meetingId: true },
    });
    if (invitations.length === 0) return;

    await Promise.all(
      invitations.map(async ({ meetingId }) => {
        try {
          const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { chat: { select: { id: true } } },
          });
          if (!meeting) return;

          await prisma.meetingParticipant.upsert({
            where: { meetingId_userId: { meetingId, userId } },
            update: {},
            create: { meetingId, userId, role: 'PARTICIPANT' },
          });
          if (meeting.chat) {
            await prisma.chatMember.upsert({
              where: { chatId_userId: { chatId: meeting.chat.id, userId } },
              update: {},
              create: { chatId: meeting.chat.id, userId },
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          logger.error(
            { meetingId, userId, err: message },
            'Failed to attach pending invitation on registration',
          );
        }
      }),
    );
    logger.info(
      { userId, count: invitations.length },
      'Attached pending meeting invitations to new user',
    );
  }

  private async sendAll(ctx: InviteContext, emails: string[]): Promise<void> {
    const meetingLink = buildMeetingLink(ctx.meetingCode);
    const when = formatWhen(ctx.scheduledAt);
    const subject = ctx.scheduledAt
      ? `Invitation: ${ctx.meetingTitle} — ${when}`
      : `${ctx.inviterName} is inviting you to a meeting`;

    const { text, html } = renderEmail({
      meetingTitle: ctx.meetingTitle,
      meetingLink,
      when,
      inviterName: ctx.inviterName,
    });

    await Promise.all(
      emails.map(async (email) => {
        try {
          await mailService.send({ to: email, subject, text, html });
          await prisma.meetingInvitation.updateMany({
            where: { meetingId: ctx.meetingId, email },
            data: { status: 'SENT', sentAt: new Date(), errorMsg: null },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          logger.error(
            { email, meetingId: ctx.meetingId, err: message },
            'Failed to send meeting invitation',
          );
          await prisma.meetingInvitation.updateMany({
            where: { meetingId: ctx.meetingId, email },
            data: { status: 'FAILED', errorMsg: message },
          });
        }
      }),
    );
  }
}

export const invitationService = new InvitationService();
