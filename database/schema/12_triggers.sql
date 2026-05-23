-- ============================================
-- TRIGGERS FOR COMFORTER'S COLLEGE SYSTEM
-- ============================================


-- ============================================
-- TRIGGER 1: UPDATE INVOICE WHEN PAYMENT
-- IS APPROVED
-- ============================================
-- When admin approves a payment, this trigger
-- automatically updates the invoice total_paid
-- and changes the invoice status

CREATE OR REPLACE FUNCTION update_invoice_on_payment_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run when payment status changes to approved
    IF NEW.payment_status = 'approved' AND OLD.payment_status != 'approved' THEN

        -- Update total_paid on the invoice
        UPDATE invoices
        SET total_paid = (
            SELECT COALESCE(SUM(amount_paid), 0)
            FROM payments
            WHERE invoice_id = NEW.invoice_id
            AND payment_status = 'approved'
        ),
        -- Update invoice status based on balance
        invoice_status = CASE
            WHEN (
                total_amount - (
                    SELECT COALESCE(SUM(amount_paid), 0)
                    FROM payments
                    WHERE invoice_id = NEW.invoice_id
                    AND payment_status = 'approved'
                )
            ) <= 0 THEN 'paid'
            WHEN (
                SELECT COALESCE(SUM(amount_paid), 0)
                FROM payments
                WHERE invoice_id = NEW.invoice_id
                AND payment_status = 'approved'
            ) > 0 THEN 'partial'
            ELSE 'unpaid'
        END,
        updated_at = NOW()
        WHERE id = NEW.invoice_id;

    END IF;

    -- Also run when payment status changes FROM approved
    -- meaning admin reversed an approval
    IF OLD.payment_status = 'approved' AND NEW.payment_status != 'approved' THEN

        UPDATE invoices
        SET total_paid = (
            SELECT COALESCE(SUM(amount_paid), 0)
            FROM payments
            WHERE invoice_id = NEW.invoice_id
            AND payment_status = 'approved'
        ),
        invoice_status = CASE
            WHEN (
                SELECT COALESCE(SUM(amount_paid), 0)
                FROM payments
                WHERE invoice_id = NEW.invoice_id
                AND payment_status = 'approved'
            ) = 0 THEN 'unpaid'
            ELSE 'partial'
        END,
        updated_at = NOW()
        WHERE id = NEW.invoice_id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_on_payment
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_on_payment_approval();


-- ============================================
-- TRIGGER 2: UPDATE INVOICE ITEMS WHEN
-- PAYMENT ALLOCATION IS MADE
-- ============================================
-- When a payment is allocated to an invoice item
-- this trigger updates that item's amount_paid
-- and marks it as paid if fully covered

CREATE OR REPLACE FUNCTION update_invoice_item_on_allocation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoice_items
    SET amount_paid = (
        SELECT COALESCE(SUM(pa.allocated_amount), 0)
        FROM payment_allocations pa
        JOIN payments p ON pa.payment_id = p.id
        WHERE pa.invoice_item_id = NEW.invoice_item_id
        AND p.payment_status = 'approved'
    ),
    is_paid = CASE
        WHEN (
            SELECT COALESCE(SUM(pa.allocated_amount), 0)
            FROM payment_allocations pa
            JOIN payments p ON pa.payment_id = p.id
            WHERE pa.invoice_item_id = NEW.invoice_item_id
            AND p.payment_status = 'approved'
        ) >= amount_due THEN TRUE
        ELSE FALSE
    END,
    updated_at = NOW()
    WHERE id = NEW.invoice_item_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_item_on_allocation
AFTER INSERT OR UPDATE ON payment_allocations
FOR EACH ROW
EXECUTE FUNCTION update_invoice_item_on_allocation();


-- ============================================
-- TRIGGER 3: AUTO GENERATE RESULT ACCESS TOKEN
-- ============================================
-- When an invoice status changes to paid
-- this trigger checks if all conditions are met
-- and automatically generates a result token

CREATE OR REPLACE FUNCTION auto_generate_result_token()
RETURNS TRIGGER AS $$
DECLARE
    v_token VARCHAR(100);
    v_student_id UUID;
    v_term_id UUID;
    v_session_id UUID;
    v_has_result_fee BOOLEAN;
    v_existing_token UUID;
