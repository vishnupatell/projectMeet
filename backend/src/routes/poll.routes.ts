import { Router } from 'express';
import { pollController } from '../controllers/poll.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/meeting/:meetingId', (req, res, next) => pollController.create(req, res, next));
router.get('/meeting/:meetingId', (req, res, next) => pollController.getMeetingPolls(req, res, next));
router.post('/:pollId/vote', (req, res, next) => pollController.vote(req, res, next));
router.post('/:pollId/close', (req, res, next) => pollController.close(req, res, next));
router.get('/:pollId/results', (req, res, next) => pollController.getResults(req, res, next));

export default router;
