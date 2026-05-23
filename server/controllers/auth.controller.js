import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// LOGIN
// ============================================
export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // identifier can be email or phone
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your email or phone and password.'
            });
        }

        // Find user by email or phone
        const userQuery = await db.query(
            `SELECT u.*, 
                s.id AS student_id, 
                s.first_name, 
                s.last_name,
                s.admission_number,
                t.id AS teacher_id,
                t.staff_id
             FROM users u
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN teachers t ON t.user_id = u.id
             WHERE (u.email = $1 OR u.phone = $1)
             AND u.is_active = TRUE`,
            [identifier]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials. User not found.'
            });
        }

        const user = userQuery.rows[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials. Wrong password.'
            });
        }

        // Update last login time
        await db.query(
            `UPDATE users SET last_login = NOW() WHERE id = $1`,
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                student_id: user.student_id || null,
                teacher_id: user.teacher_id || null,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Send response
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                role: user.role,
                first_name: user.first_name || null,
                last_name: user.last_name || null,
                admission_number: user.admission_number || null,
                staff_id: user.staff_id || null,
                email: user.email,
                phone: user.phone,
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CHANGE PASSWORD
// ============================================
export const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const userId = req.user.id;

        if (!old_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide old and new password.'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters.'
            });
        }

        // Get current password
        const userQuery = await db.query(
            `SELECT password_hash FROM users WHERE id = $1`,
            [userId]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(
            old_password,
            userQuery.rows[0].password_hash
        );

        if (!isOldPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Old password is incorrect.'
            });
        }

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

        // Update password
        await db.query(
            `UPDATE users 
             SET password_hash = $1, updated_at = NOW() 
             WHERE id = $2`,
            [newPasswordHash, userId]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs 
             (user_id, user_role, action, module, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                req.user.role,
                'changed_password',
                'auth',
                `User changed their password`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully.'
        });

    } catch (error) {
        console.error('Change password error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET LOGGED IN USER PROFILE
// ============================================
export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const userQuery = await db.query(
            `SELECT u.id, u.email, u.phone, u.role, 
                    u.is_active, u.last_login, u.created_at,
                    s.id AS student_id,
                    s.first_name, s.last_name, s.middle_name,
                    s.admission_number, s.passport_url,
                    s.date_of_birth, s.gender,
                    t.id AS teacher_id,
                    t.staff_id, t.qualification,
                    t.specialization
             FROM users u
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN teachers t ON t.user_id = u.id
             WHERE u.id = $1`,
            [userId]
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
        console.error('Get profile error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// LOGOUT
// ============================================
export const logout = async (req, res) => {
    try {
        // Log the action
        await db.query(
            `INSERT INTO audit_logs 
             (user_id, user_role, action, module, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                req.user.id,
                req.user.role,
                'logged_out',
                'auth',
                `User logged out`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });

    } catch (error) {
        console.error('Logout error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};