import express from 'express';
import {
    createSession,
    getAllSessions,
    createTerm,
    getAllTerms,
    createClass,
    getAllClasses,
    createStream,
    createSubject,
    getAllSubjects,
    assignSubjectToClass,
    getClassSubjects,
    enrollStudent,
    getClassStudents
} from '../controllers/academic.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// ============================================
// SESSION ROUTES
// ============================================
router.post('/sessions', adminOnly, createSession);
router.get('/sessions', allowRoles('admin', 'class_teacher', 'subject_teacher'), getAllSessions);

// ============================================
// TERM ROUTES
// ============================================
router.post('/terms', adminOnly, createTerm);
router.get('/terms', allowRoles('admin', 'class_teacher', 'subject_teacher'), getAllTerms);

// ============================================
// CLASS ROUTES
// ============================================
router.post('/classes', adminOnly, createClass);
router.get('/classes', allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'), getAllClasses);

// ============================================
// STREAM ROUTES
// ============================================
router.post('/streams', adminOnly, createStream);

// ============================================
// SUBJECT ROUTES
// ============================================
router.post('/subjects', adminOnly, createSubject);
router.get('/subjects', allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'), getAllSubjects);
router.post('/subjects/assign', adminOnly, assignSubjectToClass);
router.get('/classes/:class_id/subjects', allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'), getClassSubjects);

// ============================================
// ENROLLMENT ROUTES
// ============================================
router.post('/enroll', adminOnly, enrollStudent);
router.get('/classes/:class_id/students', allowRoles('admin', 'class_teacher', 'subject_teacher'), getClassStudents);

export default router;