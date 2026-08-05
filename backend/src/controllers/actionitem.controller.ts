import { Request, Response, NextFunction } from 'express';
import { actionItemService } from '../services/actionitem.service';

export class ActionItemController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const item = await actionItemService.createActionItem(meetingId, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const items = await actionItemService.getMeetingActionItems(meetingId);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = req.params.itemId as string;
      const item = await actionItemService.updateActionItem(itemId, req.body);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = req.params.itemId as string;
      const result = await actionItemService.deleteActionItem(itemId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const actionItemController = new ActionItemController();
