import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// GRADING ENGINE
// ============================================
// This function takes a score and returns
// the grade and remark automatically

const getGradeAndRemark = (score) => {
    if (score >= 70) return { grade: 'A', remark: 'Excellent' };
    if (score >= 60) return { grade: 'B', remark: 'Very Good' };
    if (score >= 50) return { grade: 'C', remark: 'Good' };
    if (score >= 45) return { grade: 'D', remark: 'Pass' };
    if (score >= 40) return { grade: 'E', remark: 'Poor' };
    return { grade: 'F', remark: 'Fail' };
};


// ============================================
// GET POSITION SUFFIX
// ============================================
// Converts 1 to 1st, 2 to 2nd, 3 to 3rd etc

const getPositionSuffix = (position) => {
    if (position >= 11 && position <= 13) return 'th';
    const lastDigit = position % 10;
    if (lastDigit === 1) return 'st';
    if (lastDigit === 2) return 'nd';
    if (lastDigit === 3) return 'rd';
    return 'th';
};


// ============================================
// ENTER OR UPDATE SCORES
// ============================================
export const enterScores = async (req, res) => {
    try {
        const {
            student_id,
            subject_id,
            class_id,
            stream_id,
            session_id,
            term_id,
            ca1_score,
            ca2_score,
            ca3_score,
            exam_score,
            is_absent
        } = req.body;

        if (
            !student_id || !subject_id ||
            !class_id || !session_id || !term_id
        ) {
            return res.status(400).json({
                success: false,
                message: 'Student, subject, class, session and term are required.'
            });
        }

        // Calculate total
        const ca1 = parseFloat(ca1_score) || 0;
        const ca2 = parseFloat(ca2_score) || 0;
        const ca3 = parseFloat(ca3_score) || 0;
        const exam = parseFloat(exam_score) || 0;
        const total = ca1 + ca2 + ca3 + exam;

        // Get grade and remark
        const { grade, remark } = getGradeAndRemark(total);

        // Insert or update scores
        const result = await db.query(
            `INSERT INTO scores (
                student_id, subject_id, class_id,
                stream_id, session_id, term_id,
                ca1_score, ca2_score, ca3_score,
                exam_score, grade, remark, is_absent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (student_id, subject_id, term_id)
            DO UPDATE SET
                ca1_score = EXCLUDED.ca1_score,
                ca2_score = EXCLUDED.ca2_score,
                ca3_score = EXCLUDED.ca3_score,
                exam_score = EXCLUDED.exam_score,
                grade = EXCLUDED.grade,
                remark = EXCLUDED.remark,
                is_absent = EXCLUDED.is_absent,
                updated_at = NOW()
            RETURNING *`,
            [
                student_id, subject_id, class_id,
                stream_id || null, session_id, term_id,
                ca1, ca2, ca3, exam, grade, remark,
                is_absent || false
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
                'entered_scores',
                'scores',
                'scores',
                result.rows[0].id,
                `Entered scores for student`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Scores saved successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Enter scores error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ENTER SCORES IN BULK
// ============================================
// This allows a teacher to enter scores for
// all students in a class at once

export const enterBulkScores = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            subject_id,
            class_id,
            stream_id,
            session_id,
            term_id,
            scores
        } = req.body;

        // scores is an array like this:
        // [
        //   { student_id, ca1_score, ca2_score,
        //     ca3_score, exam_score, is_absent },
        //   ...
        // ]

        if (!subject_id || !class_id || !session_id || !term_id) {
            return res.status(400).json({
                success: false,
                message: 'Subject, class, session and term are required.'
            });
        }

        if (!scores || !Array.isArray(scores) || scores.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Scores array is required.'
            });
        }

        await client.query('BEGIN');

        const savedScores = [];

        for (const scoreEntry of scores) {
            const {
                student_id,
                ca1_score,
                ca2_score,
                ca3_score,
                exam_score,
                is_absent
            } = scoreEntry;

            const ca1 = parseFloat(ca1_score) || 0;
            const ca2 = parseFloat(ca2_score) || 0;
            const ca3 = parseFloat(ca3_score) || 0;
            const exam = parseFloat(exam_score) || 0;
            const total = ca1 + ca2 + ca3 + exam;

            const { grade, remark } = getGradeAndRemark(total);

            const result = await client.query(
                `INSERT INTO scores (
                    student_id, subject_id, class_id,
                    stream_id, session_id, term_id,
                    ca1_score, ca2_score, ca3_score,
                    exam_score, grade, remark, is_absent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (student_id, subject_id, term_id)
                DO UPDATE SET
                    ca1_score = EXCLUDED.ca1_score,
                    ca2_score = EXCLUDED.ca2_score,
                    ca3_score = EXCLUDED.ca3_score,
                    exam_score = EXCLUDED.exam_score,
                    grade = EXCLUDED.grade,
                    remark = EXCLUDED.remark,
                    is_absent = EXCLUDED.is_absent,
                    updated_at = NOW()
                RETURNING *`,
                [
                    student_id, subject_id, class_id,
                    stream_id || null, session_id, term_id,
                    ca1, ca2, ca3, exam, grade, remark,
                    is_absent || false
                ]
            );

            savedScores.push(result.rows[0]);
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
                'entered_bulk_scores',
                'scores',
                'scores',
                null,
                `Entered bulk scores for ${savedScores.length} students`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Scores saved for ${savedScores.length} students.`,
            data: savedScores
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Bulk scores error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// GET SCORES FOR A CLASS
// ============================================
export const getClassScores = async (req, res) => {
    try {
        const { class_id, subject_id, term_id } = req.query;

        if (!class_id || !subject_id || !term_id) {
            return res.status(400).json({
                success: false,
                message: 'Class, subject and term are required.'
            });
        }

        const result = await db.query(
            `SELECT sc.*,
                    st.first_name, st.last_name,
                    st.admission_number,
                    sub.subject_name,
                    c.class_name,
                    t.term_name
             FROM scores sc
             LEFT JOIN students st ON st.id = sc.student_id
             LEFT JOIN subjects sub ON sub.id = sc.subject_id
             LEFT JOIN classes c ON c.id = sc.class_id
             LEFT JOIN terms t ON t.id = sc.term_id
             WHERE sc.class_id = $1
             AND sc.subject_id = $2
             AND sc.term_id = $3
             ORDER BY st.first_name ASC`,
            [class_id, subject_id, term_id]
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get class scores error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET SCORES FOR A STUDENT
// ============================================
export const getStudentScores = async (req, res) => {
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
            `SELECT sc.*,
                    sub.subject_name,
                    sub.subject_code,
                    t.term_name,
                    s.session_name
             FROM scores sc
             LEFT JOIN subjects sub ON sub.id = sc.subject_id
             LEFT JOIN terms t ON t.id = sc.term_id
             LEFT JOIN academic_sessions s ON s.id = sc.session_id
             WHERE sc.student_id = $1
             AND sc.term_id = $2
             ORDER BY sub.subject_name ASC`,
            [student_id, term_id]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get student scores error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GENERATE REPORT CARDS FOR A CLASS
// ============================================
// This calculates totals, averages and
// generates report card records for every
// student in a class for a specific term

export const generateReportCards = async (req, res) => {
    const client = await db.connect();
    try {
        const { class_id, session_id, term_id, stream_id } = req.body;

        if (!class_id || !session_id || !term_id) {
            return res.status(400).json({
                success: false,
                message: 'Class, session and term are required.'
            });
        }

        await client.query('BEGIN');

        // Get all students in this class for this session
        let enrollQuery = `
            SELECT e.student_id
            FROM enrollments e
            WHERE e.class_id = $1
            AND e.session_id = $2
            AND e.is_active = TRUE
        `;
        let enrollValues = [class_id, session_id];

        if (stream_id) {
            enrollQuery += ` AND e.stream_id = $3`;
            enrollValues.push(stream_id);
        }

        const enrollments = await client.query(
            enrollQuery,
            enrollValues
        );

        if (enrollments.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'No students found in this class for this session.'
            });
        }

        const reportCards = [];

        for (const enrollment of enrollments.rows) {
            const { student_id } = enrollment;

            // Get all scores for this student this term
            const scoresQuery = await client.query(
                `SELECT total_score FROM scores
                 WHERE student_id = $1
                 AND term_id = $2
                 AND class_id = $3`,
                [student_id, term_id, class_id]
            );

            const scores = scoresQuery.rows;
            const numberOfSubjects = scores.length;

            if (numberOfSubjects === 0) continue;

            const totalObtained = scores.reduce(
                (sum, s) => sum + parseFloat(s.total_score), 0
            );
            const totalObtainable = numberOfSubjects * 100;
            const average = totalObtained / numberOfSubjects;

            // Insert or update report card
            const reportCard = await client.query(
                `INSERT INTO report_cards (
                    student_id, class_id, stream_id,
                    session_id, term_id,
                    total_score_obtained,
                    total_score_obtainable,
                    average_score,
                    number_of_subjects,
                    is_published
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
                ON CONFLICT (student_id, term_id)
                DO UPDATE SET
                    total_score_obtained = EXCLUDED.total_score_obtained,
                    total_score_obtainable = EXCLUDED.total_score_obtainable,
                    average_score = EXCLUDED.average_score,
                    number_of_subjects = EXCLUDED.number_of_subjects,
                    updated_at = NOW()
                RETURNING *`,
                [
                    student_id, class_id, stream_id || null,
                    session_id, term_id,
                    totalObtained.toFixed(2),
                    totalObtainable,
                    average.toFixed(2),
                    numberOfSubjects
                ]
            );

            reportCards.push(reportCard.rows[0]);
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
                'generated_report_cards',
                'results',
                'report_cards',
                null,
                `Generated report cards for ${reportCards.length} students`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Report cards generated for ${reportCards.length} students.`,
            data: reportCards
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Generate report cards error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// CALCULATE CLASS RANKINGS
// ============================================
export const calculateRankings = async (req, res) => {
    const client = await db.connect();
    try {
        const { class_id, session_id, term_id, stream_id } = req.body;

        if (!class_id || !session_id || !term_id) {
            return res.status(400).json({
                success: false,
                message: 'Class, session and term are required.'
            });
        }

        await client.query('BEGIN');

        // Get all report cards for this class this term
        let query = `
            SELECT rc.student_id,
                   rc.total_score_obtained,
                   rc.average_score
            FROM report_cards rc
            WHERE rc.class_id = $1
            AND rc.session_id = $2
            AND rc.term_id = $3
        `;
        let values = [class_id, session_id, term_id];

        if (stream_id) {
            query += ` AND rc.stream_id = $4`;
            values.push(stream_id);
        }

        query += ` ORDER BY rc.total_score_obtained DESC`;

        const reportCards = await client.query(query, values);

        if (reportCards.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'No report cards found. Generate report cards first.'
            });
        }

        const totalStudents = reportCards.rows.length;
        const rankings = [];

        for (let i = 0; i < reportCards.rows.length; i++) {
            const card = reportCards.rows[i];
            const position = i + 1;
            const suffix = getPositionSuffix(position);

            // Insert or update ranking
            const ranking = await client.query(
                `INSERT INTO class_rankings (
                    student_id, class_id, stream_id,
                    session_id, term_id,
                    total_score, average_score,
                    position, total_students
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (student_id, term_id)
                DO UPDATE SET
                    total_score = EXCLUDED.total_score,
                    average_score = EXCLUDED.average_score,
                    position = EXCLUDED.position,
                    total_students = EXCLUDED.total_students,
                    updated_at = NOW()
                RETURNING *`,
                [
                    card.student_id,
                    class_id,
                    stream_id || null,
                    session_id,
                    term_id,
                    card.total_score_obtained,
                    card.average_score,
                    position,
                    totalStudents
                ]
            );

            // Update position in report card
            await client.query(
                `UPDATE report_cards
                 SET position_in_class = $1,
                     position_suffix = $2,
                     updated_at = NOW()
                 WHERE student_id = $3
                 AND term_id = $4`,
                [position, suffix, card.student_id, term_id]
            );

            rankings.push(ranking.rows[0]);
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
                'calculated_rankings',
                'results',
                'class_rankings',
                null,
                `Calculated rankings for ${totalStudents} students`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Rankings calculated for ${totalStudents} students.`,
            data: rankings
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Calculate rankings error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// ADD TEACHER AND PRINCIPAL REMARKS
// ============================================
export const addRemarks = async (req, res) => {
    try {
        const { student_id, term_id } = req.params;
        const {
            class_teacher_remark,
            principal_remark,
            next_term_begins
        } = req.body;

        const result = await db.query(
            `UPDATE report_cards
             SET class_teacher_remark = COALESCE($1, class_teacher_remark),
                 principal_remark = COALESCE($2, principal_remark),
                 next_term_begins = COALESCE($3, next_term_begins),
                 updated_at = NOW()
             WHERE student_id = $4 AND term_id = $5
             RETURNING *`,
            [
                class_teacher_remark || null,
                principal_remark || null,
                next_term_begins || null,
                student_id,
                term_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report card not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Remarks added successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Add remarks error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// PUBLISH RESULTS
// ============================================
export const publishResults = async (req, res) => {
    try {
        const { class_id, term_id, session_id } = req.body;

        if (!class_id || !term_id || !session_id) {
            return res.status(400).json({
                success: false,
                message: 'Class, term and session are required.'
            });
        }

        const result = await db.query(
            `UPDATE report_cards
             SET is_published = TRUE,
                 date_issued = NOW(),
                 updated_at = NOW()
             WHERE class_id = $1
             AND term_id = $2
             AND session_id = $3
             RETURNING id`,
            [class_id, term_id, session_id]
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
                'published_results',
                'results',
                'report_cards',
                null,
                `Published results for ${result.rows.length} students`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Results published for ${result.rows.length} students.`
        });

    } catch (error) {
        console.error('Publish results error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET STUDENT FULL REPORT CARD
// ============================================
export const getStudentReportCard = async (req, res) => {
    try {
        const { student_id, term_id } = req.params;

        // Get report card
        const reportCard = await db.query(
            `SELECT rc.*,
                    s.first_name, s.last_name,
                    s.middle_name, s.admission_number,
                    s.passport_url, s.gender,
                    s.date_of_birth,
                    c.class_name,
                    st.stream_name,
                    t.term_name,
                    ses.session_name
             FROM report_cards rc
             LEFT JOIN students s ON s.id = rc.student_id
             LEFT JOIN classes c ON c.id = rc.class_id
             LEFT JOIN streams st ON st.id = rc.stream_id
             LEFT JOIN terms t ON t.id = rc.term_id
             LEFT JOIN academic_sessions ses ON ses.id = rc.session_id
             WHERE rc.student_id = $1
             AND rc.term_id = $2`,
            [student_id, term_id]
        );

        if (reportCard.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report card not found.'
            });
        }

        // Get all scores for this term
        const scores = await db.query(
            `SELECT sc.*,
                    sub.subject_name,
                    sub.subject_code
             FROM scores sc
             LEFT JOIN subjects sub ON sub.id = sc.subject_id
             WHERE sc.student_id = $1
             AND sc.term_id = $2
             ORDER BY sub.subject_name ASC`,
            [student_id, term_id]
        );

        // Get attendance summary
        const attendance = await db.query(
            `SELECT
                COUNT(*) AS total_days,
                COUNT(*) FILTER (WHERE status = 'present') AS days_present,
                COUNT(*) FILTER (WHERE status = 'absent') AS days_absent,
                COUNT(*) FILTER (WHERE status = 'late') AS days_late,
                COUNT(*) FILTER (WHERE status = 'excused') AS days_excused
             FROM attendance
             WHERE student_id = $1
             AND term_id = $2`,
            [student_id, term_id]
        );

        return res.status(200).json({
            success: true,
            data: {
                report_card: reportCard.rows[0],
                scores: scores.rows,
                attendance: attendance.rows[0]
            }
        });

    } catch (error) {
        console.error('Get report card error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ADMIN VIEW ANY STUDENT RESULT
// ============================================
export const adminViewResult = async (req, res) => {
    try {
        const { student_id, term_id } = req.params;

        const reportCard = await db.query(
            `SELECT rc.*,
                    s.first_name, s.last_name,
                    s.middle_name, s.admission_number,
                    s.passport_url, s.gender,
                    c.class_name,
                    st.stream_name,
                    t.term_name,
                    ses.session_name
             FROM report_cards rc
             LEFT JOIN students s ON s.id = rc.student_id
             LEFT JOIN classes c ON c.id = rc.class_id
             LEFT JOIN streams st ON st.id = rc.stream_id
             LEFT JOIN terms t ON t.id = rc.term_id
             LEFT JOIN academic_sessions ses ON ses.id = rc.session_id
             WHERE rc.student_id = $1
             AND rc.term_id = $2`,
            [student_id, term_id]
        );

        if (reportCard.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report card not found.'
            });
        }

        const scores = await db.query(
            `SELECT sc.*,
                    sub.subject_name,
                    sub.subject_code
             FROM scores sc
             LEFT JOIN subjects sub ON sub.id = sc.subject_id
             WHERE sc.student_id = $1
             AND sc.term_id = $2
             ORDER BY sub.subject_name ASC`,
            [student_id, term_id]
        );

        const attendance = await db.query(
            `SELECT
                COUNT(*) AS total_days,
                COUNT(*) FILTER (WHERE status = 'present') AS days_present,
                COUNT(*) FILTER (WHERE status = 'absent') AS days_absent,
                COUNT(*) FILTER (WHERE status = 'late') AS days_late
             FROM attendance
             WHERE student_id = $1
             AND term_id = $2`,
            [student_id, term_id]
        );

        // Log admin view
        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'viewed_result',
                'results',
                'report_cards',
                reportCard.rows[0].id,
                `Admin viewed result for student`
            ]
        );

        return res.status(200).json({
            success: true,
            data: {
                report_card: reportCard.rows[0],
                scores: scores.rows,
                attendance: attendance.rows[0]
            }
        });

    } catch (error) {
        console.error('Admin view result error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// STUDENT VIEW OWN RESULT USING TOKEN
// ============================================
export const studentViewResult = async (req, res) => {
    try {
        const { token } = req.params;

        // Verify token exists and is valid
        const tokenQuery = await db.query(
            `SELECT rat.*
             FROM result_access_tokens rat
             WHERE rat.token = $1
             AND rat.is_active = TRUE`,
            [token]
        );

        if (tokenQuery.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or inactive result token.'
            });
        }

        const tokenData = tokenQuery.rows[0];

        // Check token expiry
        if (
            tokenData.expires_at &&
            new Date(tokenData.expires_at) < new Date()
        ) {
            return res.status(401).json({
                success: false,
                message: 'Result token has expired.'
            });
        }

        const { student_id, term_id } = tokenData;

        // Get report card
        const reportCard = await db.query(
            `SELECT rc.*,
                    s.first_name, s.last_name,
                    s.middle_name, s.admission_number,
                    s.passport_url, s.gender,
                    c.class_name,
                    st.stream_name,
                    t.term_name,
                    ses.session_name
             FROM report_cards rc
             LEFT JOIN students s ON s.id = rc.student_id
             LEFT JOIN classes c ON c.id = rc.class_id
             LEFT JOIN streams st ON st.id = rc.stream_id
             LEFT JOIN terms t ON t.id = rc.term_id
             LEFT JOIN academic_sessions ses ON ses.id = rc.session_id
             WHERE rc.student_id = $1
             AND rc.term_id = $2
             AND rc.is_published = TRUE`,
            [student_id, term_id]
        );

        if (reportCard.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Result not yet published. Please check back later.'
            });
        }

        const scores = await db.query(
            `SELECT sc.*,
                    sub.subject_name,
                    sub.subject_code
             FROM scores sc
             LEFT JOIN subjects sub ON sub.id = sc.subject_id
             WHERE sc.student_id = $1
             AND sc.term_id = $2
             ORDER BY sub.subject_name ASC`,
            [student_id, term_id]
        );

        const attendance = await db.query(
            `SELECT
                COUNT(*) AS total_days,
                COUNT(*) FILTER (WHERE status = 'present') AS days_present,
                COUNT(*) FILTER (WHERE status = 'absent') AS days_absent,
                COUNT(*) FILTER (WHERE status = 'late') AS days_late
             FROM attendance
             WHERE student_id = $1
             AND term_id = $2`,
            [student_id, term_id]
        );

        // Mark token as used
        await db.query(
            `UPDATE result_access_tokens
             SET is_used = TRUE,
                 used_at = NOW(),
                 updated_at = NOW()
             WHERE token = $1`,
            [token]
        );

        // Log print
        await db.query(
            `INSERT INTO result_print_logs (
                student_id, term_id, session_id,
                print_type, printed_as, token_used,
                ip_address
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                student_id,
                term_id,
                tokenData.session_id,
                'single',
                'student',
                token,
                req.ip
            ]
        );

        return res.status(200).json({
            success: true,
            data: {
                report_card: reportCard.rows[0],
                scores: scores.rows,
                attendance: attendance.rows[0]
            }
        });

    } catch (error) {
        console.error('Student view result error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};