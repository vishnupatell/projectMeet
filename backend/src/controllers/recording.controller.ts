import { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { recordingService } from '../services/recording.service';
import { transcriptService } from '../services/transcript.service';
import { ValidationError } from '../utils/errors';

export class RecordingController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) throw new ValidationError('No file uploaded');

      const meetingId = typeof req.body.meetingId === 'string' ? req.body.meetingId : undefined;
      const startedAt = typeof req.body.startedAt === 'string' ? req.body.startedAt : undefined;
      if (!meetingId) throw new ValidationError('meetingId is required');

      const recording = await recordingService.saveRecording({
        meetingId,
        recordedById: req.user!.userId,
        filename: file.originalname || file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
      });

      await transcriptService.ensureForRecording(recording.id);
      transcriptService.processRecordingAsync(recording.id);

      res.status(201).json({ success: true, data: recording });
    } catch (error) {
      next(error);
    }
  }

  async getMeetingRecordings(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = String(req.params.meetingId);
      const recordings = await recordingService.getMeetingRecordings(meetingId);
      res.json({ success: true, data: recordings });
    } catch (error) {
      next(error);
    }
  }

  async getUserRecordings(req: Request, res: Response, next: NextFunction) {
    try {
      const recordings = await recordingService.getUserRecordings(req.user!.userId);
      res.json({ success: true, data: recordings });
    } catch (error) {
      next(error);
    }
  }

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const recording = await recordingService.getRecording(String(req.params.id));
      if (!fs.existsSync(recording.filePath)) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not found on disk' } });
        return;
      }
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(recording.filename)}"`);
      res.setHeader('Content-Type', recording.mimeType);
      fs.createReadStream(recording.filePath).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async deleteRecording(req: Request, res: Response, next: NextFunction) {
    try {
      await recordingService.deleteRecording(String(req.params.id), req.user!.userId);
      res.json({ success: true, message: 'Recording deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const recordingController = new RecordingController();
