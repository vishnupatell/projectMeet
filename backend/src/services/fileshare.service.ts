import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class FileShareService {
  async uploadFile(
    meetingId: string,
    userId: string,
    file: { filename: string; path: string; size: number; mimetype: string },
  ) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundError('Meeting');

    const sharedFile = await prisma.sharedFile.create({
      data: {
        meetingId,
        uploaderId: userId,
        filename: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
      include: {
        uploader: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    logger.info({ fileId: sharedFile.id, meetingId }, 'File shared in meeting');
    return sharedFile;
  }

  async getMeetingFiles(meetingId: string) {
    return prisma.sharedFile.findMany({
      where: { meetingId },
      include: {
        uploader: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFile(fileId: string, userId: string) {
    const file = await prisma.sharedFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.uploaderId !== userId) throw new ForbiddenError('Only the uploader can delete this file');

    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    await prisma.sharedFile.delete({ where: { id: fileId } });
    return { success: true };
  }

  getUploadDir() {
    return UPLOAD_DIR;
  }
}

export const fileShareService = new FileShareService();
