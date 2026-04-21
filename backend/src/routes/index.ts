import { Router } from 'express';
import authRoutes from './auth.routes';
import meetingRoutes from './meeting.routes';
import chatRoutes from './chat.routes';
import recordingRoutes from './recording.routes';
import transcriptRoutes from './transcript.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);
router.use('/chats', chatRoutes);
router.use('/recordings', recordingRoutes);
router.use('/transcripts', transcriptRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
