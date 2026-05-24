import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// CREATE NEW USER
// ============================================
export const createUser = async (req, res) => {
    try {
        const {
            email,
            phone,
            password,
            role
        } = req.body;

        // Validate required fields
        if (!password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Password and role are required.'
            });
        }

        // Must have either email or phone
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Either email or phone is required.'
            });
        }

        // Validate role
        const validRoles = [
            'admin',
            'class_teacher',
            'subject_teacher',
            'student'
        ];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role provided.'
            });
        }

        // Check if email already exists
        if (email) {
            const emailExists = await db.query(
                `SELECT id FROM users WHERE email = $1`,
                [email]
            );
            if (emailExists.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists.'
                });
            }
        }

        // Check if phone already exists
        if (phone) {
            const phoneExists = await db.query(
                `SELECT id FROM users WHERE phone = $1`,
                [phone]
            );
            if (phoneExists.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already exists.'
                });
            }
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const newUser = await db.query(
            `INSERT INTO users (email, phone, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, phone, role, is_active, created_at`,
            [email || null, phone || null, passwordHash, role]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module, 
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'created_user',
                'auth',
                'users',
                newUser.rows[0].id,
                `Admin created new ${role} account`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'User created successfully.',
            data: newUser.rows[0]
        });

    } catch (error) {
        console.error('Create user error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL USERS
// ============================================
export const getAllUsers = async (req, res) => {
    try {
        const { role, is_active, page = 1, limit = 20 } = req.query;

        // Build dynamic query
        let conditions = [];
        let values = [];
        let counter = 1;

        if (role) {
            conditions.push(`u.role = $${counter}`);
            values.push(role);
            counter++;
        }

        if (is_active !== undefined) {
            conditions.push(`u.is_active = $${counter}`);
            values.push(is_active === 'true');
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const offset = (page - 1) * limit;

        const usersQuery = await db.query(
            `SELECT u.id, u.email, u.phone, u.role,
                    u.is_active, u.last_login, u.created_at,
                    s.first_name, s.last_name, s.admission_number,
                    t.first_name AS teacher_first_name,
                    t.last_name AS teacher_last_name,
                    t.staff_id
             FROM users u
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN teachers t ON t.user_id = u.id
             ${whereClause}
             ORDER BY u.created_at DESC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        // Get total count
        const countQuery = await db.query(
            `SELECT COUNT(*) FROM users u ${whereClause}`,
            values
        );

        const total = parseInt(countQuery.rows[0].count);

        return res.status(200).json({
            success: true,
            data: usersQuery.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all users error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET SINGLE USER
// ============================================
export const getSingleUser = async (req, res) => {
    try {
        const { id } = req.params;

        const userQuery = await db.query(
            `SELECT u.id, u.email, u.phone, u.role,
                    u.is_active, u.last_login, u.created_at,
                    s.id AS student_id,
                    s.first_name, s.last_name, s.middle_name,
                    s.admission_number, s.passport_url,
                    s.date_of_birth, s.gender,
                    s.state_of_origin, s.religion,
                    t.id AS teacher_id,
                    t.first_name AS teacher_first_name,
                    t.last_name AS teacher_last_name,
                    t.staff_id, t.qualification,
                    t.specialization, t.phone AS teacher_phone
             FROM users u
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN teachers t ON t.user_id = u.id
             WHERE u.id = $1`,
            [id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: userQuery.rows[0]
        });

    } catch (error) {
        console.error('Get single user error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ACTIVATE OR DEACTIVATE USER
// ============================================
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Get current status
        const userQuery = await db.query(
            `SELECT id, is_active, role FROM users WHERE id = $1`,
            [id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const user = userQuery.rows[0];

        // Prevent admin from deactivating themselves
        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account.'
            });
        }

        // Toggle the status
        const newStatus = !user.is_active;

        await db.query(
            `UPDATE users 
             SET is_active = $1, updated_at = NOW() 
             WHERE id = $2`,
            [newStatus, id]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                newStatus ? 'activated_user' : 'deactivated_user',
                'auth',
                'users',
                id,
                `Admin ${newStatus ? 'activated' : 'deactivated'} 
                 user account`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `User ${newStatus
                ? 'activated'
                : 'deactivated'} successfully.`,
            data: { id, is_active: newStatus }
        });

    } catch (error) {
        console.error('Toggle user status error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// RESET USER PASSWORD
// ============================================
export const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password) {
            return res.status(400).json({
                success: false,
                message: 'New password is required.'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters.'
            });
        }

        // Check user exists
        const userQuery = await db.query(
            `SELECT id FROM users WHERE id = $1`,
            [id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(new_password, saltRounds);

        // Update password
        await db.query(
            `UPDATE users 
             SET password_hash = $1, updated_at = NOW() 
             WHERE id = $2`,
            [passwordHash, id]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'reset_password',
                'auth',
                'users',
                id,
                `Admin reset password for user`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully.'
        });

    } catch (error) {
        console.error('Reset password error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// DELETE USER
// ============================================
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account.'
            });
        }

        // Check user exists
        const userQuery = await db.query(
            `SELECT id, role FROM users WHERE id = $1`,
            [id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Delete user
        await db.query(
            `DELETE FROM users WHERE id = $1`,
            [id]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'deleted_user',
                'auth',
                'users',
                id,
                `Admin deleted user account 
                 with role: ${userQuery.rows[0].role}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully.'
        });

    } catch (error) {
        console.error('Delete user error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};