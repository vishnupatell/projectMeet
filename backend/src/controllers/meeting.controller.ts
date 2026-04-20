import { Request, Response, NextFunction } from 'express';
import { meetingService } from '../services/meeting.service';

export class MeetingController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.createMeeting(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  }

  async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.getMeetingByCode(req.params.code as string);
      res.json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.getMeeting(req.params.id as string);
      res.json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  }

  async join(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.joinMeeting(req.body.code, req.user!.userId);
      res.json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  }

  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      await meetingService.leaveMeeting(req.params.id as string, req.user!.userId);
      res.json({ success: true, message: 'Left meeting' });
    } catch (error) {
      next(error);
    }
  }

  async end(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.endMeeting(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  }

  async getUserMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const meetings = await meetingService.getUserMeetings(req.user!.userId);
      res.json({ success: true, data: meetings });
    } catch (error) {
      next(error);
    }
  }

  async getIceServers(_req: Request, res: Response, next: NextFunction) {
    try {
      const iceServers = meetingService.getIceServers();
      res.json({ success: true, data: iceServers });
    } catch (error) {
      next(error);
    }
  }
}

export const meetingController = new MeetingController();
