import express from 'express';
import {
    registerTeacher,
    getAllTeachers,
    getSingleTeacher,
    updateTeacher,
    toggleTeacherStatus,
    assignTeacher,
    removeAssignment
} from '../controllers/teacher.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require login
router.use(verifyToken);

// ============================================
// TEACHER ROUTES
// ============================================

// Admin only routes
router.post('/', adminOnly, registerTeacher);
router.patch('/:id/toggle-status', adminOnly, toggleTeacherStatus);
router.post('/:id/assignments', adminOnly, assignTeacher);
router.delete(
    '/assignments/:assignment_id',
    adminOnly,
    removeAssignment
);

// Admin and teachers can view
router.get(
    '/',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    getAllTeachers
);
router.get(
    '/:id',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    getSingleTeacher
);

// Admin only can update
router.put('/:id', adminOnly, updateTeacher);

export default router;