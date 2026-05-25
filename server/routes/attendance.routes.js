import express from 'express';
import {
    markAttendance,
    markBulkAttendance,
    getClassAttendance,
    getStudentAttendance,
    getAttendanceSummary,
    getClassAttendanceSummary
} from '../controllers/attendance.controller.js';
import {
    verifyToken,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// ============================================
// ATTENDANCE ROUTES
// ============================================

// Mark attendance
router.post(
    '/',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    markAttendance
);

router.post(
    '/bulk',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    markBulkAttendance
);

// View attendance
router.get(
    '/class',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    getClassAttendance
);

router.get(
    '/student/:student_id',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getStudentAttendance
);

router.get(
    '/student/:student_id/summary',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getAttendanceSummary
);

router.get(
    '/class/summary',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    getClassAttendanceSummary
);

export default router;