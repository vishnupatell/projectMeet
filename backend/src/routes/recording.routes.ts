import { Router } from 'express';
import { recordingController } from '../controllers/recording.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadRecording } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

// Upload a completed recording (multipart/form-data)
router.post('/upload', uploadRecording.single('recording'), recordingController.upload);

// List recordings for current user
router.get('/my', recordingController.getUserRecordings);

// List recordings for a meeting
router.get('/meeting/:meetingId', recordingController.getMeetingRecordings);

// Download a recording file
router.get('/:id/download', recordingController.download);

// Delete a recording
router.delete('/:id', recordingController.deleteRecording);

export default router;
