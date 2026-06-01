import express from 'express';
import {
    createUser,
    getAllUsers,
    getSingleUser,
    toggleUserStatus,
    resetUserPassword,
    deleteUser,
    getAuditLogs
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

// AUDIT LOGS
router.get('/audit-logs', adminOnly, async (req, res) => {
    try {
        const { module, page = 1, limit = 20 } = req.query;

        let conditions = [];
        let values = [];
        let counter = 1;

        if (module) {
            conditions.push(`module = $${counter}`);
            values.push(module);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const offset = (page - 1) * limit;

        const result = await req.db?.query(
            `SELECT * FROM audit_logs
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        const countQuery = await req.db?.query(
            `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
            values
        );

        const total = parseInt(countQuery?.rows[0]?.count || 0);

        return res.status(200).json({
            success: true,
            data: result?.rows || [],
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Audit logs error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

router.get('/audit-logs', adminOnly, getAuditLogs);

export default router;