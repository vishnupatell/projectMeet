import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// All admin routes require ADMIN role - enforced in service layer
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.post('/users/:userId/toggle-active', (req, res, next) => adminController.toggleUserActive(req, res, next));
router.post('/users/:userId/promote', (req, res, next) => adminController.promoteUser(req, res, next));
router.post('/users/:userId/demote', (req, res, next) => adminController.demoteUser(req, res, next));
router.get('/stats', (req, res, next) => adminController.getStats(req, res, next));
router.get('/audit-log', (req, res, next) => adminController.getAuditLog(req, res, next));

export default router;
