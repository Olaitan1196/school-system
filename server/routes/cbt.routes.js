import express from 'express';
import { accessExamByToken } from '../controllers/cbt.controller.js';
import {
    createQuestion,
    getQuestions,
    createExam,
    getAllExams,
    createCbtSession,
    openCbtSession,
    closeCbtSession,
    startExam,
    recordTabSwitch,
    submitExam,
    getSessionResults,
    getFlaggedStudents,
    createPublicQuestion,
    startPublicExam,
    submitPublicExam,
} from '../controllers/cbt.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no login needed)
// ============================================
router.post('/public/start', startPublicExam);
router.post('/public/submit', submitPublicExam);
router.post('/access-by-token', accessExamByToken);

// All other routes require login
router.use(verifyToken);

// ============================================
// QUESTION BANK ROUTES
// ============================================
router.post(
    '/questions',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    createQuestion
);
router.get(
    '/questions',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    getQuestions
);

// ============================================
// CBT EXAM ROUTES
// ============================================
router.post('/exams', adminOnly, createExam);
router.get(
    '/exams',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getAllExams
);

// ============================================
// CBT SESSION ROUTES
// ============================================
router.post('/sessions', adminOnly, createCbtSession);
router.patch('/sessions/:session_id/open', adminOnly, openCbtSession);
router.patch('/sessions/:session_id/close', adminOnly, closeCbtSession);

// ============================================
// STUDENT EXAM ROUTES
// ============================================
router.get(
    '/sessions/:session_id/start',
    allowRoles('student'),
    startExam
);
router.post(
    '/sessions/:session_id/tab-switch',
    allowRoles('student'),
    recordTabSwitch
);
router.post(
    '/sessions/:session_id/submit',
    allowRoles('student'),
    submitExam
);

// ============================================
// RESULTS ROUTES
// ============================================
router.get(
    '/sessions/:session_id/results',
    allowRoles('admin', 'class_teacher', 'subject_teacher'),
    getSessionResults
);
router.get(
    '/flagged',
    adminOnly,
    getFlaggedStudents
);

// ============================================
// PUBLIC EXAM QUESTIONS (admin only)
// ============================================
router.post(
    '/public/questions',
    adminOnly,
    createPublicQuestion
);

export default router;