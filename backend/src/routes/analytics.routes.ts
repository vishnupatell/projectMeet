import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/meeting/:meetingId', (req, res, next) => analyticsController.getMeetingAnalytics(req, res, next));
router.get('/admin/stats', (req, res, next) => analyticsController.getAdminStats(req, res, next));

export default router;
