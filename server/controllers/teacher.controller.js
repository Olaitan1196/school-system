import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// REGISTER NEW TEACHER
// ============================================
export const registerTeacher = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            first_name,
            last_name,
            middle_name,
            date_of_birth,
            gender,
            phone,
            email,
            address,
            qualification,
            specialization,
            date_joined,
            password,
            role
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !gender || !phone) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, gender and phone are required.'
            });
        }

        // Validate role
        const validRoles = ['class_teacher', 'subject_teacher'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Teacher role must be class_teacher or subject_teacher.'
            });
        }

        // Begin transaction
        await client.query('BEGIN');

        // Generate staff ID
        // Format: CC/TCH/YEAR/SEQUENCE e.g CC/TCH/2024/001
        const countQuery = await client.query(
            `SELECT COUNT(*) FROM teachers`
        );
        const count = parseInt(countQuery.rows[0].count) + 1;
        const year = new Date().getFullYear();
        const sequence = String(count).padStart(3, '0');
        const staffId = `CC/TCH/${year}/${sequence}`;

        // Check if phone already exists
        const phoneExists = await client.query(
            `SELECT id FROM users WHERE phone = $1`,
            [phone]
        );
        if (phoneExists.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Phone number already exists.'
            });
        }

        // Check if email already exists
        if (email) {
            const emailExists = await client.query(
                `SELECT id FROM users WHERE email = $1`,
                [email]
            );
            if (emailExists.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists.'
                });
            }
        }

        // Create user account
        const defaultPassword = password || 'teacher1234';
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

        const userResult = await client.query(
            `INSERT INTO users (email, phone, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [
                email || null,
                phone,
                passwordHash,
                role || 'subject_teacher'
            ]
        );
        const userId = userResult.rows[0].id;

        // Create teacher profile
        const teacherResult = await client.query(
            `INSERT INTO teachers (
                user_id,
                staff_id,
                first_name,
                last_name,
                middle_name,
                date_of_birth,
                gender,
                phone,
                address,
                qualification,
                specialization,
                date_joined
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                userId,
                staffId,
                first_name,
                last_name,
                middle_name || null,
                date_of_birth || null,
                gender,
                phone,
                address || null,
                qualification || null,
                specialization || null,
                date_joined || new Date()
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
                'registered_teacher',
                'teachers',
                'teachers',
                teacherResult.rows[0].id,
                `Admin registered new teacher: 
                 ${first_name} ${last_name} 
                 (${staffId})`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Teacher registered successfully.',
            data: teacherResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Register teacher error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// GET ALL TEACHERS
// ============================================
export const getAllTeachers = async (req, res) => {
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
            conditions.push(`t.is_active = $${counter}`);
            values.push(is_active === 'true');
            counter++;
        }

        if (gender) {
            conditions.push(`t.gender = $${counter}`);
            values.push(gender);
            counter++;
        }

        if (search) {
            conditions.push(
                `(t.first_name ILIKE $${counter}
                OR t.last_name ILIKE $${counter}
                OR t.staff_id ILIKE $${counter}
                OR t.specialization ILIKE $${counter})`
            );
            values.push(`%${search}%`);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const offset = (page - 1) * limit;

        const teachersQuery = await db.query(
            `SELECT t.*,
                    u.email, u.role,
                    u.is_active AS account_active,
                    u.last_login
             FROM teachers t
             LEFT JOIN users u ON u.id = t.user_id
             ${whereClause}
             ORDER BY t.first_name ASC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        const countQuery = await db.query(
            `SELECT COUNT(*) FROM teachers t ${whereClause}`,
            values
        );

        const total = parseInt(countQuery.rows[0].count);

        return res.status(200).json({
            success: true,
            data: teachersQuery.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all teachers error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET SINGLE TEACHER
// ============================================
export const getSingleTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        const teacherQuery = await db.query(
            `SELECT t.*,
                    u.email, u.role,
                    u.is_active AS account_active,
                    u.last_login
             FROM teachers t
             LEFT JOIN users u ON u.id = t.user_id
             WHERE t.id = $1`,
            [id]
        );

        if (teacherQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });
        }

        // Get teacher assignments
        const assignmentsQuery = await db.query(
            `SELECT ta.*,
                    s.subject_name,
                    c.class_name,
                    st.stream_name,
                    ses.session_name
             FROM teacher_assignments ta
             LEFT JOIN subjects s ON s.id = ta.subject_id
             LEFT JOIN classes c ON c.id = ta.class_id
             LEFT JOIN streams st ON st.id = ta.stream_id
             LEFT JOIN academic_sessions ses ON ses.id = ta.session_id
             WHERE ta.teacher_id = $1
             ORDER BY ses.session_name DESC`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...teacherQuery.rows[0],
                assignments: assignmentsQuery.rows
            }
        });

    } catch (error) {
        console.error('Get single teacher error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// UPDATE TEACHER
// ============================================
export const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            middle_name,
            date_of_birth,
            gender,
            phone,
            address,
            qualification,
            specialization,
            passport_url
        } = req.body;

        // Check teacher exists
        const teacherQuery = await db.query(
            `SELECT id FROM teachers WHERE id = $1`,
            [id]
        );

        if (teacherQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });
        }

        const updatedTeacher = await db.query(
            `UPDATE teachers SET
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                middle_name = COALESCE($3, middle_name),
                date_of_birth = COALESCE($4, date_of_birth),
                gender = COALESCE($5, gender),
                phone = COALESCE($6, phone),
                address = COALESCE($7, address),
                qualification = COALESCE($8, qualification),
                specialization = COALESCE($9, specialization),
                passport_url = COALESCE($10, passport_url),
                updated_at = NOW()
             WHERE id = $11
             RETURNING *`,
            [
                first_name || null,
                last_name || null,
                middle_name || null,
                date_of_birth || null,
                gender || null,
                phone || null,
                address || null,
                qualification || null,
                specialization || null,
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
                'updated_teacher',
                'teachers',
                'teachers',
                id,
                `Updated teacher profile: 
                 ${updatedTeacher.rows[0].first_name} 
                 ${updatedTeacher.rows[0].last_name}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Teacher updated successfully.',
            data: updatedTeacher.rows[0]
        });

    } catch (error) {
        console.error('Update teacher error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// TOGGLE TEACHER STATUS
// ============================================
export const toggleTeacherStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const teacherQuery = await db.query(
            `SELECT id, is_active, first_name, last_name
             FROM teachers WHERE id = $1`,
            [id]
        );

        if (teacherQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });
        }

        const teacher = teacherQuery.rows[0];
        const newStatus = !teacher.is_active;

        await db.query(
            `UPDATE teachers
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
                newStatus ? 'activated_teacher' : 'deactivated_teacher',
                'teachers',
                'teachers',
                id,
                `${newStatus ? 'Activated' : 'Deactivated'} teacher:
                 ${teacher.first_name} ${teacher.last_name}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Teacher ${newStatus
                ? 'activated'
                : 'deactivated'} successfully.`,
            data: { id, is_active: newStatus }
        });

    } catch (error) {
        console.error('Toggle teacher status error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ASSIGN TEACHER TO CLASS AND SUBJECT
// ============================================
export const assignTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            subject_id,
            class_id,
            stream_id,
            session_id,
            is_class_teacher
        } = req.body;

        if (!subject_id || !class_id || !session_id) {
            return res.status(400).json({
                success: false,
                message: 'Subject, class and session are required.'
            });
        }

        // Check teacher exists
        const teacherQuery = await db.query(
            `SELECT id, first_name, last_name
             FROM teachers WHERE id = $1`,
            [id]
        );

        if (teacherQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });
        }

        // Check if assignment already exists
        const existingAssignment = await db.query(
            `SELECT id FROM teacher_assignments
             WHERE subject_id = $1
             AND class_id = $2
             AND session_id = $3
             AND stream_id IS NOT DISTINCT FROM $4`,
            [subject_id, class_id, session_id, stream_id || null]
        );

        if (existingAssignment.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A teacher is already assigned to this subject in this class for this session.'
            });
        }

        // If is_class_teacher is true
        // make sure no other teacher is class teacher
        // for this class in this session
        if (is_class_teacher) {
            await db.query(
                `UPDATE teacher_assignments
                 SET is_class_teacher = FALSE
                 WHERE class_id = $1
                 AND session_id = $2`,
                [class_id, session_id]
            );
        }

        const assignmentResult = await db.query(
            `INSERT INTO teacher_assignments (
                teacher_id,
                subject_id,
                class_id,
                stream_id,
                session_id,
                is_class_teacher
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                id,
                subject_id,
                class_id,
                stream_id || null,
                session_id,
                is_class_teacher || false
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
                'assigned_teacher',
                'teachers',
                'teacher_assignments',
                assignmentResult.rows[0].id,
                `Assigned teacher ${teacherQuery.rows[0].first_name} 
                 ${teacherQuery.rows[0].last_name} 
                 to class and subject`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Teacher assigned successfully.',
            data: assignmentResult.rows[0]
        });

    } catch (error) {
        console.error('Assign teacher error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// REMOVE TEACHER ASSIGNMENT
// ============================================
export const removeAssignment = async (req, res) => {
    try {
        const { assignment_id } = req.params;

        const assignmentQuery = await db.query(
            `SELECT id FROM teacher_assignments WHERE id = $1`,
            [assignment_id]
        );

        if (assignmentQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found.'
            });
        }

        await db.query(
            `DELETE FROM teacher_assignments WHERE id = $1`,
            [assignment_id]
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
                'removed_teacher_assignment',
                'teachers',
                'teacher_assignments',
                assignment_id,
                `Removed teacher assignment`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Teacher assignment removed successfully.'
        });

    } catch (error) {
        console.error('Remove assignment error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};

// ============================================
// DELETE TEACHER
// ============================================
export const deleteTeacher = async (req, res) => {
    const client = await db.connect();
    try {
        const { id } = req.params;

        const teacherQuery = await db.query(
            `SELECT t.id, t.first_name, t.last_name,
                    t.user_id
             FROM teachers t WHERE t.id = $1`,
            [id]
        );

        if (teacherQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });
        }

        const teacher = teacherQuery.rows[0];

        await client.query('BEGIN');

        // Delete teacher record
        await client.query(
            `DELETE FROM teachers WHERE id = $1`,
            [id]
        );

        // Delete user account if exists
        if (teacher.user_id) {
            await client.query(
                `DELETE FROM users WHERE id = $1`,
                [teacher.user_id]
            );
        }

        await client.query('COMMIT');

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'deleted_teacher',
                'teachers',
                'teachers',
                id,
                `Deleted teacher: ${teacher.first_name} 
                 ${teacher.last_name}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Teacher deleted successfully.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete teacher error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};