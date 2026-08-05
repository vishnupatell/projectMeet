import { Router } from 'express';
import authRoutes from './auth.routes';
import meetingRoutes from './meeting.routes';
import chatRoutes from './chat.routes';
import recordingRoutes from './recording.routes';
import transcriptRoutes from './transcript.routes';
import pollRoutes from './poll.routes';
import breakoutRoutes from './breakout.routes';
import webhookRoutes from './webhook.routes';
import analyticsRoutes from './analytics.routes';
import fileshareRoutes from './fileshare.routes';
import actionitemRoutes from './actionitem.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);
router.use('/chats', chatRoutes);
router.use('/recordings', recordingRoutes);
router.use('/transcripts', transcriptRoutes);
router.use('/polls', pollRoutes);
router.use('/breakout-rooms', breakoutRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/files', fileshareRoutes);
router.use('/action-items', actionitemRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
