import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// CREATE CALENDAR EVENT
// ============================================
export const createEvent = async (req, res) => {
    try {
        const {
            session_id,
            term_id,
            event_title,
            event_type,
            event_date,
            end_date,
            event_description,
            is_school_wide,
            affects_class_id,
            affects_stream_id,
            is_public
        } = req.body;

        if (!session_id || !event_title || !event_type || !event_date) {
            return res.status(400).json({
                success: false,
                message: 'Session, event title, type and date are required.'
            });
        }

        const result = await db.query(
            `INSERT INTO academic_calendar (
                session_id, term_id, event_title,
                event_type, event_date, end_date,
                event_description, is_school_wide,
                affects_class_id, affects_stream_id,
                is_public, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *`,
            [
                session_id,
                term_id || null,
                event_title,
                event_type,
                event_date,
                end_date || null,
                event_description || null,
                is_school_wide !== false,
                affects_class_id || null,
                affects_stream_id || null,
                is_public || false,
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
                'created_calendar_event',
                'calendar',
                'academic_calendar',
                result.rows[0].id,
                `Created calendar event: ${event_title}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Calendar event created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create event error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL EVENTS
// ============================================
export const getAllEvents = async (req, res) => {
    try {
        const {
            session_id,
            term_id,
            event_type,
            is_public,
            from_date,
            to_date
        } = req.query;

        let conditions = [];
        let values = [];
        let counter = 1;

        if (session_id) {
            conditions.push(`ac.session_id = $${counter}`);
            values.push(session_id);
            counter++;
        }

        if (term_id) {
            conditions.push(`ac.term_id = $${counter}`);
            values.push(term_id);
            counter++;
        }

        if (event_type) {
            conditions.push(`ac.event_type = $${counter}`);
            values.push(event_type);
            counter++;
        }

        if (is_public !== undefined) {
            conditions.push(`ac.is_public = $${counter}`);
            values.push(is_public === 'true');
            counter++;
        }

        if (from_date) {
            conditions.push(`ac.event_date >= $${counter}`);
            values.push(from_date);
            counter++;
        }

        if (to_date) {
            conditions.push(`ac.event_date <= $${counter}`);
            values.push(to_date);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await db.query(
            `SELECT ac.*,
                    s.session_name,
                    t.term_name,
                    c.class_name,
                    st.stream_name
             FROM academic_calendar ac
             LEFT JOIN academic_sessions s ON s.id = ac.session_id
             LEFT JOIN terms t ON t.id = ac.term_id
             LEFT JOIN classes c ON c.id = ac.affects_class_id
             LEFT JOIN streams st ON st.id = ac.affects_stream_id
             ${whereClause}
             ORDER BY ac.event_date ASC`,
            values
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get events error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET SINGLE EVENT
// ============================================
export const getSingleEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT ac.*,
                    s.session_name,
                    t.term_name,
                    c.class_name,
                    st.stream_name
             FROM academic_calendar ac
             LEFT JOIN academic_sessions s ON s.id = ac.session_id
             LEFT JOIN terms t ON t.id = ac.term_id
             LEFT JOIN classes c ON c.id = ac.affects_class_id
             LEFT JOIN streams st ON st.id = ac.affects_stream_id
             WHERE ac.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get single event error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// UPDATE EVENT
// ============================================
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            event_title,
            event_type,
            event_date,
            end_date,
            event_description,
            is_school_wide,
            affects_class_id,
            affects_stream_id,
            is_public
        } = req.body;

        const eventQuery = await db.query(
            `SELECT id FROM academic_calendar WHERE id = $1`,
            [id]
        );

        if (eventQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const result = await db.query(
            `UPDATE academic_calendar SET
                event_title = COALESCE($1, event_title),
                event_type = COALESCE($2, event_type),
                event_date = COALESCE($3, event_date),
                end_date = COALESCE($4, end_date),
                event_description = COALESCE($5, event_description),
                is_school_wide = COALESCE($6, is_school_wide),
                affects_class_id = COALESCE($7, affects_class_id),
                affects_stream_id = COALESCE($8, affects_stream_id),
                is_public = COALESCE($9, is_public),
                updated_at = NOW()
             WHERE id = $10
             RETURNING *`,
            [
                event_title || null,
                event_type || null,
                event_date || null,
                end_date || null,
                event_description || null,
                is_school_wide !== undefined ? is_school_wide : null,
                affects_class_id || null,
                affects_stream_id || null,
                is_public !== undefined ? is_public : null,
                id
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
                'updated_calendar_event',
                'calendar',
                'academic_calendar',
                id,
                `Updated calendar event: ${result.rows[0].event_title}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Event updated successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update event error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// DELETE EVENT
// ============================================
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const eventQuery = await db.query(
            `SELECT id, event_title
             FROM academic_calendar WHERE id = $1`,
            [id]
        );

        if (eventQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        await db.query(
            `DELETE FROM academic_calendar WHERE id = $1`,
            [id]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'deleted_calendar_event',
                'calendar',
                'academic_calendar',
                id,
                `Deleted calendar event: 
                 ${eventQuery.rows[0].event_title}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Event deleted successfully.'
        });

    } catch (error) {
        console.error('Delete event error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET UPCOMING EVENTS
// ============================================
export const getUpcomingEvents = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const result = await db.query(
            `SELECT ac.*,
                    s.session_name,
                    t.term_name
             FROM academic_calendar ac
             LEFT JOIN academic_sessions s ON s.id = ac.session_id
             LEFT JOIN terms t ON t.id = ac.term_id
             WHERE ac.event_date >= CURRENT_DATE
             ORDER BY ac.event_date ASC
             LIMIT $1`,
            [limit]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get upcoming events error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};