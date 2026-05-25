import express from 'express';
import {
    createEvent,
    getAllEvents,
    getSingleEvent,
    updateEvent,
    deleteEvent,
    getUpcomingEvents
} from '../controllers/calendar.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// ============================================
// CALENDAR ROUTES
// ============================================
router.post('/', adminOnly, createEvent);

router.get(
    '/',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getAllEvents
);

router.get(
    '/upcoming',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getUpcomingEvents
);

router.get(
    '/:id',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getSingleEvent
);

router.put('/:id', adminOnly, updateEvent);
router.delete('/:id', adminOnly, deleteEvent);

export default router;