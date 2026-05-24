import express from 'express';
import {
    registerStudent,
    getAllStudents,
    getSingleStudent,
    updateStudent,
    toggleStudentStatus,
    addParent
} from '../controllers/student.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require login
router.use(verifyToken);

// ============================================
// STUDENT ROUTES
// ============================================

// Admin only routes
router.post('/', adminOnly, registerStudent);
router.patch('/:id/toggle-status', adminOnly, toggleStudentStatus);

// Admin and teachers can view students
router.get(
    '/',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    getAllStudents
);
router.get(
    '/:id',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getSingleStudent
);

// Admin and class teachers can update
router.put(
    '/:id',
    allowRoles('admin', 'class_teacher'),
    updateStudent
);

// Admin only can add parents
router.post('/:id/parents', adminOnly, addParent);

export default router;