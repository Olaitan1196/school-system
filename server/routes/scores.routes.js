import express from 'express';
import {
    enterScores,
    enterBulkScores,
    getClassScores,
    getStudentScores,
    generateReportCards,
    calculateRankings,
    addRemarks,
    publishResults,
    getStudentReportCard,
    adminViewResult,
    studentViewResult
} from '../controllers/scores.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTE (no login needed)
// ============================================
// Student uses token to view result
router.get('/result/token/:token', studentViewResult);

// All other routes require login
router.use(verifyToken);

// ============================================
// SCORE ENTRY ROUTES
// ============================================
router.post(
    '/',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    enterScores
);

router.post(
    '/bulk',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    enterBulkScores
);

router.get(
    '/class',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    getClassScores
);

router.get(
    '/student/:student_id',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getStudentScores
);

// ============================================
// REPORT CARD ROUTES
// ============================================
router.post(
    '/report-cards/generate',
    adminOnly,
    generateReportCards
);

router.post(
    '/rankings/calculate',
    adminOnly,
    calculateRankings
);

router.put(
    '/report-cards/:student_id/:term_id/remarks',
    allowRoles('admin', 'class_teacher'),
    addRemarks
);

router.post(
    '/report-cards/publish',
    adminOnly,
    publishResults
);

router.get(
    '/report-cards/:student_id/:term_id',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getStudentReportCard
);

// Admin only result view (no payment restriction)
router.get(
    '/admin/result/:student_id/:term_id',
    adminOnly,
    adminViewResult
);

export default router;