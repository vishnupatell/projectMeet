import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../services/webhook.service';

export class WebhookController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const webhook = await webhookService.createWebhook(userId, req.body);
      res.status(201).json({ success: true, data: webhook });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const webhookId = req.params.webhookId as string;
      const result = await webhookService.deleteWebhook(webhookId, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const webhooks = await webhookService.getUserWebhooks(userId);
      res.json({ success: true, data: webhooks });
    } catch (error) {
      next(error);
    }
  }
}

export const webhookController = new WebhookController();
