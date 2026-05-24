import express from 'express';
import {
    createUser,
    getAllUsers,
    getSingleUser,
    toggleUserStatus,
    resetUserPassword,
    deleteUser
} from '../controllers/admin.controller.js';
import {
    verifyToken,
    adminOnly
} from '../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes require login and admin role
router.use(verifyToken);
router.use(adminOnly);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================
router.post('/users', createUser);
router.get('/users', getAllUsers);
router.get('/users/:id', getSingleUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.patch('/users/:id/reset-password', resetUserPassword);
router.delete('/users/:id', deleteUser);

export default router;