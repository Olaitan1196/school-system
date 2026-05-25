import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// HELPER: GENERATE ACCESS TOKEN
// ============================================
const generateAccessToken = async () => {
    const countQuery = await db.query(
        `SELECT COUNT(*) FROM exam_access_requests`
    );
    const count = parseInt(countQuery.rows[0].count) + 1;
    const year = new Date().getFullYear();
    const sequence = String(count).padStart(4, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EXM-${year}-${sequence}-${random}`;
};


// ============================================
// VERIFY STUDENT OR STAFF ACCESS
// ============================================
// This is called when visitor enters their ID
// to access the public exam portal

export const verifyMemberAccess = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Student ID or Staff ID is required.'
            });
        }

        // Check if it is a student admission number
        const studentQuery = await db.query(
            `SELECT s.id, s.first_name, s.last_name,
                    s.admission_number, s.is_active
             FROM students s
             WHERE s.admission_number = $1`,
            [identifier]
        );

        if (studentQuery.rows.length > 0) {
            const student = studentQuery.rows[0];

            if (!student.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Your student account is not active. Please contact the school admin.'
                });
            }

            return res.status(200).json({
                success: true,
                access_granted: true,
                member_type: 'student',
                message: `Welcome ${student.first_name}. Access granted.`,
                data: {
                    name: `${student.first_name} ${student.last_name}`,
                    identifier: student.admission_number
                }
            });
        }

        // Check if it is a teacher staff ID
        const teacherQuery = await db.query(
            `SELECT t.id, t.first_name, t.last_name,
                    t.staff_id, t.is_active
             FROM teachers t
             WHERE t.staff_id = $1`,
            [identifier]
        );

        if (teacherQuery.rows.length > 0) {
            const teacher = teacherQuery.rows[0];

            if (!teacher.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Your staff account is not active. Please contact the school admin.'
                });
            }

            return res.status(200).json({
                success: true,
                access_granted: true,
                member_type: 'teacher',
                message: `Welcome ${teacher.first_name}. Access granted.`,
                data: {
                    name: `${teacher.first_name} ${teacher.last_name}`,
                    identifier: teacher.staff_id
                }
            });
        }

        // Check if it is a valid access token
        // for non members who were granted access
        const tokenQuery = await db.query(
            `SELECT * FROM exam_access_requests
             WHERE access_token = $1
             AND request_status IN (
                 'approved_free',
                 'payment_confirmed'
             )
             AND (
                 token_expires_at IS NULL OR
                 token_expires_at > NOW()
             )`,
            [identifier]
        );

        if (tokenQuery.rows.length > 0) {
            const tokenData = tokenQuery.rows[0];

            return res.status(200).json({
                success: true,
                access_granted: true,
                member_type: 'guest',
                message: `Welcome ${tokenData.full_name}. Access granted.`,
                data: {
                    name: tokenData.full_name,
                    identifier: tokenData.access_token
                }
            });
        }

        // Nothing matched
        return res.status(401).json({
            success: false,
            access_granted: false,
            message: 'ID not recognized. Please request access if you are not a student or staff.'
        });

    } catch (error) {
        console.error('Verify access error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// SUBMIT ACCESS REQUEST (VISITOR)
// ============================================
export const submitAccessRequest = async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            reason
        } = req.body;

        if (!full_name) {
            return res.status(400).json({
                success: false,
                message: 'Full name is required.'
            });
        }

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone is required so we can reach you.'
            });
        }

        // Check if this email or phone already has
        // a pending request
        if (email) {
            const existingRequest = await db.query(
                `SELECT id, request_status
                 FROM exam_access_requests
                 WHERE email = $1
                 AND request_status IN (
                     'pending',
                     'approved_free',
                     'approved_paid',
                     'payment_pending'
                 )`,
                [email]
            );

            if (existingRequest.rows.length > 0) {
                const status = existingRequest.rows[0].request_status;

                if (status === 'pending') {
                    return res.status(400).json({
                        success: false,
                        message: 'You already have a pending request. Please wait for admin review.'
                    });
                }

                if (
                    status === 'approved_free' ||
                    status === 'payment_confirmed'
                ) {
                    return res.status(400).json({
                        success: false,
                        message: 'You already have an approved request. Please check your email or phone for your access token.'
                    });
                }
            }
        }

        const result = await db.query(
            `INSERT INTO exam_access_requests (
                full_name, email, phone,
                reason, ip_address
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                full_name,
                email || null,
                phone || null,
                reason || null,
                req.ip
            ]
        );

        // Create notification for admin
        await db.query(
            `INSERT INTO notifications (
                recipient_role, title, message,
                notification_type
            ) VALUES ($1, $2, $3, $4)`,
            [
                'admin',
                'New Exam Access Request',
                `${full_name} has requested access to the public exam portal.`,
                'general'
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Access request submitted successfully. You will be notified once the admin reviews your request.',
            data: {
                request_id: result.rows[0].id,
                status: result.rows[0].request_status
            }
        });

    } catch (error) {
        console.error('Submit request error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL ACCESS REQUESTS (ADMIN)
// ============================================
export const getAllRequests = async (req, res) => {
    try {
        const {
            request_status,
            page = 1,
            limit = 20
        } = req.query;

        let conditions = [];
        let values = [];
        let counter = 1;

        if (request_status) {
            conditions.push(`request_status = $${counter}`);
            values.push(request_status);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT * FROM exam_access_requests
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        const countQuery = await db.query(
            `SELECT COUNT(*) FROM exam_access_requests
             ${whereClause}`,
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
        console.error('Get requests error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// REVIEW ACCESS REQUEST (ADMIN)
// ============================================
export const reviewAccessRequest = async (req, res) => {
    try {
        const { request_id } = req.params;
        const {
            action,
            payment_amount,
            rejection_reason,
            token_expires_days
        } = req.body;

        // action options:
        // approve_free, approve_paid, reject

        const validActions = [
            'approve_free',
            'approve_paid',
            'reject'
        ];

        if (!action || !validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Valid action is required: approve_free, approve_paid, reject.'
            });
        }

        const requestQuery = await db.query(
            `SELECT * FROM exam_access_requests
             WHERE id = $1`,
            [request_id]
        );

        if (requestQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Access request not found.'
            });
        }

        const request = requestQuery.rows[0];
        let updateData = {};
        let responseMessage = '';

        if (action === 'approve_free') {
            // Generate token immediately
            const token = await generateAccessToken();
            const expiresAt = token_expires_days
                ? new Date(
                    Date.now() +
                    token_expires_days * 24 * 60 * 60 * 1000
                )
                : null;

            await db.query(
                `UPDATE exam_access_requests SET
                    request_status = 'approved_free',
                    access_token = $1,
                    token_expires_at = $2,
                    requires_payment = FALSE,
                    reviewed_by = $3,
                    reviewed_at = NOW(),
                    updated_at = NOW()
                 WHERE id = $4`,
                [token, expiresAt, req.user.id, request_id]
            );

            responseMessage = `Request approved. Token: ${token}`;

            // Notify the visitor
            // In production this would send email/SMS
            updateData = { token, status: 'approved_free' };

        } else if (action === 'approve_paid') {
            if (!payment_amount || payment_amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment amount is required for paid approval.'
                });
            }

            await db.query(
                `UPDATE exam_access_requests SET
                    request_status = 'payment_pending',
                    requires_payment = TRUE,
                    payment_amount = $1,
                    reviewed_by = $2,
                    reviewed_at = NOW(),
                    updated_at = NOW()
                 WHERE id = $3`,
                [payment_amount, req.user.id, request_id]
            );

            responseMessage = `Payment of ₦${payment_amount} required.`;
            updateData = {
                status: 'payment_pending',
                payment_amount
            };

        } else if (action === 'reject') {
            await db.query(
                `UPDATE exam_access_requests SET
                    request_status = 'rejected',
                    rejection_reason = $1,
                    reviewed_by = $2,
                    reviewed_at = NOW(),
                    updated_at = NOW()
                 WHERE id = $3`,
                [
                    rejection_reason || 'Request denied by admin.',
                    req.user.id,
                    request_id
                ]
            );

            responseMessage = 'Request rejected.';
            updateData = { status: 'rejected' };
        }

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                `exam_access_${action}`,
                'system',
                'exam_access_requests',
                request_id,
                `Admin ${action} exam access request 
                 for ${request.full_name}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: responseMessage,
            data: updateData
        });

    } catch (error) {
        console.error('Review request error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// VISITOR SUBMITS PAYMENT PROOF
// ============================================
export const submitPaymentProof = async (req, res) => {
    try {
        const { request_id } = req.params;
        const { payment_proof_url } = req.body;

        if (!payment_proof_url) {
            return res.status(400).json({
                success: false,
                message: 'Payment proof is required.'
            });
        }

        const requestQuery = await db.query(
            `SELECT * FROM exam_access_requests
             WHERE id = $1
             AND request_status = 'payment_pending'`,
            [request_id]
        );

        if (requestQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or not in payment pending status.'
            });
        }

        await db.query(
            `UPDATE exam_access_requests SET
                payment_proof_url = $1,
                payment_status = 'paid',
                updated_at = NOW()
             WHERE id = $2`,
            [payment_proof_url, request_id]
        );

        // Notify admin
        await db.query(
            `INSERT INTO notifications (
                recipient_role, title, message,
                notification_type
            ) VALUES ($1, $2, $3, $4)`,
            [
                'admin',
                'Exam Access Payment Submitted',
                `${requestQuery.rows[0].full_name} has submitted payment proof for exam access.`,
                'payment_received'
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Payment proof submitted. Awaiting admin verification.'
        });

    } catch (error) {
        console.error('Submit payment proof error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ADMIN CONFIRMS VISITOR PAYMENT
// ============================================
export const confirmVisitorPayment = async (req, res) => {
    try {
        const { request_id } = req.params;
        const { token_expires_days } = req.body;

        const requestQuery = await db.query(
            `SELECT * FROM exam_access_requests
             WHERE id = $1
             AND request_status = 'payment_pending'
             AND payment_status = 'paid'`,
            [request_id]
        );

        if (requestQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or payment not submitted yet.'
            });
        }

        const request = requestQuery.rows[0];

        // Generate token
        const token = await generateAccessToken();
        const expiresAt = token_expires_days
            ? new Date(
                Date.now() +
                token_expires_days * 24 * 60 * 60 * 1000
            )
            : null;

        await db.query(
            `UPDATE exam_access_requests SET
                request_status = 'payment_confirmed',
                payment_status = 'verified',
                access_token = $1,
                token_expires_at = $2,
                reviewed_by = $3,
                reviewed_at = NOW(),
                updated_at = NOW()
             WHERE id = $4`,
            [token, expiresAt, req.user.id, request_id]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'confirmed_visitor_payment',
                'system',
                'exam_access_requests',
                request_id,
                `Admin confirmed payment for ${request.full_name}. 
                 Token: ${token}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Payment confirmed. Access token generated.',
            data: { token, expires_at: expiresAt }
        });

    } catch (error) {
        console.error('Confirm payment error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// CHECK REQUEST STATUS (VISITOR)
// ============================================
// Visitor can check the status of their request
// using their email or phone

export const checkRequestStatus = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone is required.'
            });
        }

        const result = await db.query(
            `SELECT id, full_name, request_status,
                    requires_payment, payment_amount,
                    payment_status, access_token,
                    token_expires_at, rejection_reason,
                    created_at
             FROM exam_access_requests
             WHERE email = $1 OR phone = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [identifier]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No request found for this email or phone.'
            });
        }

        const request = result.rows[0];

        // Build response based on status
        let statusMessage = '';
        let showToken = false;
        let showPayment = false;

        switch (request.request_status) {
            case 'pending':
                statusMessage = 'Your request is pending admin review. Please check back later.';
                break;
            case 'approved_free':
                statusMessage = 'Your request has been approved. Use the token below to access the exam portal.';
                showToken = true;
                break;
            case 'payment_pending':
                statusMessage = `Your request requires a payment of ₦${request.payment_amount}. Please make payment and upload proof.`;
                showPayment = true;
                break;
            case 'payment_confirmed':
                statusMessage = 'Your payment has been confirmed. Use the token below to access the exam portal.';
                showToken = true;
                break;
            case 'rejected':
                statusMessage = `Your request was rejected. Reason: ${request.rejection_reason || 'Not specified.'}`;
                break;
            default:
                statusMessage = 'Unknown status.';
        }

        return res.status(200).json({
            success: true,
            data: {
                status: request.request_status,
                message: statusMessage,
                token: showToken ? request.access_token : null,
                token_expires_at: showToken
                    ? request.token_expires_at
                    : null,
                payment_amount: showPayment
                    ? request.payment_amount
                    : null,
                request_id: showPayment ? request.id : null
            }
        });

    } catch (error) {
        console.error('Check status error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};