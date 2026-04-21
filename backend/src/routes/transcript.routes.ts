import { Router } from 'express';
import { transcriptController } from '../controllers/transcript.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/recording/:recordingId', transcriptController.getByRecording);
router.post('/recording/:recordingId/generate', transcriptController.generate);
router.get('/meeting/:meetingId', transcriptController.getMeetingTranscripts);

export default router;
