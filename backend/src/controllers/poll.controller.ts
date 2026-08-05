import { Request, Response, NextFunction } from 'express';
import { pollService } from '../services/poll.service';

export class PollController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const userId = (req as any).user.userId;
      const poll = await pollService.createPoll(meetingId, userId, req.body);
      res.status(201).json({ success: true, data: poll });
    } catch (error) {
      next(error);
    }
  }

  async vote(req: Request, res: Response, next: NextFunction) {
    try {
      const pollId = req.params.pollId as string;
      const userId = (req as any).user.userId;
      const { optionId } = req.body;
      const vote = await pollService.votePoll(pollId, userId, optionId);
      res.json({ success: true, data: vote });
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const pollId = req.params.pollId as string;
      const userId = (req as any).user.userId;
      const poll = await pollService.closePoll(pollId, userId);
      res.json({ success: true, data: poll });
    } catch (error) {
      next(error);
    }
  }

  async getResults(req: Request, res: Response, next: NextFunction) {
    try {
      const pollId = req.params.pollId as string;
      const results = await pollService.getPollResults(pollId);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async getMeetingPolls(req: Request, res: Response, next: NextFunction) {
    try {
      const meetingId = req.params.meetingId as string;
      const polls = await pollService.getMeetingPolls(meetingId);
      res.json({ success: true, data: polls });
    } catch (error) {
      next(error);
    }
  }
}

export const pollController = new PollController();
