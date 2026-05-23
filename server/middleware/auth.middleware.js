import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// VERIFY TOKEN MIDDLEWARE
// ============================================
// This runs before any protected route
// It checks if the user has a valid login token

export const verifyToken = (req, res, next) => {
    try {
        // Get token from request header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Extract the token from "Bearer <token>"
        const token = authHeader.split(' ')[1];

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to the request
        req.user = decoded;

        // Move to the next function
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
};


// ============================================
// ROLE GUARD MIDDLEWARE
// ============================================
// This checks if the logged in user has
// the right role to access a route

export const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to perform this action.'
            });
        }
        next();
    };
};


// ============================================
// ADMIN ONLY MIDDLEWARE
// ============================================
export const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};


// ============================================
// TEACHER ONLY MIDDLEWARE
// ============================================
export const teacherOnly = (req, res, next) => {
    if (
        req.user.role !== 'class_teacher' &&
        req.user.role !== 'subject_teacher'
    ) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Teachers only.'
        });
    }
    next();
};