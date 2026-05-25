import express from 'express';
import {
    addBook,
    getAllBooks,
    getSingleBook,
    updateBook,
    borrowBook,
    returnBook,
    getAllBorrowings,
    getOverdueBooks,
    getUserBorrowingHistory
} from '../controllers/library.controller.js';
import {
    verifyToken,
    adminOnly,
    allowRoles
} from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// ============================================
// BOOK ROUTES
// ============================================
router.post(
    '/',
    adminOnly,
    addBook
);

router.get(
    '/',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getAllBooks
);

router.get(
    '/overdue',
    allowRoles('admin', 'class_teacher'),
    getOverdueBooks
);

router.get(
    '/borrowings',
    allowRoles('admin', 'class_teacher'),
    getAllBorrowings
);

router.get(
    '/borrowings/user/:user_id',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getUserBorrowingHistory
);

router.get(
    '/:id',
    allowRoles('admin', 'class_teacher', 'subject_teacher', 'student'),
    getSingleBook
);

router.put(
    '/:id',
    adminOnly,
    updateBook
);

// ============================================
// BORROWING ROUTES
// ============================================
router.post(
    '/borrow',
    allowRoles('admin', 'class_teacher'),
    borrowBook
);

router.patch(
    '/borrowings/:borrowing_id/return',
    allowRoles('admin', 'class_teacher'),
    returnBook
);

export default router;