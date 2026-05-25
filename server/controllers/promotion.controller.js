import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// HELPER: GET NEXT CLASS
// ============================================
const getNextClass = async (currentClassId) => {
    const currentClass = await db.query(
        `SELECT class_level, class_number
         FROM classes WHERE id = $1`,
        [currentClassId]
    );

    if (currentClass.rows.length === 0) return null;

    const { class_level, class_number } = currentClass.rows[0];

    // SSS3 has no next class
    if (class_level === 'SSS' && class_number === 3) return null;

    let nextLevel = class_level;
    let nextNumber = class_number + 1;

    // JSS3 moves to SSS1
    if (class_level === 'JSS' && class_number === 3) {
        nextLevel = 'SSS';
        nextNumber = 1;
    }

    const nextClass = await db.query(
        `SELECT id FROM classes
         WHERE class_level = $1
         AND class_number = $2`,
        [nextLevel, nextNumber]
    );

    return nextClass.rows.length > 0 ? nextClass.rows[0].id : null;
};


// ============================================
// HELPER: GET PREVIOUS CLASS
// ============================================
const getPreviousClass = async (currentClassId) => {
    const currentClass = await db.query(
        `SELECT class_level, class_number
         FROM classes WHERE id = $1`,
        [currentClassId]
    );

    if (currentClass.rows.length === 0) return null;

    const { class_level, class_number } = currentClass.rows[0];

    // JSS1 has no previous class
    if (class_level === 'JSS' && class_number === 1) return null;

    let prevLevel = class_level;
    let prevNumber = class_number - 1;

    // SSS1 moves back to JSS3
    if (class_level === 'SSS' && class_number === 1) {
        prevLevel = 'JSS';
        prevNumber = 3;
    }

    const prevClass = await db.query(
        `SELECT id FROM classes
         WHERE class_level = $1
         AND class_number = $2`,
        [prevLevel, prevNumber]
    );

    return prevClass.rows.length > 0 ? prevClass.rows[0].id : null;
};


// ============================================
// HELPER: UPDATE STUDENT ENROLLMENT
// ============================================
const updateStudentEnrollment = async (
    client,
    student_id,
    new_class_id,
    new_stream_id,
    new_session_id
) => {
    // Deactivate current enrollment
    await client.query(
        `UPDATE enrollments
         SET is_active = FALSE,
             updated_at = NOW()
         WHERE student_id = $1
         AND is_active = TRUE`,
        [student_id]
    );

    // Create new enrollment if not graduating or withdrawing
    if (new_class_id && new_session_id) {
        await client.query(
            `INSERT INTO enrollments (
                student_id, class_id,
                stream_id, session_id
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (student_id, session_id)
            DO UPDATE SET
                class_id = EXCLUDED.class_id,
                stream_id = EXCLUDED.stream_id,
                is_active = TRUE,
                updated_at = NOW()`,
            [
                student_id,
                new_class_id,
                new_stream_id || null,
                new_session_id
            ]
        );
    }
};


