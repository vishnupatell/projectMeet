import { Router } from 'express';
import { actionItemController } from '../controllers/actionitem.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/meeting/:meetingId', (req, res, next) => actionItemController.create(req, res, next));
router.get('/meeting/:meetingId', (req, res, next) => actionItemController.list(req, res, next));
router.patch('/:itemId', (req, res, next) => actionItemController.update(req, res, next));
router.delete('/:itemId', (req, res, next) => actionItemController.delete(req, res, next));

export default router;
