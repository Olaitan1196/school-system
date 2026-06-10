import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notifications.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/mark-all-read', verifyToken, markAllAsRead);

export default router;