// ============================================
// SET PROMOTION SETTINGS
// ============================================
export const setPromotionSettings = async (req, res) => {
    try {
        const { session_id, pass_percentage } = req.body;

        if (!session_id || !pass_percentage) {
            return res.status(400).json({
                success: false,
                message: 'Session and pass percentage are required.'
            });
        }

        if (pass_percentage < 0 || pass_percentage > 100) {
            return res.status(400).json({
                success: false,
                message: 'Pass percentage must be between 0 and 100.'
            });
        }

        const result = await db.query(
            `INSERT INTO promotion_settings
             (session_id, pass_percentage, created_by)
             VALUES ($1, $2, $3)
             ON CONFLICT (session_id)
             DO UPDATE SET
                pass_percentage = EXCLUDED.pass_percentage,
                updated_at = NOW()
             RETURNING *`,
            [session_id, pass_percentage, req.user.id]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'set_promotion_settings',
                'promotions',
                'promotion_settings',
                result.rows[0].id,
                `Set promotion pass percentage to 
                 ${pass_percentage}% for session`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Promotion pass percentage set to ${pass_percentage}%.`,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Set promotion settings error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET PROMOTION SETTINGS
// ============================================
export const getPromotionSettings = async (req, res) => {
    try {
        const { session_id } = req.query;

        let query = `
            SELECT ps.*,
                   s.session_name
            FROM promotion_settings ps
            LEFT JOIN academic_sessions s ON s.id = ps.session_id
        `;
        let values = [];

        if (session_id) {
            query += ` WHERE ps.session_id = $1`;
            values.push(session_id);
        }

        query += ` ORDER BY ps.created_at DESC`;

        const result = await db.query(query, values);

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get promotion settings error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// RUN AUTOMATIC PROMOTION FOR A CLASS
// ============================================
export const runAutoPromotion = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            class_id,
            session_id,
            next_session_id,
            stream_id
        } = req.body;

        if (!class_id || !session_id || !next_session_id) {
            return res.status(400).json({
                success: false,
                message: 'Class, current session and next session are required.'
            });
        }

        // Get pass percentage for this session
        const settingsQuery = await db.query(
            `SELECT pass_percentage
             FROM promotion_settings
             WHERE session_id = $1`,
            [session_id]
        );

        if (settingsQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promotion settings not found for this session. Please set pass percentage first.'
            });
        }

        const passPercentage = parseFloat(
            settingsQuery.rows[0].pass_percentage
        );

        // Get current class details
        const classQuery = await db.query(
            `SELECT class_level, class_number, class_name
             FROM classes WHERE id = $1`,
            [class_id]
        );

        if (classQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found.'
            });
        }

        const currentClass = classQuery.rows[0];
        const isSSS3 = currentClass.class_level === 'SSS' &&
            currentClass.class_number === 3;

        // Get all students enrolled in this class this session
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

        const enrollments = await db.query(enrollQuery, enrollValues);

        if (enrollments.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in this class for this session.'
            });
        }

        await client.query('BEGIN');

        const results = {
            promoted: [],
            repeated: [],
            graduated: [],
            total: enrollments.rows.length
        };

        for (const enrollment of enrollments.rows) {
            const { student_id } = enrollment;

            // SSS3 students are automatically graduated
            if (isSSS3) {
                // Check if promotion already exists
                const existingPromotion = await client.query(
                    `SELECT id FROM promotions
                     WHERE student_id = $1
                     AND session_id = $2`,
                    [student_id, session_id]
                );

                if (existingPromotion.rows.length > 0) {
                    results.graduated.push(student_id);
                    continue;
                }

                await client.query(
                    `INSERT INTO promotions (
                        student_id, session_id,
                        from_class_id, to_class_id,
                        from_stream_id, to_stream_id,
                        promotion_status, promoted_by,
                        remarks
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                    [
                        student_id, session_id,
                        class_id, null,
                        stream_id || null, null,
                        'graduated', req.user.id,
                        'Student completed SSS3 and graduated'
                    ]
                );

                // Deactivate enrollment
                await client.query(
                    `UPDATE enrollments
                     SET is_active = FALSE,
                         updated_at = NOW()
                     WHERE student_id = $1
                     AND is_active = TRUE`,
                    [student_id]
                );

                results.graduated.push(student_id);
                continue;
            }

            // Calculate average score across all three terms
            const scoresQuery = await client.query(
                `SELECT
                    AVG(
                        (sc.ca1_score + sc.ca2_score +
                         sc.ca3_score + sc.exam_score)
                    ) AS overall_average
                 FROM scores sc
                 LEFT JOIN terms t ON t.id = sc.term_id
                 WHERE sc.student_id = $1
                 AND sc.session_id = $2
                 AND sc.class_id = $3`,
                [student_id, session_id, class_id]
            );

            const overallAverage = parseFloat(
                scoresQuery.rows[0].overall_average
            ) || 0;

            // Check if promotion already exists
            const existingPromotion = await client.query(
                `SELECT id FROM promotions
                 WHERE student_id = $1
                 AND session_id = $2`,
                [student_id, session_id]
            );

            if (existingPromotion.rows.length > 0) {
                continue;
            }

            let promotionStatus;
            let toClassId;
            let toStreamId = stream_id || null;

            if (overallAverage >= passPercentage) {
                // Student passes - get next class
                promotionStatus = 'promoted';
                toClassId = await getNextClass(class_id);
            } else {
                // Student fails - repeat same class
                promotionStatus = 'repeated';
                toClassId = class_id;
            }

            // Record promotion
            await client.query(
                `INSERT INTO promotions (
                    student_id, session_id,
                    from_class_id, to_class_id,
                    from_stream_id, to_stream_id,
                    promotion_status, promoted_by,
                    remarks
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [
                    student_id, session_id,
                    class_id, toClassId,
                    stream_id || null, toStreamId,
                    promotionStatus, req.user.id,
                    `Overall average: ${overallAverage.toFixed(2)}%. 
                     Pass mark: ${passPercentage}%`
                ]
            );

            // Update enrollment to new class
            await updateStudentEnrollment(
                client,
                student_id,
                toClassId,
                toStreamId,
                next_session_id
            );

            if (promotionStatus === 'promoted') {
                results.promoted.push(student_id);
            } else {
                results.repeated.push(student_id);
            }
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
                'ran_auto_promotion',
                'promotions',
                'promotions',
                null,
                `Auto promotion for ${currentClass.class_name}. 
                 Promoted: ${results.promoted.length}, 
                 Repeated: ${results.repeated.length},
                 Graduated: ${results.graduated.length}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Promotion completed for ${results.total} students.`,
            data: {
                total: results.total,
                promoted: results.promoted.length,
                repeated: results.repeated.length,
                graduated: results.graduated.length,
                pass_percentage: passPercentage
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Auto promotion error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// MANUAL PROMOTION OVERRIDE BY ADMIN
// ============================================
export const manualPromotion = async (req, res) => {
    const client = await db.connect();
    try {
        const { student_id } = req.params;
        const {
            action,
            session_id,
            next_session_id,
            stream_id,
            remarks
        } = req.body;

        // action options:
        // promote, demote, graduate, repeat, withdraw

        const validActions = [
            'promote',
            'demote',
            'graduate',
            'repeat',
            'withdraw'
        ];

        if (!action || !validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Valid action is required: promote, demote, graduate, repeat, withdraw.'
            });
        }

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'Session is required.'
            });
        }

        // Get student current enrollment
        const enrollmentQuery = await db.query(
            `SELECT e.*,
                    c.class_level, c.class_number,
                    c.class_name
             FROM enrollments e
             LEFT JOIN classes c ON c.id = e.class_id
             WHERE e.student_id = $1
             AND e.is_active = TRUE`,
            [student_id]
        );

        if (enrollmentQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student enrollment not found.'
            });
        }

        const enrollment = enrollmentQuery.rows[0];
        const currentClassId = enrollment.class_id;
        const currentStreamId = enrollment.stream_id;

        let toClassId = null;
        let toStreamId = stream_id || currentStreamId;
        let promotionStatus;

        await client.query('BEGIN');

        switch (action) {
            case 'promote':
                toClassId = await getNextClass(currentClassId);
                if (!toClassId) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: 'Student is already in the highest class. Use graduate instead.'
                    });
                }
                promotionStatus = 'promoted';
                break;

            case 'demote':
                toClassId = await getPreviousClass(currentClassId);
                if (!toClassId) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: 'Student is already in the lowest class. Cannot demote further.'
                    });
                }
                promotionStatus = 'repeated';
                break;

            case 'graduate':
                toClassId = null;
                promotionStatus = 'graduated';
                break;

            case 'repeat':
                toClassId = currentClassId;
                promotionStatus = 'repeated';
                break;

            case 'withdraw':
                toClassId = null;
                promotionStatus = 'withdrawn';
                break;
        }

        // Delete existing promotion for this session if any
        await client.query(
            `DELETE FROM promotions
             WHERE student_id = $1
             AND session_id = $2`,
            [student_id, session_id]
        );

        // Insert new promotion record
        await client.query(
            `INSERT INTO promotions (
                student_id, session_id,
                from_class_id, to_class_id,
                from_stream_id, to_stream_id,
                promotion_status, promoted_by,
                remarks
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
                student_id, session_id,
                currentClassId, toClassId,
                currentStreamId, toStreamId,
                promotionStatus, req.user.id,
                remarks || `Admin manually set status to ${action}`
            ]
        );

        // Update enrollment
        if (action === 'graduate' || action === 'withdraw') {
            // Deactivate enrollment only
            await client.query(
                `UPDATE enrollments
                 SET is_active = FALSE,
                     updated_at = NOW()
                 WHERE student_id = $1
                 AND is_active = TRUE`,
                [student_id]
            );

            // If withdrawn deactivate student account
            if (action === 'withdraw') {
                await client.query(
                    `UPDATE students
                     SET is_active = FALSE,
                         updated_at = NOW()
                     WHERE id = $1`,
                    [student_id]
                );
            }
        } else {
            // Update to new class
            await updateStudentEnrollment(
                client,
                student_id,
                toClassId,
                toStreamId,
                next_session_id || session_id
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
                `manual_${action}`,
                'promotions',
                'promotions',
                student_id,
                `Admin manually set student promotion 
                 status to: ${action}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Student has been ${action}d successfully.`,
            data: {
                student_id,
                action,
                promotion_status: promotionStatus,
                from_class_id: currentClassId,
                to_class_id: toClassId
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Manual promotion error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// GET PROMOTION HISTORY FOR A STUDENT
// ============================================
export const getStudentPromotionHistory = async (req, res) => {
    try {
        const { student_id } = req.params;

        const result = await db.query(
            `SELECT p.*,
                    fc.class_name AS from_class_name,
                    tc.class_name AS to_class_name,
                    fs.stream_name AS from_stream_name,
                    ts.stream_name AS to_stream_name,
                    s.session_name,
                    st.first_name, st.last_name,
                    st.admission_number
             FROM promotions p
             LEFT JOIN classes fc ON fc.id = p.from_class_id
             LEFT JOIN classes tc ON tc.id = p.to_class_id
             LEFT JOIN streams fs ON fs.id = p.from_stream_id
             LEFT JOIN streams ts ON ts.id = p.to_stream_id
             LEFT JOIN academic_sessions s ON s.id = p.session_id
             LEFT JOIN students st ON st.id = p.student_id
             WHERE p.student_id = $1
             ORDER BY p.promotion_date DESC`,
            [student_id]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get promotion history error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL PROMOTIONS FOR A CLASS AND SESSION
// ============================================
export const getClassPromotions = async (req, res) => {
    try {
        const { class_id, session_id } = req.query;

        if (!class_id || !session_id) {
            return res.status(400).json({
                success: false,
                message: 'Class and session are required.'
            });
        }

        const result = await db.query(
            `SELECT p.*,
                    fc.class_name AS from_class_name,
                    tc.class_name AS to_class_name,
                    s.session_name,
                    st.first_name, st.last_name,
                    st.admission_number,
                    st.passport_url
             FROM promotions p
             LEFT JOIN classes fc ON fc.id = p.from_class_id
             LEFT JOIN classes tc ON tc.id = p.to_class_id
             LEFT JOIN academic_sessions s ON s.id = p.session_id
             LEFT JOIN students st ON st.id = p.student_id
             WHERE p.from_class_id = $1
             AND p.session_id = $2
             ORDER BY p.promotion_status ASC,
                      st.first_name ASC`,
            [class_id, session_id]
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            promoted: result.rows.filter(
                r => r.promotion_status === 'promoted'
            ).length,
            repeated: result.rows.filter(
                r => r.promotion_status === 'repeated'
            ).length,
            graduated: result.rows.filter(
                r => r.promotion_status === 'graduated'
            ).length,
            withdrawn: result.rows.filter(
                r => r.promotion_status === 'withdrawn'
            ).length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get class promotions error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET PROMOTION SUMMARY FOR A SESSION
// ============================================
export const getPromotionSummary = async (req, res) => {
    try {
        const { session_id } = req.params;

        const result = await db.query(
            `SELECT
                COUNT(*) AS total_students,
                COUNT(*) FILTER (
                    WHERE promotion_status = 'promoted'
                ) AS promoted,
                COUNT(*) FILTER (
                    WHERE promotion_status = 'repeated'
                ) AS repeated,
                COUNT(*) FILTER (
                    WHERE promotion_status = 'graduated'
                ) AS graduated,
                COUNT(*) FILTER (
                    WHERE promotion_status = 'withdrawn'
                ) AS withdrawn
             FROM promotions
             WHERE session_id = $1`,
            [session_id]
        );

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get promotion summary error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};