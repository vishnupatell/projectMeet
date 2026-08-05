import { Request, Response, NextFunction } from 'express';
import { fileShareService } from '../services/fileshare.service';

export class FileShareController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const userId = (req as any).user.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
      }

      const sharedFile = await fileShareService.uploadFile(meetingId, userId, {
        filename: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
      });

      res.status(201).json({ success: true, data: sharedFile });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const files = await fileShareService.getMeetingFiles(meetingId);
      res.json({ success: true, data: files });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = req.params.fileId as string;
      const userId = (req as any).user.userId;
      const result = await fileShareService.deleteFile(fileId, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const fileShareController = new FileShareController();
