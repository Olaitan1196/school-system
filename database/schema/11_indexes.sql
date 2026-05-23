-- ============================================
-- INDEXES FOR COMFORTER'S COLLEGE SYSTEM
-- ============================================

-- ACADEMIC SESSIONS
CREATE INDEX idx_academic_sessions_is_current 
ON academic_sessions(is_current);

-- TERMS
CREATE INDEX idx_terms_session_id 
ON terms(session_id);

CREATE INDEX idx_terms_is_current 
ON terms(is_current);

-- CLASSES
CREATE INDEX idx_classes_level 
ON classes(class_level);

-- STREAMS
CREATE INDEX idx_streams_class_id 
ON streams(class_id);

-- CLASS SUBJECTS
CREATE INDEX idx_class_subjects_class_id 
ON class_subjects(class_id);

CREATE INDEX idx_class_subjects_subject_id 
ON class_subjects(subject_id);

CREATE INDEX idx_class_subjects_stream_id 
ON class_subjects(stream_id);

-- USERS
CREATE INDEX idx_users_role 
ON users(role);

CREATE INDEX idx_users_is_active 
ON users(is_active);

-- STUDENTS
CREATE INDEX idx_students_user_id 
ON students(user_id);

CREATE INDEX idx_students_admission_number 
ON students(admission_number);

CREATE INDEX idx_students_is_active 
ON students(is_active);

-- TEACHERS
CREATE INDEX idx_teachers_user_id 
ON teachers(user_id);

CREATE INDEX idx_teachers_staff_id 
ON teachers(staff_id);

CREATE INDEX idx_teachers_is_active 
ON teachers(is_active);

-- PARENTS
CREATE INDEX idx_parents_student_id 
ON parents(student_id);

-- ENROLLMENTS
CREATE INDEX idx_enrollments_student_id 
ON enrollments(student_id);

CREATE INDEX idx_enrollments_class_id 
ON enrollments(class_id);

CREATE INDEX idx_enrollments_session_id 
ON enrollments(session_id);

CREATE INDEX idx_enrollments_is_active 
ON enrollments(is_active);

-- TEACHER ASSIGNMENTS
CREATE INDEX idx_teacher_assignments_teacher_id 
ON teacher_assignments(teacher_id);

CREATE INDEX idx_teacher_assignments_class_id 
ON teacher_assignments(class_id);

CREATE INDEX idx_teacher_assignments_session_id 
ON teacher_assignments(session_id);

-- SCORES
CREATE INDEX idx_scores_student_id 
ON scores(student_id);

CREATE INDEX idx_scores_subject_id 
ON scores(subject_id);

CREATE INDEX idx_scores_class_id 
ON scores(class_id);

CREATE INDEX idx_scores_term_id 
ON scores(term_id);

CREATE INDEX idx_scores_session_id 
ON scores(session_id);

-- REPORT CARDS
CREATE INDEX idx_report_cards_student_id 
ON report_cards(student_id);

CREATE INDEX idx_report_cards_term_id 
ON report_cards(term_id);

CREATE INDEX idx_report_cards_session_id 
ON report_cards(session_id);

CREATE INDEX idx_report_cards_is_published 
ON report_cards(is_published);

-- CLASS RANKINGS
CREATE INDEX idx_class_rankings_student_id 
ON class_rankings(student_id);

CREATE INDEX idx_class_rankings_class_id 
ON class_rankings(class_id);

CREATE INDEX idx_class_rankings_term_id 
ON class_rankings(term_id);

-- PROMOTIONS
CREATE INDEX idx_promotions_student_id 
ON promotions(student_id);

CREATE INDEX idx_promotions_session_id 
ON promotions(session_id);

-- ATTENDANCE
CREATE INDEX idx_attendance_student_id 
ON attendance(student_id);

CREATE INDEX idx_attendance_class_id 
ON attendance(class_id);

CREATE INDEX idx_attendance_term_id 
ON attendance(term_id);

CREATE INDEX idx_attendance_date 
ON attendance(attendance_date);

CREATE INDEX idx_attendance_status 
ON attendance(status);

-- FEE ITEMS
CREATE INDEX idx_fee_items_is_result_fee 
ON fee_items(is_result_fee);

CREATE INDEX idx_fee_items_is_active 
ON fee_items(is_active);

-- FEE STRUCTURES
CREATE INDEX idx_fee_structures_fee_item_id 
ON fee_structures(fee_item_id);

CREATE INDEX idx_fee_structures_class_id 
ON fee_structures(class_id);

CREATE INDEX idx_fee_structures_term_id 
ON fee_structures(term_id);

-- INVOICES
CREATE INDEX idx_invoices_student_id 
ON invoices(student_id);

CREATE INDEX idx_invoices_term_id 
ON invoices(term_id);

CREATE INDEX idx_invoices_session_id 
ON invoices(session_id);

CREATE INDEX idx_invoices_invoice_status 
ON invoices(invoice_status);

-- INVOICE ITEMS
CREATE INDEX idx_invoice_items_invoice_id 
ON invoice_items(invoice_id);

CREATE INDEX idx_invoice_items_fee_item_id 
ON invoice_items(fee_item_id);

CREATE INDEX idx_invoice_items_is_paid 
ON invoice_items(is_paid);

-- PAYMENTS
CREATE INDEX idx_payments_invoice_id 
ON payments(invoice_id);

CREATE INDEX idx_payments_student_id 
ON payments(student_id);

