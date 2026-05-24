import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// CREATE ACADEMIC SESSION
// ============================================
export const createSession = async (req, res) => {
    try {
        const { session_name, start_date, end_date, is_current } = req.body;

        if (!session_name || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Session name, start date and end date are required.'
            });
        }

        // If this is current session unset others
        if (is_current) {
            await db.query(
                `UPDATE academic_sessions 
                 SET is_current = FALSE`
            );
        }

        const result = await db.query(
            `INSERT INTO academic_sessions 
             (session_name, start_date, end_date, is_current)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [session_name, start_date, end_date, is_current || false]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'created_session',
                'settings',
                'academic_sessions',
                result.rows[0].id,
                `Created academic session: ${session_name}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Academic session created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create session error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL SESSIONS
// ============================================
export const getAllSessions = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM academic_sessions
             ORDER BY start_date DESC`
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get sessions error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CREATE TERM
// ============================================
export const createTerm = async (req, res) => {
    try {
        const {
            session_id,
            term_name,
            start_date,
            end_date,
            is_current
        } = req.body;

        if (!session_id || !term_name || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Session, term name, start date and end date are required.'
            });
        }

        // Check session exists
        const sessionQuery = await db.query(
            `SELECT id FROM academic_sessions WHERE id = $1`,
            [session_id]
        );

        if (sessionQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Academic session not found.'
            });
        }

        // If this is current term unset others
        if (is_current) {
            await db.query(
                `UPDATE terms SET is_current = FALSE`
            );
        }

        const result = await db.query(
            `INSERT INTO terms
             (session_id, term_name, start_date, end_date, is_current)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [session_id, term_name, start_date, end_date, is_current || false]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'created_term',
                'settings',
                'terms',
                result.rows[0].id,
                `Created term: ${term_name}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Term created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create term error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL TERMS
// ============================================
export const getAllTerms = async (req, res) => {
    try {
        const { session_id } = req.query;

        let query = `SELECT t.*, s.session_name
                     FROM terms t
                     LEFT JOIN academic_sessions s ON s.id = t.session_id`;
        let values = [];

        if (session_id) {
            query += ` WHERE t.session_id = $1`;
            values.push(session_id);
        }

        query += ` ORDER BY t.start_date ASC`;

        const result = await db.query(query, values);

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get terms error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CREATE CLASS
// ============================================
export const createClass = async (req, res) => {
    try {
        const { class_name, class_level, class_number } = req.body;

        if (!class_name || !class_level || !class_number) {
            return res.status(400).json({
                success: false,
                message: 'Class name, level and number are required.'
            });
        }

        // Check if class already exists
        const existingClass = await db.query(
            `SELECT id FROM classes
             WHERE class_level = $1 AND class_number = $2`,
            [class_level, class_number]
        );

        if (existingClass.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This class already exists.'
            });
        }

        const result = await db.query(
            `INSERT INTO classes (class_name, class_level, class_number)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [class_name, class_level, class_number]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'created_class',
                'settings',
                'classes',
                result.rows[0].id,
                `Created class: ${class_name}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Class created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create class error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL CLASSES
// ============================================
export const getAllClasses = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.*,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', s.id,
                            'stream_name', s.stream_name
                        )
                    ) FILTER (WHERE s.id IS NOT NULL) AS streams
             FROM classes c
             LEFT JOIN streams s ON s.class_id = c.id
             GROUP BY c.id
             ORDER BY c.class_level ASC, c.class_number ASC`
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get classes error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CREATE STREAM
// ============================================
export const createStream = async (req, res) => {
    try {
        const { stream_name, class_id } = req.body;

        if (!stream_name || !class_id) {
            return res.status(400).json({
                success: false,
                message: 'Stream name and class are required.'
            });
        }

        // Check class exists
        const classQuery = await db.query(
            `SELECT id, class_level FROM classes WHERE id = $1`,
            [class_id]
        );

        if (classQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found.'
            });
        }

        // Streams only for SSS
        if (classQuery.rows[0].class_level !== 'SSS') {
            return res.status(400).json({
                success: false,
                message: 'Streams can only be created for SSS classes.'
            });
        }

        // Check if stream already exists for this class
        const existingStream = await db.query(
            `SELECT id FROM streams
             WHERE stream_name = $1 AND class_id = $2`,
            [stream_name, class_id]
        );

        if (existingStream.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This stream already exists for this class.'
            });
        }

        const result = await db.query(
            `INSERT INTO streams (stream_name, class_id)
             VALUES ($1, $2)
             RETURNING *`,
            [stream_name, class_id]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'created_stream',
                'settings',
                'streams',
                result.rows[0].id,
                `Created stream: ${stream_name}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Stream created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create stream error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CREATE SUBJECT
// ============================================
export const createSubject = async (req, res) => {
    try {
        const { subject_name, subject_code } = req.body;

        if (!subject_name || !subject_code) {
            return res.status(400).json({
                success: false,
                message: 'Subject name and code are required.'
            });
        }

        // Check if subject code already exists
        const existingSubject = await db.query(
            `SELECT id FROM subjects WHERE subject_code = $1`,
            [subject_code]
        );

        if (existingSubject.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Subject code already exists.'
            });
        }

        const result = await db.query(
            `INSERT INTO subjects (subject_name, subject_code)
             VALUES ($1, $2)
             RETURNING *`,
            [subject_name, subject_code]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'created_subject',
                'subjects',
                'subjects',
                result.rows[0].id,
                `Created subject: ${subject_name} (${subject_code})`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Subject created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create subject error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL SUBJECTS
// ============================================
export const getAllSubjects = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM subjects
             ORDER BY subject_name ASC`
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get subjects error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ASSIGN SUBJECT TO CLASS
// ============================================
export const assignSubjectToClass = async (req, res) => {
    try {
        const {
            class_id,
            subject_id,
            stream_id,
            is_compulsory
        } = req.body;

        if (!class_id || !subject_id) {
            return res.status(400).json({
                success: false,
                message: 'Class and subject are required.'
            });
        }

        // Check if already assigned
        const existing = await db.query(
            `SELECT id FROM class_subjects
             WHERE class_id = $1
             AND subject_id = $2
             AND stream_id IS NOT DISTINCT FROM $3`,
            [class_id, subject_id, stream_id || null]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Subject already assigned to this class.'
            });
        }

        const result = await db.query(
            `INSERT INTO class_subjects
             (class_id, subject_id, stream_id, is_compulsory)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                class_id,
                subject_id,
                stream_id || null,
                is_compulsory !== undefined ? is_compulsory : true
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Subject assigned to class successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Assign subject error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET SUBJECTS FOR A CLASS
// ============================================
export const getClassSubjects = async (req, res) => {
    try {
        const { class_id } = req.params;
        const { stream_id } = req.query;

        let query = `
            SELECT cs.*,
                   s.subject_name,
                   s.subject_code,
                   c.class_name,
                   st.stream_name
            FROM class_subjects cs
            LEFT JOIN subjects s ON s.id = cs.subject_id
            LEFT JOIN classes c ON c.id = cs.class_id
            LEFT JOIN streams st ON st.id = cs.stream_id
            WHERE cs.class_id = $1
        `;
        let values = [class_id];

        if (stream_id) {
            query += ` AND cs.stream_id = $2`;
            values.push(stream_id);
        }

        query += ` ORDER BY s.subject_name ASC`;

        const result = await db.query(query, values);

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get class subjects error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ENROLL STUDENT INTO CLASS
// ============================================
export const enrollStudent = async (req, res) => {
    try {
        const {
            student_id,
            class_id,
            stream_id,
            session_id
        } = req.body;

        if (!student_id || !class_id || !session_id) {
            return res.status(400).json({
                success: false,
                message: 'Student, class and session are required.'
            });
        }

        // Check if student is already enrolled this session
        const existing = await db.query(
            `SELECT id FROM enrollments
             WHERE student_id = $1 AND session_id = $2`,
            [student_id, session_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Student is already enrolled for this session.'
            });
        }

        const result = await db.query(
            `INSERT INTO enrollments
             (student_id, class_id, stream_id, session_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [student_id, class_id, stream_id || null, session_id]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'enrolled_student',
                'students',
                'enrollments',
                result.rows[0].id,
                `Enrolled student into class`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Student enrolled successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Enroll student error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET STUDENTS IN A CLASS
// ============================================
export const getClassStudents = async (req, res) => {
    try {
        const { class_id } = req.params;
        const { session_id, stream_id } = req.query;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required.'
            });
        }

        let query = `
            SELECT e.*,
                   s.first_name, s.last_name,
                   s.middle_name, s.admission_number,
                   s.gender, s.passport_url,
                   c.class_name,
                   st.stream_name,
                   ses.session_name
            FROM enrollments e
            LEFT JOIN students s ON s.id = e.student_id
            LEFT JOIN classes c ON c.id = e.class_id
            LEFT JOIN streams st ON st.id = e.stream_id
            LEFT JOIN academic_sessions ses ON ses.id = e.session_id
            WHERE e.class_id = $1 AND e.session_id = $2
        `;
        let values = [class_id, session_id];

        if (stream_id) {
            query += ` AND e.stream_id = $3`;
            values.push(stream_id);
        }

        query += ` ORDER BY s.first_name ASC`;

        const result = await db.query(query, values);

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get class students error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};