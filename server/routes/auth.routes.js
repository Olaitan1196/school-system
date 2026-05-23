import express from 'express';
import {
    login,
    logout,
    changePassword,
    getMyProfile
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no login required)
// ============================================
router.post('/login', login);


// ============================================
// PROTECTED ROUTES (login required)
// ============================================
router.get('/me', verifyToken, getMyProfile);
router.post('/logout', verifyToken, logout);
router.put('/change-password', verifyToken, changePassword);

export default router;