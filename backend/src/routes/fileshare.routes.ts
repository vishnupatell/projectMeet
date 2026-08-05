import { Router } from 'express';
import { fileShareController } from '../controllers/fileshare.controller';
import { authenticate } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

router.use(authenticate);

router.post('/meeting/:meetingId', upload.single('file'), (req, res, next) => fileShareController.upload(req, res, next));
router.get('/meeting/:meetingId', (req, res, next) => fileShareController.list(req, res, next));
router.delete('/:fileId', (req, res, next) => fileShareController.delete(req, res, next));

export default router;
