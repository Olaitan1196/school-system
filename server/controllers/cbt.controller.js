import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// CREATE QUESTION
// ============================================
export const createQuestion = async (req, res) => {
    try {
        const {
            subject_id,
            class_id,
            stream_id,
            session_id,
            term_id,
            question_text,
            question_type,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            explanation,
            marks,
            difficulty_level
        } = req.body;

        if (!subject_id || !class_id || !question_text || !question_type) {
            return res.status(400).json({
                success: false,
                message: 'Subject, class, question text and type are required.'
            });
        }

        if (
            question_type === 'multiple_choice' &&
            (!option_a || !option_b || !option_c || !option_d)
        ) {
            return res.status(400).json({
                success: false,
                message: 'All four options are required for multiple choice questions.'
            });
        }

        if (!correct_option) {
            return res.status(400).json({
                success: false,
                message: 'Correct option is required.'
            });
        }

        const result = await db.query(
            `INSERT INTO question_banks (
                subject_id, class_id, stream_id,
                session_id, term_id, question_text,
                question_type, option_a, option_b,
                option_c, option_d, correct_option,
                explanation, marks, difficulty_level,
                created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING *`,
            [
                subject_id, class_id, stream_id || null,
                session_id || null, term_id || null,
                question_text, question_type,
                option_a || null, option_b || null,
                option_c || null, option_d || null,
                correct_option, explanation || null,
                marks || 1, difficulty_level || 'medium',
                req.user.id
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Question created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create question error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET QUESTIONS
// ============================================
export const getQuestions = async (req, res) => {
    try {
        const {
            subject_id,
            class_id,
            difficulty_level,
            question_type,
            page = 1,
            limit = 20
        } = req.query;

        let conditions = ['q.is_active = TRUE'];
        let values = [];
        let counter = 1;

        if (subject_id) {
            conditions.push(`q.subject_id = $${counter}`);
            values.push(subject_id);
            counter++;
        }

        if (class_id) {
            conditions.push(`q.class_id = $${counter}`);
            values.push(class_id);
            counter++;
        }

        if (difficulty_level) {
            conditions.push(`q.difficulty_level = $${counter}`);
            values.push(difficulty_level);
            counter++;
        }

        if (question_type) {
            conditions.push(`q.question_type = $${counter}`);
            values.push(question_type);
            counter++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT q.*,
                    s.subject_name,
                    c.class_name
             FROM question_banks q
             LEFT JOIN subjects s ON s.id = q.subject_id
             LEFT JOIN classes c ON c.id = q.class_id
             ${whereClause}
             ORDER BY q.created_at DESC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        const countQuery = await db.query(
            `SELECT COUNT(*) FROM question_banks q ${whereClause}`,
            values
        );

        const total = parseInt(countQuery.rows[0].count);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get questions error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CREATE CBT EXAM
// ============================================
export const createExam = async (req, res) => {
    try {
        const {
            exam_title,
            subject_id,
            class_id,
            stream_id,
            session_id,
            term_id,
            exam_type,
            total_questions,
            total_marks,
            duration_minutes,
            pass_mark,
            shuffle_questions,
            shuffle_options,
            show_result_immediately,
            allow_review,
            instructions
        } = req.body;

        if (
            !exam_title || !subject_id || !class_id ||
            !session_id || !term_id || !exam_type ||
            !total_marks || !duration_minutes
        ) {
            return res.status(400).json({
                success: false,
                message: 'Exam title, subject, class, session, term, type, total marks and duration are required.'
            });
        }

        const result = await db.query(
            `INSERT INTO cbt_exams (
                exam_title, subject_id, class_id,
                stream_id, session_id, term_id,
                exam_type, total_questions, total_marks,
                duration_minutes, pass_mark,
                shuffle_questions, shuffle_options,
                show_result_immediately, allow_review,
                instructions, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
            RETURNING *`,
            [
                exam_title, subject_id, class_id,
                stream_id || null, session_id, term_id,
                exam_type, total_questions || 40,
                total_marks, duration_minutes,
                pass_mark || 40,
                shuffle_questions !== false,
                shuffle_options !== false,
                show_result_immediately || false,
                allow_review !== false,
                instructions || null,
                req.user.id
            ]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'created_exam',
                'cbt',
                'cbt_exams',
                result.rows[0].id,
                `Created CBT exam: ${exam_title}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'CBT exam created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create exam error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};

// ============================================
// DELETE CBT EXAM
// ============================================
export const deleteExam = async (req, res) => {
    try {
        const { exam_id } = req.params;

        const examQuery = await db.query(
            `SELECT id FROM cbt_exams WHERE id = $1`,
            [exam_id]
        );

        if (examQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found.'
            });
        }

        // Check if any sessions exist for this exam
        const sessionsQuery = await db.query(
            `SELECT id FROM cbt_sessions WHERE exam_id = $1`,
            [exam_id]
        );

        if (sessionsQuery.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This exam has scheduled sessions. Please delete all its sessions first.'
            });
        }

        await db.query(
            `DELETE FROM cbt_exams WHERE id = $1`,
            [exam_id]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'deleted_cbt_exam',
                'cbt',
                'cbt_exams',
                exam_id,
                `Admin deleted CBT exam`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Exam deleted successfully.'
        });

    } catch (error) {
        console.error('Delete exam error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};

// ============================================
// GET ALL EXAMS
// ============================================
export const getAllExams = async (req, res) => {
    try {
        const { class_id, subject_id, term_id } = req.query;

        let conditions = ['e.is_active = TRUE'];
        let values = [];
        let counter = 1;

        if (class_id) {
            conditions.push(`e.class_id = $${counter}`);
            values.push(class_id);
            counter++;
        }

        if (subject_id) {
            conditions.push(`e.subject_id = $${counter}`);
            values.push(subject_id);
            counter++;
        }

        if (term_id) {
            conditions.push(`e.term_id = $${counter}`);
            values.push(term_id);
            counter++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const result = await db.query(
            `SELECT e.*,
                    s.subject_name,
                    c.class_name,
                    t.term_name,
                    ses.session_name
             FROM cbt_exams e
             LEFT JOIN subjects s ON s.id = e.subject_id
             LEFT JOIN classes c ON c.id = e.class_id
             LEFT JOIN terms t ON t.id = e.term_id
             LEFT JOIN academic_sessions ses ON ses.id = e.session_id
             ${whereClause}
             ORDER BY e.created_at DESC`,
            values
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get exams error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CREATE CBT SESSION
// ============================================
export const createCbtSession = async (req, res) => {
    try {
        const {
            exam_id,
            session_name,
            scheduled_date,
            start_time,
            end_time,
            venue,
            max_students
        } = req.body;

        if (
            !exam_id || !session_name ||
            !scheduled_date || !start_time || !end_time
        ) {
            return res.status(400).json({
                success: false,
                message: 'Exam, session name, date, start and end time are required.'
            });
        }

        const result = await db.query(
            `INSERT INTO cbt_sessions (
                exam_id, session_name, scheduled_date,
                start_time, end_time, venue, max_students
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                exam_id, session_name, scheduled_date,
                start_time, end_time,
                venue || null,
                max_students || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'CBT session created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create CBT session error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// OPEN CBT SESSION
// ============================================
export const openCbtSession = async (req, res) => {
    try {
        const { session_id } = req.params;

        const sessionQuery = await db.query(
            `SELECT * FROM cbt_sessions WHERE id = $1`,
            [session_id]
        );

        if (sessionQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'CBT session not found.'
            });
        }

        if (sessionQuery.rows[0].is_completed) {
            return res.status(400).json({
                success: false,
                message: 'This session is already completed.'
            });
        }

        await db.query(
            `UPDATE cbt_sessions
             SET is_open = TRUE,
                 opened_by = $1,
                 opened_at = NOW(),
                 updated_at = NOW()
             WHERE id = $2`,
            [req.user.id, session_id]
        );

        return res.status(200).json({
            success: true,
            message: 'CBT session opened. Students can now log in.'
        });

    } catch (error) {
        console.error('Open CBT session error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CLOSE CBT SESSION
// ============================================
export const closeCbtSession = async (req, res) => {
    try {
        const { session_id } = req.params;

        await db.query(
            `UPDATE cbt_sessions
             SET is_open = FALSE,
                 is_completed = TRUE,
                 closed_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1`,
            [session_id]
        );

        return res.status(200).json({
            success: true,
            message: 'CBT session closed successfully.'
        });

    } catch (error) {
        console.error('Close CBT session error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};

// ============================================
// GET ALL SESSIONS (optionally filtered by exam)
// ============================================
export const getAllSessions = async (req, res) => {
    try {
        const { exam_id } = req.query;

        let conditions = [];
        let values = [];
        let counter = 1;

        if (exam_id) {
            conditions.push(`cs.exam_id = $${counter}`);
            values.push(exam_id);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await db.query(
            `SELECT cs.*,
                    ce.exam_title, ce.exam_type,
                    ce.duration_minutes
             FROM cbt_sessions cs
             LEFT JOIN cbt_exams ce ON ce.id = cs.exam_id
             ${whereClause}
             ORDER BY cs.scheduled_date DESC, cs.start_time DESC`,
            values
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get all sessions error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// DELETE CBT SESSION
// ============================================
export const deleteCbtSession = async (req, res) => {
    const client = await db.connect();
    try {
        const { session_id } = req.params;

        const sessionQuery = await db.query(
            `SELECT id FROM cbt_sessions WHERE id = $1`,
            [session_id]
        );

        if (sessionQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'CBT session not found.'
            });
        }

        // Block deletion if any student has results for this session
        const resultsQuery = await db.query(
            `SELECT id FROM cbt_results WHERE cbt_session_id = $1`,
            [session_id]
        );

        if (resultsQuery.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This session has student results and cannot be deleted.'
            });
        }

        await client.query('BEGIN');

        // Safe to delete tokens now, since we confirmed no results exist
        await client.query(
            `DELETE FROM cbt_tokens WHERE cbt_session_id = $1`,
            [session_id]
        );

        // Now delete the session itself
        await client.query(
            `DELETE FROM cbt_sessions WHERE id = $1`,
            [session_id]
        );

        await client.query('COMMIT');

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'deleted_cbt_session',
                'cbt',
                'cbt_sessions',
                session_id,
                `Admin deleted CBT session and its tokens`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'CBT session and its tokens deleted successfully.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete CBT session error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};

// ============================================
// STUDENT START EXAM
// ============================================
export const startExam = async (req, res) => {
    try {
        const { session_id } = req.params;
        const student_id = req.user.student_id;

        if (!student_id) {
            return res.status(403).json({
                success: false,
                message: 'Only students can take exams.'
            });
        }

        // Check session is open
        const sessionQuery = await db.query(
            `SELECT cs.*, ce.total_questions,
                    ce.duration_minutes, ce.id AS exam_id,
                    ce.shuffle_questions, ce.shuffle_options,
                    ce.allow_review, ce.instructions,
                    ce.subject_id, ce.class_id
             FROM cbt_sessions cs
             LEFT JOIN cbt_exams ce ON ce.id = cs.exam_id
             WHERE cs.id = $1`,
            [session_id]
        );

        if (sessionQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam session not found.'
            });
        }

        const session = sessionQuery.rows[0];

        if (!session.is_open) {
            return res.status(400).json({
                success: false,
                message: 'Exam session is not open yet.'
            });
        }

        if (session.is_completed) {
            return res.status(400).json({
                success: false,
                message: 'Exam session is already closed.'
            });
        }

        // Check if student already started
        const existingResult = await db.query(
            `SELECT id, submitted_at FROM cbt_results
             WHERE cbt_session_id = $1 AND student_id = $2`,
            [session_id, student_id]
        );

        if (
            existingResult.rows.length > 0 &&
            existingResult.rows[0].submitted_at !== null
        ) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted this exam.'
            });
        }

        // Get questions for this exam
        let questionsQuery = `
            SELECT id, question_text, question_type,
                   option_a, option_b, option_c, option_d,
                   marks
            FROM question_banks
            WHERE subject_id = $1
            AND class_id = $2
            AND is_active = TRUE
        `;

        const questions = await db.query(
            questionsQuery,
            [session.subject_id, session.class_id]
        );

        if (questions.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No questions found for this exam.'
            });
        }

        // Pick required number of questions
        let examQuestions = questions.rows;

        // Shuffle questions if enabled
        if (session.shuffle_questions) {
            examQuestions = examQuestions
                .sort(() => Math.random() - 0.5)
                .slice(0, session.total_questions);
        } else {
            examQuestions = examQuestions.slice(0, session.total_questions);
        }

        // Shuffle options if enabled
        if (session.shuffle_options) {
            examQuestions = examQuestions.map(q => {
                if (q.question_type === 'multiple_choice') {
                    const options = [
                        { key: 'a', value: q.option_a },
                        { key: 'b', value: q.option_b },
                        { key: 'c', value: q.option_c },
                        { key: 'd', value: q.option_d }
                    ].sort(() => Math.random() - 0.5);

                    return {
                        ...q,
                        option_a: options[0].value,
                        option_b: options[1].value,
                        option_c: options[2].value,
                        option_d: options[3].value
                    };
                }
                return q;
            });
        }

        // Create or update result record
        if (existingResult.rows.length === 0) {
            await db.query(
                `INSERT INTO cbt_results (
                    cbt_session_id, exam_id, student_id,
                    total_questions, started_at,
                    tab_switch_count, is_flagged
                ) VALUES ($1, $2, $3, $4, NOW(), 0, FALSE)`,
                [
                    session_id,
                    session.exam_id,
                    student_id,
                    examQuestions.length
                ]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Exam started. Good luck.',
            data: {
                session_id,
                exam_id: session.exam_id,
                duration_minutes: session.duration_minutes,
                total_questions: examQuestions.length,
                allow_review: session.allow_review,
                instructions: session.instructions,
                questions: examQuestions
            }
        });

    } catch (error) {
        console.error('Start exam error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// RECORD TAB SWITCH WARNING
// ============================================
// This is called by the frontend every time
// the student switches tab or minimizes window

export const recordTabSwitch = async (req, res) => {
    try {
        const { session_id } = req.params;
        const student_id = req.user.student_id;

        if (!student_id) {
            return res.status(403).json({
                success: false,
                message: 'Only students can take exams.'
            });
        }

        // Get current result record
        const resultQuery = await db.query(
            `SELECT id, tab_switch_count, submitted_at
             FROM cbt_results
             WHERE cbt_session_id = $1
             AND student_id = $2`,
            [session_id, student_id]
        );

        if (resultQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam record not found.'
            });
        }

        const result = resultQuery.rows[0];

        // If already submitted ignore
        if (result.submitted_at !== null) {
            return res.status(400).json({
                success: false,
                message: 'Exam already submitted.'
            });
        }

        const newTabSwitchCount = result.tab_switch_count + 1;

        // Update tab switch count
        await db.query(
            `UPDATE cbt_results
             SET tab_switch_count = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [newTabSwitchCount, result.id]
        );

        // If 3 or more tab switches auto submit and flag
        if (newTabSwitchCount >= 3) {
            // Auto submit the exam
            await db.query(
                `UPDATE cbt_results
                 SET submitted_at = NOW(),
                     submission_type = 'auto',
                     is_flagged = TRUE,
                     flag_reason = 'Student switched tabs 3 times during exam',
                     updated_at = NOW()
                 WHERE id = $1`,
                [result.id]
            );

            // Log the malpractice
            await db.query(
                `INSERT INTO audit_logs
                 (user_id, user_role, action, module,
                  target_table, target_id, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    req.user.id,
                    req.user.role,
                    'exam_malpractice',
                    'cbt',
                    'cbt_results',
                    result.id,
                    `Student flagged for malpractice. 
                     Switched tabs 3 times. Exam auto submitted.`
                ]
            );

            return res.status(200).json({
                success: true,
                auto_submitted: true,
                is_flagged: true,
                tab_switch_count: newTabSwitchCount,
                message: 'You have been caught switching tabs 3 times. Your exam has been automatically submitted and flagged for malpractice.'
            });
        }

        // Return warning message
        const warningsLeft = 3 - newTabSwitchCount;

        return res.status(200).json({
            success: true,
            auto_submitted: false,
            is_flagged: false,
            tab_switch_count: newTabSwitchCount,
            warnings_left: warningsLeft,
            message: `Warning ${newTabSwitchCount}/3: Do not leave the exam screen. You have ${warningsLeft} warning(s) left before your exam is automatically submitted and flagged for malpractice.`
        });

    } catch (error) {
        console.error('Tab switch error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// SUBMIT EXAM
// ============================================
export const submitExam = async (req, res) => {
    try {
        const { session_id } = req.params;
        const { answers, submission_type } = req.body;
        const student_id = req.user.student_id;

        // answers format:
        // { "question_id": "a", "question_id2": "b" }

        if (!student_id) {
            return res.status(403).json({
                success: false,
                message: 'Only students can submit exams.'
            });
        }

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Answers are required.'
            });
        }

        // Get exam result record
        const resultQuery = await db.query(
            `SELECT cr.*, ce.total_marks
             FROM cbt_results cr
             LEFT JOIN cbt_exams ce ON ce.id = cr.exam_id
             WHERE cr.cbt_session_id = $1
             AND cr.student_id = $2`,
            [session_id, student_id]
        );

        if (resultQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam record not found. Please start the exam first.'
            });
        }

        const examResult = resultQuery.rows[0];

        if (examResult.submitted_at !== null) {
            return res.status(400).json({
                success: false,
                message: 'Exam already submitted.'
            });
        }

        // Get correct answers from database
        const questionIds = Object.keys(answers);

        const questionsQuery = await db.query(
            `SELECT id, correct_option, marks
             FROM question_banks
             WHERE id = ANY($1::uuid[])`,
            [questionIds]
        );

        // Grade the answers
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let skippedAnswers = 0;
        let scoreObtained = 0;

        for (const question of questionsQuery.rows) {
            const studentAnswer = answers[question.id];

            if (!studentAnswer || studentAnswer === '') {
                skippedAnswers++;
            } else if (
                studentAnswer.toLowerCase() ===
                question.correct_option.toLowerCase()
            ) {
                correctAnswers++;
                scoreObtained += parseFloat(question.marks);
            } else {
                wrongAnswers++;
            }
        }

        const totalQuestions = questionsQuery.rows.length;
        const questionsAnswered = totalQuestions - skippedAnswers;
        const totalMarks = parseFloat(examResult.total_marks);
        const percentage = totalMarks > 0
            ? ((scoreObtained / totalMarks) * 100).toFixed(2)
            : 0;

        // Calculate time taken
        const startedAt = new Date(examResult.started_at);
        const submittedAt = new Date();
        const timeTaken = Math.round(
            (submittedAt - startedAt) / 60000
        );

        // Update result record
        const updatedResult = await db.query(
            `UPDATE cbt_results SET
                answers = $1,
                total_questions = $2,
                questions_answered = $3,
                correct_answers = $4,
                wrong_answers = $5,
                skipped_answers = $6,
                score_obtained = $7,
                total_marks = $8,
                percentage = $9,
                time_taken_minutes = $10,
                submitted_at = NOW(),
                submission_type = $11,
                is_graded = TRUE,
                updated_at = NOW()
             WHERE cbt_session_id = $12
             AND student_id = $13
             RETURNING *`,
            [
                JSON.stringify(answers),
                totalQuestions,
                questionsAnswered,
                correctAnswers,
                wrongAnswers,
                skippedAnswers,
                scoreObtained.toFixed(2),
                totalMarks,
                percentage,
                timeTaken,
                submission_type || 'manual',
                session_id,
                student_id
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Exam submitted successfully.',
            data: {
                score_obtained: scoreObtained.toFixed(2),
                total_marks: totalMarks,
                percentage,
                correct_answers: correctAnswers,
                wrong_answers: wrongAnswers,
                skipped_answers: skippedAnswers,
                time_taken_minutes: timeTaken,
                is_flagged: updatedResult.rows[0].is_flagged
            }
        });

    } catch (error) {
        console.error('Submit exam error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET CBT RESULTS FOR A SESSION
// ============================================
export const getSessionResults = async (req, res) => {
    try {
        const { session_id } = req.params;

        const result = await db.query(
            `SELECT cr.*,
                    s.first_name, s.last_name,
                    s.admission_number,
                    ce.exam_title,
                    ce.pass_mark
             FROM cbt_results cr
             LEFT JOIN students s ON s.id = cr.student_id
             LEFT JOIN cbt_exams ce ON ce.id = cr.exam_id
             WHERE cr.cbt_session_id = $1
             ORDER BY cr.score_obtained DESC`,
            [session_id]
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            flagged: result.rows.filter(r => r.is_flagged).length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get session results error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET FLAGGED STUDENTS
// ============================================
export const getFlaggedStudents = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT cr.*,
                    s.first_name, s.last_name,
                    s.admission_number,
                    ce.exam_title,
                    cs.session_name,
                    cs.scheduled_date
             FROM cbt_results cr
             LEFT JOIN students s ON s.id = cr.student_id
             LEFT JOIN cbt_exams ce ON ce.id = cr.exam_id
             LEFT JOIN cbt_sessions cs ON cs.id = cr.cbt_session_id
             WHERE cr.is_flagged = TRUE
             ORDER BY cr.submitted_at DESC`
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get flagged students error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CREATE PUBLIC EXAM QUESTION
// ============================================
export const createPublicQuestion = async (req, res) => {
    try {
        const {
            exam_body,
            subject_name,
            year,
            question_text,
            question_type,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            explanation,
            topic,
            difficulty_level
        } = req.body;

        if (
            !exam_body || !subject_name ||
            !question_text || !correct_option
        ) {
            return res.status(400).json({
                success: false,
                message: 'Exam body, subject, question and correct option are required.'
            });
        }

        const result = await db.query(
            `INSERT INTO public_exam_questions (
                exam_body, subject_name, year,
                question_text, question_type,
                option_a, option_b, option_c, option_d,
                correct_option, explanation,
                topic, difficulty_level, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *`,
            [
                exam_body, subject_name, year || null,
                question_text, question_type || 'multiple_choice',
                option_a || null, option_b || null,
                option_c || null, option_d || null,
                correct_option, explanation || null,
                topic || null, difficulty_level || 'medium',
                req.user.id
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Public exam question created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create public question error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// START PUBLIC EXAM PRACTICE
// ============================================
export const startPublicExam = async (req, res) => {
    try {
        const {
            exam_body,
            subject_name,
            candidate_name,
            total_questions
        } = req.body;

        if (!exam_body || !subject_name) {
            return res.status(400).json({
                success: false,
                message: 'Exam body and subject are required.'
            });
        }

        // Get questions
        const questionsQuery = await db.query(
            `SELECT id, question_text, question_type,
                    option_a, option_b, option_c, option_d
             FROM public_exam_questions
             WHERE exam_body = $1
             AND subject_name = $2
             AND is_active = TRUE
             ORDER BY RANDOM()
             LIMIT $3`,
            [exam_body, subject_name, total_questions || 40]
        );

        if (questionsQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No questions found for this exam and subject.'
            });
        }

        // Generate attempt reference
        const countQuery = await db.query(
            `SELECT COUNT(*) FROM public_exam_attempts`
        );
        const count = parseInt(countQuery.rows[0].count) + 1;
        const sequence = String(count).padStart(5, '0');
        const attemptReference = `PUB-${exam_body}-${new Date().getFullYear()}-${sequence}`;

        // Create attempt record
        await db.query(
            `INSERT INTO public_exam_attempts (
                attempt_reference, exam_body,
                subject_name, candidate_name,
                total_questions, ip_address
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                attemptReference,
                exam_body,
                subject_name,
                candidate_name || null,
                questionsQuery.rows.length,
                req.ip
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Public exam started. Good luck.',
            data: {
                attempt_reference: attemptReference,
                exam_body,
                subject_name,
                total_questions: questionsQuery.rows.length,
                questions: questionsQuery.rows
            }
        });

    } catch (error) {
        console.error('Start public exam error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// SUBMIT PUBLIC EXAM
// ============================================
export const submitPublicExam = async (req, res) => {
    try {
        const { attempt_reference, answers, time_taken_minutes } = req.body;

        if (!attempt_reference || !answers) {
            return res.status(400).json({
                success: false,
                message: 'Attempt reference and answers are required.'
            });
        }

        // Get correct answers
        const questionIds = Object.keys(answers);

        const questionsQuery = await db.query(
            `SELECT id, correct_option, explanation,
                    question_text, option_a, option_b,
                    option_c, option_d
             FROM public_exam_questions
             WHERE id = ANY($1::uuid[])`,
            [questionIds]
        );

        // Grade answers
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let skippedAnswers = 0;
        const reviewData = [];

        for (const question of questionsQuery.rows) {
            const studentAnswer = answers[question.id];
            let isCorrect = false;

            if (!studentAnswer || studentAnswer === '') {
                skippedAnswers++;
            } else if (
                studentAnswer.toLowerCase() ===
                question.correct_option.toLowerCase()
            ) {
                correctAnswers++;
                isCorrect = true;
            } else {
                wrongAnswers++;
            }

            reviewData.push({
                question_id: question.id,
                question_text: question.question_text,
                your_answer: studentAnswer,
                correct_answer: question.correct_option,
                is_correct: isCorrect,
                explanation: question.explanation
            });
        }

        const totalQuestions = questionsQuery.rows.length;
        const scoreObtained = correctAnswers;
        const percentage = totalQuestions > 0
            ? ((correctAnswers / totalQuestions) * 100).toFixed(2)
            : 0;

        // Update attempt record
        await db.query(
            `UPDATE public_exam_attempts SET
                answers = $1,
                questions_answered = $2,
                correct_answers = $3,
                wrong_answers = $4,
                score_obtained = $5,
                percentage = $6,
                time_taken_minutes = $7,
                submitted_at = NOW()
             WHERE attempt_reference = $8`,
            [
                JSON.stringify(answers),
                totalQuestions - skippedAnswers,
                correctAnswers,
                wrongAnswers,
                scoreObtained,
                percentage,
                time_taken_minutes || null,
                attempt_reference
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Public exam submitted successfully.',
            data: {
                attempt_reference,
                total_questions: totalQuestions,
                correct_answers: correctAnswers,
                wrong_answers: wrongAnswers,
                skipped_answers: skippedAnswers,
                score_obtained: scoreObtained,
                percentage,
                time_taken_minutes,
                review: reviewData
            }
        });

    } catch (error) {
        console.error('Submit public exam error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};

// ============================================
// ACCESS EXAM VIA TOKEN
// Students enter this token on exam day
// No login required — token is their key
// ============================================
export const accessExamByToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Exam token is required.'
            });
        }

        // Find the token in exam_access_requests table
        const tokenQuery = await db.query(
    `SELECT ct.*,
            s.first_name, s.last_name,
            s.admission_number, s.id AS student_id,
            cs.id AS session_id, cs.is_open,
            cs.is_completed, cs.exam_id,
            ce.exam_title, ce.duration_minutes,
            ce.total_questions, ce.shuffle_questions,
            ce.shuffle_options, ce.allow_review,
            ce.instructions, ce.subject_id,
            ce.class_id, ce.total_marks
     FROM cbt_tokens ct
     LEFT JOIN students s ON s.id = ct.student_id
     LEFT JOIN cbt_sessions cs ON cs.id = ct.cbt_session_id
     LEFT JOIN cbt_exams ce ON ce.id = cs.exam_id
     WHERE ct.access_token = $1`,
    [token.trim().toUpperCase()]
);

        if (tokenQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invalid exam token. Please check and try again.'
            });
        }

        const tokenData = tokenQuery.rows[0];

        // Check if token has expired
        if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'This exam token has expired.'
            });
        }

        // Check if session is open
        if (!tokenData.is_open) {
            return res.status(400).json({
                success: false,
                message: 'The exam session is not open yet. Please wait for your teacher.'
            });
        }

        // Check if session is already completed
        if (tokenData.is_completed) {
            return res.status(400).json({
                success: false,
                message: 'This exam session has already ended.'
            });
        }

        // Check if student already submitted
        const existingResult = await db.query(
            `SELECT id, submitted_at FROM cbt_results
             WHERE cbt_session_id = $1 AND student_id = $2`,
            [tokenData.session_id, tokenData.student_id]
        );

        if (
            existingResult.rows.length > 0 &&
            existingResult.rows[0].submitted_at !== null
        ) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted this exam.'
            });
        }

        // Get questions for the exam
        const questionsQuery = await db.query(
            `SELECT id, question_text, question_type,
                    option_a, option_b, option_c, option_d,
                    marks
             FROM question_banks
             WHERE subject_id = $1
             AND class_id = $2
             AND is_active = TRUE`,
            [tokenData.subject_id, tokenData.class_id]
        );

        if (questionsQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No questions found for this exam.'
            });
        }

        // Shuffle and slice questions
        let examQuestions = questionsQuery.rows;

        if (tokenData.shuffle_questions) {
            examQuestions = examQuestions.sort(() => Math.random() - 0.5);
        }

        examQuestions = examQuestions.slice(0, tokenData.total_questions);

        // Create result record if not exists
        if (existingResult.rows.length === 0) {
            await db.query(
                `INSERT INTO cbt_results (
                    cbt_session_id, exam_id, student_id,
                    total_questions, started_at,
                    tab_switch_count, is_flagged
                ) VALUES ($1, $2, $3, $4, NOW(), 0, FALSE)`,
                [
                    tokenData.session_id,
                    tokenData.exam_id,
                    tokenData.student_id,
                    examQuestions.length
                ]
            );
        }

        // Log token usage
        await db.query(
    `UPDATE cbt_tokens SET is_used = TRUE
     WHERE access_token = $1`,
    [token.trim().toUpperCase()]
);

        return res.status(200).json({
            success: true,
            message: 'Token verified. Exam is ready.',
            data: {
                student_name: `${tokenData.first_name} ${tokenData.last_name}`,
                admission_number: tokenData.admission_number,
                student_id: tokenData.student_id,
                session_id: tokenData.session_id,
                exam_title: tokenData.exam_title,
                duration_minutes: tokenData.duration_minutes,
                total_questions: examQuestions.length,
                total_marks: tokenData.total_marks,
                allow_review: tokenData.allow_review,
                instructions: tokenData.instructions,
                questions: examQuestions
            }
        });

    } catch (error) {
        console.error('Access exam by token error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};