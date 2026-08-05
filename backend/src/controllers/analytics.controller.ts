import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

export class AnalyticsController {
  async getMeetingAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const analytics = await analyticsService.getAnalytics(meetingId);
      res.json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
