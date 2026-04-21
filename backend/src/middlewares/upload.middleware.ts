import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getRecordingsDir, ensureRecordingsDir } from '../services/recording.service';

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureRecordingsDir();
    cb(null, getRecordingsDir());
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const uploadRecording = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video/audio files are allowed'));
    }
  },
});
