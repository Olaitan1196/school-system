import express from 'express';
import {
    createFeeItem,
    getAllFeeItems,
    setFeeStructure,
    getFeeStructures,
    generateInvoice,
    generateBulkInvoices,
    getStudentInvoice,
    recordPayment,
    reviewPayment,
    deletePayment,
    getAllPayments,
    addManualPayment,
    getOutstandingInvoices
} from '../controllers/fees.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// ============================================
// FEE ITEMS ROUTES
// ============================================
router.post('/items', adminOnly, createFeeItem);
router.get('/items', allowRoles('admin', 'class_teacher'), getAllFeeItems);

// ============================================
// FEE STRUCTURE ROUTES
// ============================================
router.post('/structures', adminOnly, setFeeStructure);
router.get('/structures', allowRoles('admin', 'class_teacher'), getFeeStructures);

// ============================================
// INVOICE ROUTES
// ============================================
router.post('/invoices', adminOnly, generateInvoice);
router.post('/invoices/bulk', adminOnly, generateBulkInvoices);
router.get(
    '/invoices/:student_id/:term_id',
    allowRoles('admin', 'class_teacher', 'student'),
    getStudentInvoice
);

// ============================================
// PAYMENT ROUTES
// ============================================
router.post('/payments', allowRoles('admin', 'class_teacher'), recordPayment);
router.post('/payments/manual', adminOnly, addManualPayment);
router.get('/payments', adminOnly, getAllPayments);
router.patch('/payments/:payment_id/review', adminOnly, reviewPayment);
router.delete('/payments/:payment_id', adminOnly, deletePayment);

router.get(
    '/outstanding',
    allowRoles('admin', 'class_teacher'),
    getOutstandingInvoices
);

export default router;