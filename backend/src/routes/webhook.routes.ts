import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', (req, res, next) => webhookController.create(req, res, next));
router.get('/', (req, res, next) => webhookController.list(req, res, next));
router.delete('/:webhookId', (req, res, next) => webhookController.delete(req, res, next));

export default router;
