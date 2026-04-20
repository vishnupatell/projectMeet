import { Router } from 'express';
import { meetingController } from '../controllers/meeting.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createMeetingSchema, joinMeetingSchema } from '../validators/meeting.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createMeetingSchema), meetingController.create);
router.get('/', meetingController.getUserMeetings);
router.get('/ice-servers', meetingController.getIceServers);
router.get('/code/:code', meetingController.getByCode);
router.get('/:id', meetingController.getById);
router.post('/join', validate(joinMeetingSchema), meetingController.join);
router.post('/:id/leave', meetingController.leave);
router.post('/:id/end', meetingController.end);

export default router;
