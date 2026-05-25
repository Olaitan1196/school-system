import express from 'express';
import {
    verifyMemberAccess,
    submitAccessRequest,
    getAllRequests,
    reviewAccessRequest,
    submitPaymentProof,
    confirmVisitorPayment,
    checkRequestStatus
} from '../controllers/examaccess.controller.js';
import {
    verifyToken,
    adminOnly
} from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no login needed)
// ============================================

// Visitor verifies their student or staff ID
router.post('/verify', verifyMemberAccess);

// Visitor submits access request
router.post('/request', submitAccessRequest);

// Visitor checks status of their request
router.post('/request/status', checkRequestStatus);

// Visitor submits payment proof
router.patch(
    '/request/:request_id/payment-proof',
    submitPaymentProof
);

// ============================================
// ADMIN ROUTES (login required)
// ============================================
router.use(verifyToken);

router.get('/requests', adminOnly, getAllRequests);

router.patch(
    '/requests/:request_id/review',
    adminOnly,
    reviewAccessRequest
);

router.patch(
    '/requests/:request_id/confirm-payment',
    adminOnly,
    confirmVisitorPayment
);

export default router;