CREATE INDEX idx_payments_payment_status 
ON payments(payment_status);

CREATE INDEX idx_payments_payment_date 
ON payments(payment_date);

-- PAYMENT ALLOCATIONS
CREATE INDEX idx_payment_allocations_payment_id 
ON payment_allocations(payment_id);

CREATE INDEX idx_payment_allocations_invoice_item_id 
ON payment_allocations(invoice_item_id);

-- PAYMENT REVIEWS
CREATE INDEX idx_payment_reviews_payment_id 
ON payment_reviews(payment_id);

CREATE INDEX idx_payment_reviews_reviewed_by 
ON payment_reviews(reviewed_by);

-- RESULT ACCESS TOKENS
CREATE INDEX idx_result_access_tokens_student_id 
ON result_access_tokens(student_id);

CREATE INDEX idx_result_access_tokens_term_id 
ON result_access_tokens(term_id);

CREATE INDEX idx_result_access_tokens_token 
ON result_access_tokens(token);

CREATE INDEX idx_result_access_tokens_is_active 
ON result_access_tokens(is_active);

-- RESULT PRINT LOGS
CREATE INDEX idx_result_print_logs_student_id 
ON result_print_logs(student_id);

CREATE INDEX idx_result_print_logs_term_id 
ON result_print_logs(term_id);

CREATE INDEX idx_result_print_logs_printed_by 
ON result_print_logs(printed_by);

-- CBT QUESTION BANKS
CREATE INDEX idx_question_banks_subject_id 
ON question_banks(subject_id);

CREATE INDEX idx_question_banks_class_id 
ON question_banks(class_id);

CREATE INDEX idx_question_banks_difficulty_level 
ON question_banks(difficulty_level);

CREATE INDEX idx_question_banks_is_active 
ON question_banks(is_active);

-- CBT EXAMS
CREATE INDEX idx_cbt_exams_subject_id 
ON cbt_exams(subject_id);

CREATE INDEX idx_cbt_exams_class_id 
ON cbt_exams(class_id);

CREATE INDEX idx_cbt_exams_term_id 
ON cbt_exams(term_id);

-- CBT SESSIONS
CREATE INDEX idx_cbt_sessions_exam_id 
ON cbt_sessions(exam_id);

CREATE INDEX idx_cbt_sessions_scheduled_date 
ON cbt_sessions(scheduled_date);

CREATE INDEX idx_cbt_sessions_is_open 
ON cbt_sessions(is_open);

-- CBT RESULTS
CREATE INDEX idx_cbt_results_student_id 
ON cbt_results(student_id);

CREATE INDEX idx_cbt_results_exam_id 
ON cbt_results(exam_id);

CREATE INDEX idx_cbt_results_cbt_session_id 
ON cbt_results(cbt_session_id);

-- PUBLIC EXAM QUESTIONS
CREATE INDEX idx_public_exam_questions_exam_body 
ON public_exam_questions(exam_body);

CREATE INDEX idx_public_exam_questions_subject_name 
ON public_exam_questions(subject_name);

CREATE INDEX idx_public_exam_questions_year 
ON public_exam_questions(year);

-- PUBLIC EXAM ATTEMPTS
CREATE INDEX idx_public_exam_attempts_exam_body 
ON public_exam_attempts(exam_body);

CREATE INDEX idx_public_exam_attempts_subject_name 
ON public_exam_attempts(subject_name);

-- LIBRARY BOOKS
CREATE INDEX idx_library_books_subject_id 
ON library_books(subject_id);

CREATE INDEX idx_library_books_book_type 
ON library_books(book_type);

CREATE INDEX idx_library_books_class_level 
ON library_books(class_level);

CREATE INDEX idx_library_books_is_active 
ON library_books(is_active);

-- BOOK BORROWINGS
CREATE INDEX idx_book_borrowings_book_id 
ON book_borrowings(book_id);

CREATE INDEX idx_book_borrowings_borrower_id 
ON book_borrowings(borrower_id);

CREATE INDEX idx_book_borrowings_borrow_status 
ON book_borrowings(borrow_status);

CREATE INDEX idx_book_borrowings_due_date 
ON book_borrowings(due_date);

-- ACADEMIC CALENDAR
CREATE INDEX idx_academic_calendar_session_id 
ON academic_calendar(session_id);

CREATE INDEX idx_academic_calendar_term_id 
ON academic_calendar(term_id);

CREATE INDEX idx_academic_calendar_event_date 
ON academic_calendar(event_date);

CREATE INDEX idx_academic_calendar_event_type 
ON academic_calendar(event_type);

-- AUDIT LOGS
CREATE INDEX idx_audit_logs_user_id 
ON audit_logs(user_id);

CREATE INDEX idx_audit_logs_module 
ON audit_logs(module);

CREATE INDEX idx_audit_logs_created_at 
ON audit_logs(created_at);

-- NOTIFICATIONS
CREATE INDEX idx_notifications_recipient_id 
ON notifications(recipient_id);

CREATE INDEX idx_notifications_is_read 
ON notifications(is_read);

CREATE INDEX idx_notifications_notification_type 
ON notifications(notification_type);

-- SYNC QUEUE
CREATE INDEX idx_sync_queue_sync_status 
ON sync_queue(sync_status);

CREATE INDEX idx_sync_queue_target_table 
ON sync_queue(target_table);

CREATE INDEX idx_sync_queue_created_at 
ON sync_queue(created_at);