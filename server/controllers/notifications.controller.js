import pool from '../config/db.js';

// GET all notifications for the logged-in admin
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM notifications
             WHERE recipient_id = $1 OR recipient_role = 'all'
             ORDER BY created_at DESC
             LIMIT 20`,
            [userId]
        );

        const unreadCount = result.rows.filter(n => !n.is_read).length;

        res.json({
            success: true,
            data: result.rows,
            unread_count: unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// MARK a single notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            `UPDATE notifications
             SET is_read = TRUE, read_at = NOW()
             WHERE id = $1`,
            [id]
        );

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// MARK ALL notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            `UPDATE notifications
             SET is_read = TRUE, read_at = NOW()
             WHERE (recipient_id = $1 OR recipient_role = 'all')
             AND is_read = FALSE`,
            [userId]
        );

        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};