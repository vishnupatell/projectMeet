import { Router } from 'express';
import { breakoutController } from '../controllers/breakout.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/meeting/:meetingId', (req, res, next) => breakoutController.create(req, res, next));
router.get('/meeting/:meetingId', (req, res, next) => breakoutController.list(req, res, next));
router.post('/meeting/:meetingId/close', (req, res, next) => breakoutController.close(req, res, next));
router.post('/meeting/:meetingId/broadcast', (req, res, next) => breakoutController.broadcast(req, res, next));
router.post('/:roomId/move', (req, res, next) => breakoutController.moveParticipant(req, res, next));

export default router;
