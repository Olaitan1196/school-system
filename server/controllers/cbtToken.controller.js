import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// GENERATE TOKENS FOR ALL STUDENTS
// IN A CBT SESSION
// Admin calls this after creating a session
// ============================================
export const generateTokens = async (req, res) => {
    try {
        const { session_id } = req.params;

        // Get the session and its linked exam
        const sessionQuery = await db.query(
            `SELECT cs.*, ce.class_id
             FROM cbt_sessions cs
             LEFT JOIN cbt_exams ce ON ce.id = cs.exam_id
             WHERE cs.id = $1`,
            [session_id]
        );

        if (sessionQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'CBT session not found.'
            });
        }

        const session = sessionQuery.rows[0];

        // Get all students enrolled in this class
        const studentsQuery = await db.query(
            `SELECT s.id, s.first_name, s.last_name, s.admission_number
             FROM students s
             LEFT JOIN enrollments e ON e.student_id = s.id
             WHERE e.class_id = $1
             AND s.is_active = TRUE`,
            [session.class_id]
        );

        if (studentsQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in this class.'
            });
        }

        // Generate a token for each student
        const tokens = [];

        for (const student of studentsQuery.rows) {
            // Check if token already exists for this student and session
            const existing = await db.query(
                `SELECT id, access_token FROM cbt_tokens
                 WHERE student_id = $1 AND cbt_session_id = $2`,
                [student.id, session_id]
            );

            if (existing.rows.length > 0) {
                tokens.push({
                    student_id: student.id,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    admission_number: student.admission_number,
                    access_token: existing.rows[0].access_token
                });
                continue;
            }

            // Generate unique token
            const token = `CBT-${student.admission_number}-${uuidv4().slice(0, 6).toUpperCase()}`;

            await db.query(
                `INSERT INTO cbt_tokens
                 (id, student_id, cbt_session_id, access_token, expires_at)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    uuidv4(),
                    student.id,
                    session_id,
                    token,
                    new Date(Date.now() + 24 * 60 * 60 * 1000) // expires in 24 hours
                ]
            );

            tokens.push({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                admission_number: student.admission_number,
                access_token: token
            });
        }

        return res.status(200).json({
            success: true,
            message: `${tokens.length} tokens generated successfully.`,
            data: tokens
        });

    } catch (error) {
        console.error('Generate tokens error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL TOKENS FOR A SESSION
// Admin uses this to see the token list
// ============================================
export const getSessionTokens = async (req, res) => {
    try {
        const { session_id } = req.params;

        const result = await db.query(
            `SELECT ct.access_token, ct.is_used, ct.expires_at,
                    s.first_name, s.last_name, s.admission_number
             FROM cbt_tokens ct
             LEFT JOIN students s ON s.id = ct.student_id
             WHERE ct.cbt_session_id = $1
             ORDER BY s.last_name ASC`,
            [session_id]
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get session tokens error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};