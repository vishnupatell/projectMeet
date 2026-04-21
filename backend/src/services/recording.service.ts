import path from 'node:path';
import fs from 'node:fs';
import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

const RECORDINGS_DIR = process.env.RECORDINGS_DIR || path.join(process.cwd(), 'recordings');

export function ensureRecordingsDir() {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
}

export function getRecordingsDir() {
  return RECORDINGS_DIR;
}

export class RecordingService {
  async saveRecording(params: {
    meetingId: string;
    recordedById: string;
    filename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    startedAt: Date;
  }) {
    const recording = await prisma.recording.create({
      data: {
        meetingId: params.meetingId,
        recordedById: params.recordedById,
        filename: params.filename,
        filePath: params.filePath,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        status: 'READY',
        startedAt: params.startedAt,
        endedAt: new Date(),
      },
      include: {
        recordedBy: { select: { id: true, displayName: true, avatarUrl: true } },
        meeting: { select: { id: true, title: true, code: true } },
      },
    });

    logger.info({ recordingId: recording.id, meetingId: params.meetingId }, 'Recording saved');
    return recording;
  }

  async getMeetingRecordings(meetingId: string) {
    return prisma.recording.findMany({
      where: { meetingId },
      include: {
        recordedBy: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserRecordings(userId: string) {
    return prisma.recording.findMany({
      where: { recordedById: userId },
      include: {
        meeting: { select: { id: true, title: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecording(recordingId: string) {
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      include: {
        recordedBy: { select: { id: true, displayName: true, avatarUrl: true } },
        meeting: { select: { id: true, title: true, code: true, ownerId: true } },
      },
    });
    if (!recording) throw new NotFoundError('Recording');
    return recording;
  }

  async deleteRecording(recordingId: string, userId: string) {
    const recording = await this.getRecording(recordingId);
    if (recording.recordedById !== userId && recording.meeting.ownerId !== userId) {
      throw new ForbiddenError('Not authorized to delete this recording');
    }

    // Delete file from disk
    if (fs.existsSync(recording.filePath)) {
      fs.unlinkSync(recording.filePath);
    }

    await prisma.recording.delete({ where: { id: recordingId } });
    logger.info({ recordingId }, 'Recording deleted');
  }
}

export const recordingService = new RecordingService();
