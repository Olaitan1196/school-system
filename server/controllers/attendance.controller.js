import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// MARK ATTENDANCE FOR A SINGLE STUDENT
// ============================================
export const markAttendance = async (req, res) => {
    try {
        const {
            student_id,
            class_id,
            session_id,
            term_id,
            attendance_date,
            status,
            remark
        } = req.body;

        if (
            !student_id || !class_id ||
            !session_id || !term_id ||
            !attendance_date || !status
        ) {
            return res.status(400).json({
                success: false,
                message: 'Student, class, session, term, date and status are required.'
            });
        }

        // Insert or update attendance
        const result = await db.query(
            `INSERT INTO attendance (
                student_id, class_id, session_id,
                term_id, attendance_date, status,
                marked_by, remark
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (student_id, attendance_date)
            DO UPDATE SET
                status = EXCLUDED.status,
                marked_by = EXCLUDED.marked_by,
                remark = EXCLUDED.remark,
                updated_at = NOW()
            RETURNING *`,
            [
                student_id, class_id, session_id,
                term_id, attendance_date, status,
                req.user.id, remark || null
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Attendance marked successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Mark attendance error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// MARK BULK ATTENDANCE FOR A CLASS
// ============================================
// Teacher marks attendance for all students
// in a class at once

export const markBulkAttendance = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            class_id,
            session_id,
            term_id,
            attendance_date,
            attendance_list
        } = req.body;

        // attendance_list is an array like this:
        // [
        //   { student_id, status, remark },
        //   ...
        // ]

        if (
            !class_id || !session_id ||
            !term_id || !attendance_date
        ) {
            return res.status(400).json({
                success: false,
                message: 'Class, session, term and date are required.'
            });
        }

        if (
            !attendance_list ||
            !Array.isArray(attendance_list) ||
            attendance_list.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Attendance list is required.'
            });
        }

        await client.query('BEGIN');

        const savedRecords = [];

        for (const record of attendance_list) {
            const { student_id, status, remark } = record;

            const result = await client.query(
                `INSERT INTO attendance (
                    student_id, class_id, session_id,
                    term_id, attendance_date, status,
                    marked_by, remark
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (student_id, attendance_date)
                DO UPDATE SET
                    status = EXCLUDED.status,
                    marked_by = EXCLUDED.marked_by,
                    remark = EXCLUDED.remark,
                    updated_at = NOW()
                RETURNING *`,
                [
                    student_id, class_id, session_id,
                    term_id, attendance_date, status,
                    req.user.id, remark || null
                ]
            );

            savedRecords.push(result.rows[0]);
        }

        await client.query('COMMIT');

        // Log the action
        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'marked_bulk_attendance',
                'attendance',
                'attendance',
                null,
                `Marked attendance for ${savedRecords.length} 
                 students on ${attendance_date}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Attendance marked for ${savedRecords.length} students.`,
            data: savedRecords
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Bulk attendance error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// GET ATTENDANCE FOR A CLASS ON A DATE
// ============================================
export const getClassAttendance = async (req, res) => {
    try {
        const { class_id, attendance_date, term_id, session_id } = req.query;

        if (!class_id || !attendance_date) {
            return res.status(400).json({
                success: false,
                message: 'Class and date are required.'
            });
        }

        let query = `
            SELECT a.*,
                   s.first_name, s.last_name,
                   s.admission_number,
                   s.passport_url,
                   u.first_name AS marked_by_first_name,
                   u.last_name AS marked_by_last_name
            FROM attendance a
            LEFT JOIN students s ON s.id = a.student_id
            LEFT JOIN users mu ON mu.id = a.marked_by
            LEFT JOIN teachers u ON u.user_id = mu.id
            WHERE a.class_id = $1
            AND a.attendance_date = $2
        `;
        let values = [class_id, attendance_date];
        let counter = 3;

        if (session_id) {
            query += ` AND a.session_id = $${counter}`;
            values.push(session_id);
            counter++;
        }

        if (term_id) {
            query += ` AND a.term_id = $${counter}`;
            values.push(term_id);
        }

        query += ` ORDER BY s.first_name ASC`;

        const result = await db.query(query, values);

        return res.status(200).json({
            success: true,
            date: attendance_date,
            total: result.rows.length,
            present: result.rows.filter(r => r.status === 'present').length,
            absent: result.rows.filter(r => r.status === 'absent').length,
            late: result.rows.filter(r => r.status === 'late').length,
            excused: result.rows.filter(r => r.status === 'excused').length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get class attendance error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ATTENDANCE FOR A STUDENT
// ============================================
export const getStudentAttendance = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { term_id } = req.query;

        if (!term_id) {
            return res.status(400).json({
                success: false,
                message: 'Term is required.'
            });
        }

        const result = await db.query(
            `SELECT a.*,
                    t.term_name,
                    s.session_name
             FROM attendance a
             LEFT JOIN terms t ON t.id = a.term_id
             LEFT JOIN academic_sessions s ON s.id = a.session_id
             WHERE a.student_id = $1
             AND a.term_id = $2
             ORDER BY a.attendance_date ASC`,
            [student_id, term_id]
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get student attendance error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ATTENDANCE SUMMARY FOR A STUDENT
// ============================================
export const getAttendanceSummary = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { term_id } = req.query;

        if (!term_id) {
            return res.status(400).json({
                success: false,
                message: 'Term is required.'
            });
        }

        const result = await db.query(
            `SELECT
                COUNT(*) AS total_days,
                COUNT(*) FILTER (WHERE status = 'present') 
                    AS days_present,
                COUNT(*) FILTER (WHERE status = 'absent') 
                    AS days_absent,
                COUNT(*) FILTER (WHERE status = 'late') 
                    AS days_late,
                COUNT(*) FILTER (WHERE status = 'excused') 
                    AS days_excused,
                ROUND(
                    COUNT(*) FILTER (WHERE status = 'present') * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                ) AS attendance_percentage
             FROM attendance
             WHERE student_id = $1
             AND term_id = $2`,
            [student_id, term_id]
        );

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get attendance summary error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET CLASS ATTENDANCE SUMMARY FOR A TERM
// ============================================
export const getClassAttendanceSummary = async (req, res) => {
    try {
        const { class_id, term_id } = req.query;

        if (!class_id || !term_id) {
            return res.status(400).json({
                success: false,
                message: 'Class and term are required.'
            });
        }

        const result = await db.query(
            `SELECT
                s.id AS student_id,
                s.first_name,
                s.last_name,
                s.admission_number,
                COUNT(*) AS total_days,
                COUNT(*) FILTER (WHERE a.status = 'present') 
                    AS days_present,
                COUNT(*) FILTER (WHERE a.status = 'absent') 
                    AS days_absent,
                COUNT(*) FILTER (WHERE a.status = 'late') 
                    AS days_late,
                COUNT(*) FILTER (WHERE a.status = 'excused') 
                    AS days_excused,
                ROUND(
                    COUNT(*) FILTER (WHERE a.status = 'present') * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                ) AS attendance_percentage
             FROM attendance a
             LEFT JOIN students s ON s.id = a.student_id
             WHERE a.class_id = $1
             AND a.term_id = $2
             GROUP BY s.id, s.first_name, s.last_name, s.admission_number
             ORDER BY s.first_name ASC`,
            [class_id, term_id]
        );

        return res.status(200).json({
            success: true,
            total_students: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get class attendance summary error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};