import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';

export class ChatController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const chat = await chatService.createChat(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: chat });
    } catch (error) {
      next(error);
    }
  }

  async getUserChats(req: Request, res: Response, next: NextFunction) {
    try {
      const chats = await chatService.getUserChats(req.user!.userId);
      res.json({ success: true, data: chats });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const chatId = req.params.chatId as string;
      const { cursor, limit } = req.query;
      const messages = await chatService.getMessages(
        chatId,
        req.user!.userId,
        cursor as string,
        limit ? Number.parseInt(limit as string, 10) : undefined,
      );
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await chatService.sendMessage(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
