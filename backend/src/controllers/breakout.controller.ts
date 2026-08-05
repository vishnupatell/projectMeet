import { Request, Response, NextFunction } from 'express';
import { breakoutRoomService } from '../services/breakout.service';

export class BreakoutController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const userId = (req as any).user.userId;
      const { rooms, duration } = req.body;
      const result = await breakoutRoomService.createBreakoutRooms(meetingId, userId, rooms, duration);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const userId = (req as any).user.userId;
      const result = await breakoutRoomService.closeBreakoutRooms(meetingId, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const rooms = await breakoutRoomService.getBreakoutRooms(meetingId);
      res.json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }

  async moveParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = req.params.roomId as string;
      const userId = (req as any).user.userId;
      const { participantUserId } = req.body;
      const result = await breakoutRoomService.moveParticipant(roomId, participantUserId, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async broadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const userId = (req as any).user.userId;
      const { message } = req.body;
      const result = await breakoutRoomService.broadcastToRooms(meetingId, userId, message);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const breakoutController = new BreakoutController();
