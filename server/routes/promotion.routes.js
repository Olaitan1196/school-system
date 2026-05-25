import express from 'express';
import {
    setPromotionSettings,
    getPromotionSettings,
    runAutoPromotion,
    manualPromotion,
    getStudentPromotionHistory,
    getClassPromotions,
    getPromotionSummary
} from '../controllers/promotion.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// ============================================
// PROMOTION SETTINGS
// ============================================
router.post('/settings', adminOnly, setPromotionSettings);
router.get('/settings', adminOnly, getPromotionSettings);

// ============================================
// AUTO PROMOTION
// ============================================
router.post('/auto', adminOnly, runAutoPromotion);

// ============================================
// MANUAL PROMOTION
// ============================================
router.patch(
    '/students/:student_id',
    adminOnly,
    manualPromotion
);

// ============================================
// VIEW PROMOTIONS
// ============================================
router.get(
    '/students/:student_id/history',
    allowRoles('admin', 'class_teacher'),
    getStudentPromotionHistory
);

router.get(
    '/class',
    allowRoles('admin', 'class_teacher'),
    getClassPromotions
);

router.get(
    '/summary/:session_id',
    adminOnly,
    getPromotionSummary
);

export default router;