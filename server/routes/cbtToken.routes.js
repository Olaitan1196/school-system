import express from 'express';
import { generateTokens, getSessionTokens } from '../controllers/cbtToken.controller.js';
import { verifyToken, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/sessions/:session_id/generate-tokens', verifyToken, adminOnly, generateTokens);
router.get('/sessions/:session_id/tokens', verifyToken, adminOnly, getSessionTokens);

export default router;