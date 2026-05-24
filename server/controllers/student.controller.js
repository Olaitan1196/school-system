import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// REGISTER NEW STUDENT
// ============================================
export const registerStudent = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            first_name,
            last_name,
            middle_name,
            date_of_birth,
            gender,
            state_of_origin,
            religion,
            admission_date,
            phone,
            email,
            password
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !gender) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name and gender are required.'
            });
        }

        // Begin transaction
        // A transaction means both inserts must succeed
        // If one fails everything rolls back
        await client.query('BEGIN');

        // Generate admission number
        // Format: CC/YEAR/SEQUENCE e.g CC/2024/001
        const countQuery = await client.query(
            `SELECT COUNT(*) FROM students`
        );
        const count = parseInt(countQuery.rows[0].count) + 1;
        const year = new Date().getFullYear();
        const sequence = String(count).padStart(3, '0');
        const admissionNumber = `CC/${year}/${sequence}`;

        // Create user account if phone or email provided
        let userId = null;
        if (phone || email) {
            const defaultPassword = password || 'student1234';
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
            const passwordHash = await bcrypt.hash(
                defaultPassword,
                saltRounds
            );

            const userResult = await client.query(
                `INSERT INTO users (email, phone, password_hash, role)
                 VALUES ($1, $2, $3, 'student')
                 RETURNING id`,
                [email || null, phone || null, passwordHash]
            );
            userId = userResult.rows[0].id;
        }

        // Create student profile
        const studentResult = await client.query(
            `INSERT INTO students (
                user_id,
                admission_number,
                first_name,
                last_name,
                middle_name,
                date_of_birth,
                gender,
                state_of_origin,
                religion,
                admission_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                userId,
                admissionNumber,
                first_name,
                last_name,
                middle_name || null,
                date_of_birth || null,
                gender,
                state_of_origin || null,
                religion || null,
                admission_date || new Date()
            ]
        );

        // Commit transaction
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
                'registered_student',
                'students',
                'students',
                studentResult.rows[0].id,
                `Admin registered new student: 
                 ${first_name} ${last_name} 
                 (${admissionNumber})`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Student registered successfully.',
            data: studentResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Register student error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// GET ALL STUDENTS
// ============================================
export const getAllStudents = async (req, res) => {
    try {
        const {
            is_active,
            gender,
            search,
            page = 1,
            limit = 20
        } = req.query;

        let conditions = [];
        let values = [];
        let counter = 1;

        if (is_active !== undefined) {
            conditions.push(`s.is_active = $${counter}`);
            values.push(is_active === 'true');
            counter++;
        }

        if (gender) {
            conditions.push(`s.gender = $${counter}`);
            values.push(gender);
            counter++;
        }

        if (search) {
            conditions.push(
                `(s.first_name ILIKE $${counter} 
                OR s.last_name ILIKE $${counter} 
                OR s.admission_number ILIKE $${counter})`
            );
            values.push(`%${search}%`);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const offset = (page - 1) * limit;

        const studentsQuery = await db.query(
            `SELECT s.*,
                    u.email, u.phone, u.is_active AS account_active,
                    e.class_id, e.stream_id,
                    c.class_name,
                    st.stream_name
             FROM students s
             LEFT JOIN users u ON u.id = s.user_id
             LEFT JOIN enrollments e ON e.student_id = s.id
                 AND e.is_active = TRUE
             LEFT JOIN classes c ON c.id = e.class_id
             LEFT JOIN streams st ON st.id = e.stream_id
             ${whereClause}
             ORDER BY s.first_name ASC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        const countQuery = await db.query(
            `SELECT COUNT(*) FROM students s ${whereClause}`,
            values
        );

        const total = parseInt(countQuery.rows[0].count);

        return res.status(200).json({
            success: true,
            data: studentsQuery.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all students error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET SINGLE STUDENT
// ============================================
export const getSingleStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const studentQuery = await db.query(
            `SELECT s.*,
                    u.email, u.phone,
                    u.is_active AS account_active,
                    u.last_login,
                    e.class_id, e.stream_id,
                    c.class_name, c.class_level,
                    st.stream_name,
                    ses.session_name AS current_session
             FROM students s
             LEFT JOIN users u ON u.id = s.user_id
             LEFT JOIN enrollments e ON e.student_id = s.id
                 AND e.is_active = TRUE
             LEFT JOIN classes c ON c.id = e.class_id
             LEFT JOIN streams st ON st.id = e.stream_id
             LEFT JOIN academic_sessions ses ON ses.id = e.session_id
             WHERE s.id = $1`,
            [id]
        );

        if (studentQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        // Get parents
        const parentsQuery = await db.query(
            `SELECT * FROM parents WHERE student_id = $1`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...studentQuery.rows[0],
                parents: parentsQuery.rows
            }
        });

    } catch (error) {
        console.error('Get single student error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// UPDATE STUDENT
// ============================================
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            middle_name,
            date_of_birth,
            gender,
            state_of_origin,
            religion,
            passport_url
        } = req.body;

        // Check student exists
        const studentQuery = await db.query(
            `SELECT id FROM students WHERE id = $1`,
            [id]
        );

        if (studentQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        // Update student
        const updatedStudent = await db.query(
            `UPDATE students SET
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                middle_name = COALESCE($3, middle_name),
                date_of_birth = COALESCE($4, date_of_birth),
                gender = COALESCE($5, gender),
                state_of_origin = COALESCE($6, state_of_origin),
                religion = COALESCE($7, religion),
                passport_url = COALESCE($8, passport_url),
                updated_at = NOW()
             WHERE id = $9
             RETURNING *`,
            [
                first_name || null,
                last_name || null,
                middle_name || null,
                date_of_birth || null,
                gender || null,
                state_of_origin || null,
                religion || null,
                passport_url || null,
                id
            ]
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
                'updated_student',
                'students',
                'students',
                id,
                `Updated student profile: 
                 ${updatedStudent.rows[0].first_name} 
                 ${updatedStudent.rows[0].last_name}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Student updated successfully.',
            data: updatedStudent.rows[0]
        });

    } catch (error) {
        console.error('Update student error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// TOGGLE STUDENT STATUS
// ============================================
export const toggleStudentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const studentQuery = await db.query(
            `SELECT id, is_active, first_name, last_name 
             FROM students WHERE id = $1`,
            [id]
        );

        if (studentQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        const student = studentQuery.rows[0];
        const newStatus = !student.is_active;

        await db.query(
            `UPDATE students 
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
                newStatus ? 'activated_student' : 'deactivated_student',
                'students',
                'students',
                id,
                `${newStatus ? 'Activated' : 'Deactivated'} student: 
                 ${student.first_name} ${student.last_name}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Student ${newStatus
                ? 'activated'
                : 'deactivated'} successfully.`,
            data: { id, is_active: newStatus }
        });

    } catch (error) {
        console.error('Toggle student status error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ADD PARENT TO STUDENT
// ============================================
export const addParent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            relationship,
            first_name,
            last_name,
            phone,
            email,
            address,
            occupation,
            is_primary_contact
        } = req.body;

        if (!relationship || !first_name || !last_name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Relationship, first name, last name and phone are required.'
            });
        }

        // Check student exists
        const studentQuery = await db.query(
            `SELECT id FROM students WHERE id = $1`,
            [id]
        );

        if (studentQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        // If this is primary contact unset others
        if (is_primary_contact) {
            await db.query(
                `UPDATE parents 
                 SET is_primary_contact = FALSE 
                 WHERE student_id = $1`,
                [id]
            );
        }

        const parentResult = await db.query(
            `INSERT INTO parents (
                student_id,
                relationship,
                first_name,
                last_name,
                phone,
                email,
                address,
                occupation,
                is_primary_contact
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                id,
                relationship,
                first_name,
                last_name,
                phone,
                email || null,
                address || null,
                occupation || null,
                is_primary_contact || false
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Parent added successfully.',
            data: parentResult.rows[0]
        });

    } catch (error) {
        console.error('Add parent error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};