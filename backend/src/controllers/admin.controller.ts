import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';

export class AdminController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await adminService.getUsers(page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async toggleUserActive(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).user.userId;
      const userId = req.params.userId as string;
      const result = await adminService.toggleUserActive(adminUserId, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async promoteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).user.userId;
      const userId = req.params.userId as string;
      const result = await adminService.promoteToAdmin(adminUserId, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async demoteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).user.userId;
      const userId = req.params.userId as string;
      const result = await adminService.demoteFromAdmin(adminUserId, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getSystemStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await adminService.getAuditLog(page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
