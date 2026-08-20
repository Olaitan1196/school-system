import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// GENERATE INVOICE NUMBER
// ============================================
const generateInvoiceNumber = async (client) => {
    const result = await client.query(
        `SELECT nextval('invoice_number_seq') AS seq`
    );
    const count = parseInt(result.rows[0].seq);
    const year = new Date().getFullYear();
    const sequence = String(count).padStart(4, '0');
    return `INV/CC/${year}/${sequence}`;
};


// ============================================
// GENERATE PAYMENT REFERENCE
// ============================================
const generatePaymentReference = async () => {
    const countQuery = await db.query(
        `SELECT COUNT(*) FROM payments`
    );
    const count = parseInt(countQuery.rows[0].count) + 1;
    const year = new Date().getFullYear();
    const sequence = String(count).padStart(4, '0');
    return `PAY/CC/${year}/${sequence}`;
};


// ============================================
// CREATE FEE ITEM
// ============================================
export const createFeeItem = async (req, res) => {
    try {
        const {
            item_name,
            item_code,
            description,
            is_result_fee
        } = req.body;

        if (!item_name || !item_code) {
            return res.status(400).json({
                success: false,
                message: 'Item name and code are required.'
            });
        }

        // Check if item code already exists
        const existing = await db.query(
            `SELECT id FROM fee_items WHERE item_code = $1`,
            [item_code]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Fee item code already exists.'
            });
        }

        const result = await db.query(
            `INSERT INTO fee_items
             (item_name, item_code, description, is_result_fee)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                item_name,
                item_code,
                description || null,
                is_result_fee || false
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
                'created_fee_item',
                'fees',
                'fee_items',
                result.rows[0].id,
                `Created fee item: ${item_name}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Fee item created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create fee item error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL FEE ITEMS
// ============================================
export const getAllFeeItems = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM fee_items
             WHERE is_active = TRUE
             ORDER BY item_name ASC`
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get fee items error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// SET FEE STRUCTURE
// ============================================
export const setFeeStructure = async (req, res) => {
    try {
        const {
            fee_item_id,
            class_id,
            session_id,
            term_id,
            amount
        } = req.body;

        if (!fee_item_id || !class_id || !session_id || !term_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Fee item, class, session, term and amount are required.'
            });
        }

        const result = await db.query(
            `INSERT INTO fee_structures
             (fee_item_id, class_id, session_id, term_id, amount)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (fee_item_id, class_id, session_id, term_id)
             DO UPDATE SET
                amount = EXCLUDED.amount,
                updated_at = NOW()
             RETURNING *`,
            [fee_item_id, class_id, session_id, term_id, amount]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'set_fee_structure',
                'fees',
                'fee_structures',
                result.rows[0].id,
                `Set fee structure: ₦${amount}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Fee structure set successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Set fee structure error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET FEE STRUCTURES
// ============================================
export const getFeeStructures = async (req, res) => {
    try {
        const { class_id, session_id, term_id } = req.query;

        let conditions = [];
        let values = [];
        let counter = 1;

        if (class_id) {
            conditions.push(`fs.class_id = $${counter}`);
            values.push(class_id);
            counter++;
        }

        if (session_id) {
            conditions.push(`fs.session_id = $${counter}`);
            values.push(session_id);
            counter++;
        }

        if (term_id) {
            conditions.push(`fs.term_id = $${counter}`);
            values.push(term_id);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await db.query(
            `SELECT fs.*,
                    fi.item_name, fi.item_code,
                    fi.is_result_fee,
                    c.class_name,
                    t.term_name,
                    s.session_name
             FROM fee_structures fs
             LEFT JOIN fee_items fi ON fi.id = fs.fee_item_id
             LEFT JOIN classes c ON c.id = fs.class_id
             LEFT JOIN terms t ON t.id = fs.term_id
             LEFT JOIN academic_sessions s ON s.id = fs.session_id
             ${whereClause}
             ORDER BY fi.item_name ASC`,
            values
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get fee structures error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GENERATE INVOICE FOR A STUDENT
// ============================================
export const generateInvoice = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            student_id,
            class_id,
            session_id,
            term_id
        } = req.body;

        if (!student_id || !class_id || !session_id || !term_id) {
            return res.status(400).json({
                success: false,
                message: 'Student, class, session and term are required.'
            });
        }

        // Check if invoice already exists
        const existing = await db.query(
            `SELECT id FROM invoices
             WHERE student_id = $1 AND term_id = $2`,
            [student_id, term_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invoice already exists for this student this term.'
            });
        }

        // Get fee structures for this class and term
        const feeStructures = await db.query(
            `SELECT fs.*, fi.item_name,
                    fi.item_code, fi.is_result_fee
             FROM fee_structures fs
             LEFT JOIN fee_items fi ON fi.id = fs.fee_item_id
             WHERE fs.class_id = $1
             AND fs.session_id = $2
             AND fs.term_id = $3`,
            [class_id, session_id, term_id]
        );

        if (feeStructures.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No fee structures found for this class and term. Please set fee structures first.'
            });
        }

        await client.query('BEGIN');

        // Calculate total amount
        const totalAmount = feeStructures.rows.reduce(
            (sum, fs) => sum + parseFloat(fs.amount), 0
        );

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(client);

        // Create invoice
        const invoice = await client.query(
            `INSERT INTO invoices (
                invoice_number, student_id, class_id,
                session_id, term_id, total_amount,
                total_paid, invoice_status, generated_by
            ) VALUES ($1, $2, $3, $4, $5, $6, 0, 'unpaid', $7)
            RETURNING *`,
            [
                invoiceNumber, student_id, class_id,
                session_id, term_id, totalAmount,
                req.user.id
            ]
        );

        const invoiceId = invoice.rows[0].id;

        // Create invoice items from fee structures
        const invoiceItems = [];
        for (const fs of feeStructures.rows) {
            const item = await client.query(
                `INSERT INTO invoice_items
                 (invoice_id, fee_item_id, amount_due)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [invoiceId, fs.fee_item_id, fs.amount]
            );
            invoiceItems.push(item.rows[0]);
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
                'generated_invoice',
                'invoices',
                'invoices',
                invoiceId,
                `Generated invoice ${invoiceNumber} 
                 for student. Total: ₦${totalAmount}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Invoice generated successfully.',
            data: {
                invoice: invoice.rows[0],
                items: invoiceItems
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Generate invoice error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// GENERATE INVOICES IN BULK FOR A CLASS
// ============================================
export const generateBulkInvoices = async (req, res) => {
    const client = await db.connect();
    try {
        const { class_id, session_id, term_id } = req.body;

        if (!class_id || !session_id || !term_id) {
            return res.status(400).json({
                success: false,
                message: 'Class, session and term are required.'
            });
        }

        // Get fee structures
        const feeStructures = await db.query(
            `SELECT fs.*, fi.item_name,
                    fi.item_code, fi.is_result_fee
             FROM fee_structures fs
             LEFT JOIN fee_items fi ON fi.id = fs.fee_item_id
             WHERE fs.class_id = $1
             AND fs.session_id = $2
             AND fs.term_id = $3`,
            [class_id, session_id, term_id]
        );

        if (feeStructures.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No fee structures found. Please set fee structures first.'
            });
        }

        // Get all enrolled students in this class
        const enrollments = await db.query(
            `SELECT e.student_id
             FROM enrollments e
             WHERE e.class_id = $1
             AND e.session_id = $2
             AND e.is_active = TRUE`,
            [class_id, session_id]
        );

        if (enrollments.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students enrolled in this class.'
            });
        }

        await client.query('BEGIN');

        const totalAmount = feeStructures.rows.reduce(
            (sum, fs) => sum + parseFloat(fs.amount), 0
        );

        const generatedInvoices = [];
        const skippedStudents = [];

        for (const enrollment of enrollments.rows) {
            const { student_id } = enrollment;

            // Skip if invoice already exists
            const existing = await client.query(
                `SELECT id FROM invoices
                 WHERE student_id = $1 AND term_id = $2`,
                [student_id, term_id]
            );

            if (existing.rows.length > 0) {
                skippedStudents.push(student_id);
                continue;
            }

            const invoiceNumber = await generateInvoiceNumber(client);

            const invoice = await client.query(
                `INSERT INTO invoices (
                    invoice_number, student_id, class_id,
                    session_id, term_id, total_amount,
                    total_paid, invoice_status, generated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, 0, 'unpaid', $7)
                RETURNING *`,
                [
                    invoiceNumber, student_id, class_id,
                    session_id, term_id, totalAmount,
                    req.user.id
                ]
            );

            const invoiceId = invoice.rows[0].id;

            for (const fs of feeStructures.rows) {
                await client.query(
                    `INSERT INTO invoice_items
                     (invoice_id, fee_item_id, amount_due)
                     VALUES ($1, $2, $3)`,
                    [invoiceId, fs.fee_item_id, fs.amount]
                );
            }

            generatedInvoices.push(invoice.rows[0]);
        }

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: `Invoices generated for ${generatedInvoices.length} students. ${skippedStudents.length} skipped (already have invoices).`,
            data: {
                generated: generatedInvoices.length,
                skipped: skippedStudents.length
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Bulk invoice error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// GET INVOICE FOR A STUDENT
// ============================================
export const getStudentInvoice = async (req, res) => {
    try {
        const { student_id, term_id } = req.params;

        const invoice = await db.query(
            `SELECT i.*,
                    s.first_name, s.last_name,
                    s.admission_number,
                    c.class_name,
                    t.term_name,
                    ses.session_name
             FROM invoices i
             LEFT JOIN students s ON s.id = i.student_id
             LEFT JOIN classes c ON c.id = i.class_id
             LEFT JOIN terms t ON t.id = i.term_id
             LEFT JOIN academic_sessions ses ON ses.id = i.session_id
             WHERE i.student_id = $1
             AND i.term_id = $2`,
            [student_id, term_id]
        );

        if (invoice.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found.'
            });
        }

        // Get invoice items
        const items = await db.query(
            `SELECT ii.*,
                    fi.item_name, fi.item_code,
                    fi.is_result_fee
             FROM invoice_items ii
             LEFT JOIN fee_items fi ON fi.id = ii.fee_item_id
             WHERE ii.invoice_id = $1
             ORDER BY fi.item_name ASC`,
            [invoice.rows[0].id]
        );

        // Get payments
        const payments = await db.query(
            `SELECT p.*
             FROM payments p
             WHERE p.invoice_id = $1
             ORDER BY p.payment_date DESC`,
            [invoice.rows[0].id]
        );

        return res.status(200).json({
            success: true,
            data: {
                invoice: invoice.rows[0],
                items: items.rows,
                payments: payments.rows
            }
        });

    } catch (error) {
        console.error('Get student invoice error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// RECORD PAYMENT
// ============================================
export const recordPayment = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            invoice_id,
            student_id,
            amount_paid,
            payment_method,
            payment_date,
            payment_proof_url,
            note,
            allocations
        } = req.body;

        // allocations is an array like this:
        // [
        //   { invoice_item_id, allocated_amount },
        //   ...
        // ]

        if (
            !invoice_id || !student_id ||
            !amount_paid || !payment_method
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invoice, student, amount and payment method are required.'
            });
        }

        // Validate allocations add up to amount paid
        if (allocations && allocations.length > 0) {
            const totalAllocated = allocations.reduce(
                (sum, a) => sum + parseFloat(a.allocated_amount), 0
            );

            if (Math.abs(totalAllocated - parseFloat(amount_paid)) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: `Allocations total (₦${totalAllocated}) must equal amount paid (₦${amount_paid}).`
                });
            }
        }

        await client.query('BEGIN');

        const paymentReference = await generatePaymentReference();

        // Create payment record
        const payment = await client.query(
            `INSERT INTO payments (
                payment_reference, invoice_id, student_id,
                amount_paid, payment_method, payment_date,
                payment_status, payment_proof_url,
                note, received_by
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)
            RETURNING *`,
            [
                paymentReference, invoice_id, student_id,
                amount_paid,
                payment_method,
                payment_date || new Date(),
                payment_proof_url || null,
                note || null,
                req.user.id
            ]
        );

        const paymentId = payment.rows[0].id;

        // Save allocations if provided
        if (allocations && allocations.length > 0) {
            for (const allocation of allocations) {
                await client.query(
                    `INSERT INTO payment_allocations
                     (payment_id, invoice_item_id, allocated_amount)
                     VALUES ($1, $2, $3)`,
                    [
                        paymentId,
                        allocation.invoice_item_id,
                        allocation.allocated_amount
                    ]
                );
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
                'recorded_payment',
                'payments',
                'payments',
                paymentId,
                `Recorded payment ${paymentReference}. 
                 Amount: ₦${amount_paid}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Payment recorded successfully. Awaiting admin approval.',
            data: payment.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Record payment error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};


// ============================================
// REVIEW PAYMENT (APPROVE/REJECT/EDIT)
// ============================================
export const reviewPayment = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const {
            action,
            new_amount,
            review_note
        } = req.body;

        const validActions = [
            'approved',
            'rejected',
            'amount_changed'
        ];

        if (!action || !validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Valid action is required: approved, rejected, amount_changed.'
            });
        }

        // Get current payment
        const paymentQuery = await db.query(
            `SELECT * FROM payments WHERE id = $1`,
            [payment_id]
        );

        if (paymentQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found.'
            });
        }

        const payment = paymentQuery.rows[0];
        const previousStatus = payment.payment_status;
        const previousAmount = payment.amount_paid;

        let newStatus = previousStatus;
        let newAmount = previousAmount;

        if (action === 'approved') newStatus = 'approved';
        if (action === 'rejected') newStatus = 'rejected';
        if (action === 'amount_changed') {
            if (!new_amount) {
                return res.status(400).json({
                    success: false,
                    message: 'New amount is required for amount_changed action.'
                });
            }
            newAmount = new_amount;
        }

        // Update payment
        await db.query(
            `UPDATE payments
             SET payment_status = $1,
                 amount_paid = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [newStatus, newAmount, payment_id]
        );

        // Log the review action
        await db.query(
            `INSERT INTO payment_reviews (
                payment_id, reviewed_by,
                previous_status, new_status,
                previous_amount, new_amount,
                action, review_note
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                payment_id,
                req.user.id,
                previousStatus,
                newStatus,
                previousAmount,
                newAmount,
                action,
                review_note || null
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
                `payment_${action}`,
                'payments',
                'payments',
                payment_id,
                `Admin ${action} payment ${payment.payment_reference}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Payment ${action} successfully.`
        });

    } catch (error) {
        console.error('Review payment error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// DELETE PAYMENT
// ============================================
export const deletePayment = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const { review_note } = req.body;

        const paymentQuery = await db.query(
            `SELECT * FROM payments WHERE id = $1`,
            [payment_id]
        );

        if (paymentQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found.'
            });
        }

        const payment = paymentQuery.rows[0];

        // Log the deletion before deleting
        await db.query(
            `INSERT INTO payment_reviews (
                payment_id, reviewed_by,
                previous_status, new_status,
                previous_amount, new_amount,
                action, review_note
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                payment_id,
                req.user.id,
                payment.payment_status,
                'deleted',
                payment.amount_paid,
                payment.amount_paid,
                'deleted',
                review_note || 'Admin deleted payment'
            ]
        );

        await db.query(
            `DELETE FROM payments WHERE id = $1`,
            [payment_id]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'deleted_payment',
                'payments',
                'payments',
                payment_id,
                `Admin deleted payment ${payment.payment_reference}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Payment deleted successfully.'
        });

    } catch (error) {
        console.error('Delete payment error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL PAYMENTS (ADMIN)
// ============================================
export const getAllPayments = async (req, res) => {
    try {
        const {
            payment_status,
            student_id,
            page = 1,
            limit = 20
        } = req.query;

        let conditions = [];
        let values = [];
        let counter = 1;

        if (payment_status) {
            conditions.push(`p.payment_status = $${counter}`);
            values.push(payment_status);
            counter++;
        }

        if (student_id) {
            conditions.push(`p.student_id = $${counter}`);
            values.push(student_id);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT p.*,
                    s.first_name, s.last_name,
                    s.admission_number,
                    i.invoice_number,
                    i.total_amount
             FROM payments p
             LEFT JOIN students s ON s.id = p.student_id
             LEFT JOIN invoices i ON i.id = p.invoice_id
             ${whereClause}
             ORDER BY p.created_at DESC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        const countQuery = await db.query(
            `SELECT COUNT(*) FROM payments p ${whereClause}`,
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
        console.error('Get all payments error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// ADD MANUAL PAYMENT (ADMIN)
// ============================================
export const addManualPayment = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            invoice_id,
            student_id,
            amount_paid,
            payment_method,
            payment_date,
            note,
            allocations
        } = req.body;

        if (
            !invoice_id || !student_id ||
            !amount_paid || !payment_method
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invoice, student, amount and payment method are required.'
            });
        }

        await client.query('BEGIN');

        const paymentReference = await generatePaymentReference();

        // Create payment and immediately approve it
        const payment = await client.query(
            `INSERT INTO payments (
                payment_reference, invoice_id, student_id,
                amount_paid, payment_method, payment_date,
                payment_status, note, received_by
            ) VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7, $8)
            RETURNING *`,
            [
                paymentReference, invoice_id, student_id,
                amount_paid, payment_method,
                payment_date || new Date(),
                note || null,
                req.user.id
            ]
        );

        const paymentId = payment.rows[0].id;

        // Save allocations if provided
        if (allocations && allocations.length > 0) {
            for (const allocation of allocations) {
                await client.query(
                    `INSERT INTO payment_allocations
                     (payment_id, invoice_item_id, allocated_amount)
                     VALUES ($1, $2, $3)`,
                    [
                        paymentId,
                        allocation.invoice_item_id,
                        allocation.allocated_amount
                    ]
                );
            }
        }

        // Log the review action
        await client.query(
            `INSERT INTO payment_reviews (
                payment_id, reviewed_by,
                previous_status, new_status,
                previous_amount, new_amount,
                action, review_note
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                paymentId,
                req.user.id,
                null,
                'approved',
                null,
                amount_paid,
                'added',
                'Admin manually added and approved payment'
            ]
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
                'added_manual_payment',
                'payments',
                'payments',
                paymentId,
                `Admin manually added payment ${paymentReference}. 
                 Amount: ₦${amount_paid}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Manual payment added and approved successfully.',
            data: payment.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Add manual payment error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    } finally {
        client.release();
    }
};

// ============================================
// GET OUTSTANDING INVOICES
// ============================================
export const getOutstandingInvoices = async (req, res) => {
    try {
        const { class_id, session_id, term_id } = req.query;

        let conditions = [
            `i.invoice_status IN ('unpaid', 'partial')`
        ];
        let values = [];
        let counter = 1;

        if (class_id) {
            conditions.push(`i.class_id = $${counter}`);
            values.push(class_id);
            counter++;
        }

        if (session_id) {
            conditions.push(`i.session_id = $${counter}`);
            values.push(session_id);
            counter++;
        }

        if (term_id) {
            conditions.push(`i.term_id = $${counter}`);
            values.push(term_id);
            counter++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const result = await db.query(
            `SELECT i.*,
                    s.first_name, s.last_name,
                    s.admission_number,
                    c.class_name,
                    t.term_name,
                    ses.session_name
             FROM invoices i
             LEFT JOIN students s ON s.id = i.student_id
             LEFT JOIN classes c ON c.id = i.class_id
             LEFT JOIN terms t ON t.id = i.term_id
             LEFT JOIN academic_sessions ses ON ses.id = i.session_id
             ${whereClause}
             ORDER BY i.balance DESC`,
            values
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get outstanding error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};