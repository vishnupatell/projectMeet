import { Request, Response, NextFunction } from 'express';
import { transcriptService } from '../services/transcript.service';
import { recordingService } from '../services/recording.service';
import { NotFoundError } from '../utils/errors';

export class TranscriptController {
  async getByRecording(req: Request, res: Response, next: NextFunction) {
    try {
      const transcript = await transcriptService.getByRecordingId(String(req.params.recordingId));
      if (!transcript) throw new NotFoundError('Transcript');
      res.json({ success: true, data: transcript });
    } catch (err) {
      next(err);
    }
  }

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const recording = await recordingService.getRecording(String(req.params.recordingId));
      const transcript = await transcriptService.ensureForRecording(recording.id);
      transcriptService.processRecordingAsync(recording.id);
      res.status(202).json({ success: true, data: transcript });
    } catch (err) {
      next(err);
    }
  }

  async getMeetingTranscripts(req: Request, res: Response, next: NextFunction) {
    try {
      const transcripts = await transcriptService.getMeetingTranscripts(String(req.params.meetingId));
      res.json({ success: true, data: transcripts });
    } catch (err) {
      next(err);
    }
  }
}

export const transcriptController = new TranscriptController();
