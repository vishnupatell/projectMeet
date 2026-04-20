import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createChatSchema, sendMessageSchema } from '../validators/chat.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createChatSchema), chatController.create);
router.get('/', chatController.getUserChats);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/messages', validate(sendMessageSchema), chatController.sendMessage);

export default router;