BEGIN
    -- Only run when invoice becomes fully paid
    IF NEW.invoice_status = 'paid' AND OLD.invoice_status != 'paid' THEN

        v_student_id := NEW.student_id;
        v_term_id := NEW.term_id;
        v_session_id := NEW.session_id;

        -- Check if this invoice has a result fee item
        SELECT EXISTS (
            SELECT 1
            FROM invoice_items ii
            JOIN fee_items fi ON ii.fee_item_id = fi.id
            WHERE ii.invoice_id = NEW.id
            AND fi.is_result_fee = TRUE
            AND ii.is_paid = TRUE
        ) INTO v_has_result_fee;

        -- Only generate token if result fee exists and is paid
        IF v_has_result_fee THEN

            -- Check if token already exists
            SELECT id INTO v_existing_token
            FROM result_access_tokens
            WHERE student_id = v_student_id
            AND term_id = v_term_id;

            -- Only create if no token exists yet
            IF v_existing_token IS NULL THEN

                -- Generate unique token
                v_token := UPPER(
                    'CC-' ||
                    TO_CHAR(NOW(), 'YYYY') || '-' ||
                    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
                    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
                    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
                );

                -- Insert the token
                INSERT INTO result_access_tokens (
                    token,
                    student_id,
                    term_id,
                    session_id,
                    invoice_id,
                    is_used,
                    is_active,
                    generated_by
                ) VALUES (
                    v_token,
                    v_student_id,
                    v_term_id,
                    v_session_id,
                    NEW.id,
                    FALSE,
                    TRUE,
                    'system'
                );

            END IF;
        END IF;
    END IF;

    -- If invoice goes back to partial or unpaid
    -- deactivate the token immediately
    IF OLD.invoice_status = 'paid' AND NEW.invoice_status != 'paid' THEN

        UPDATE result_access_tokens
        SET is_active = FALSE,
            updated_at = NOW()
        WHERE student_id = NEW.student_id
        AND term_id = NEW.term_id
        AND is_active = TRUE;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_result_token
AFTER UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION auto_generate_result_token();


-- ============================================
-- TRIGGER 4: UPDATE AVAILABLE COPIES
-- WHEN BOOK IS BORROWED OR RETURNED
-- ============================================
-- When a book is borrowed, available copies
-- reduces by 1. When returned, it increases by 1

CREATE OR REPLACE FUNCTION update_book_copies_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new borrowing record is created
    IF TG_OP = 'INSERT' THEN
        UPDATE library_books
        SET available_copies = available_copies - 1,
            updated_at = NOW()
        WHERE id = NEW.book_id
        AND available_copies > 0;
    END IF;

    -- When borrow status changes to returned
    IF TG_OP = 'UPDATE' THEN
        IF NEW.borrow_status = 'returned' 
        AND OLD.borrow_status != 'returned' THEN
            UPDATE library_books
            SET available_copies = available_copies + 1,
                updated_at = NOW()
            WHERE id = NEW.book_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_book_copies
AFTER INSERT OR UPDATE ON book_borrowings
FOR EACH ROW
EXECUTE FUNCTION update_book_copies_on_borrow();


-- ============================================
-- TRIGGER 5: AUTO MARK OVERDUE BOOKS
-- ============================================
-- This trigger marks borrowed books as overdue
-- when the due date has passed and book
-- has not been returned
-- This runs every time the borrowings table
-- is queried or updated

CREATE OR REPLACE FUNCTION mark_overdue_books()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE book_borrowings
    SET borrow_status = 'overdue',
        updated_at = NOW()
    WHERE borrow_status = 'borrowed'
    AND due_date < CURRENT_DATE
    AND returned_date IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_overdue_books
AFTER INSERT OR UPDATE ON book_borrowings
FOR EACH ROW
EXECUTE FUNCTION mark_overdue_books();


-- ============================================
-- TRIGGER 6: AUTO UPDATE updated_at COLUMN
-- ============================================
-- Every table has an updated_at column
-- This trigger automatically updates it
-- whenever a record is changed
-- We apply this to all major tables

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
CREATE TRIGGER trigger_updated_at_schools
BEFORE UPDATE ON schools
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_academic_sessions
BEFORE UPDATE ON academic_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_terms
BEFORE UPDATE ON terms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_classes
BEFORE UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_streams
BEFORE UPDATE ON streams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_subjects
BEFORE UPDATE ON subjects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_students
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_teachers
BEFORE UPDATE ON teachers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_parents
BEFORE UPDATE ON parents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_enrollments
BEFORE UPDATE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_scores
BEFORE UPDATE ON scores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_report_cards
BEFORE UPDATE ON report_cards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_invoices
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_invoice_items
BEFORE UPDATE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_payments
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_result_access_tokens
BEFORE UPDATE ON result_access_tokens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_library_books
BEFORE UPDATE ON library_books
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_book_borrowings
BEFORE UPDATE ON book_borrowings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_notifications
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_sync_queue
BEFORE UPDATE ON sync_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();