CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL CHECK (module IN (
        'auth',
        'students',
        'teachers',
        'classes',
        'subjects',
        'scores',
        'attendance',
        'fees',
        'invoices',
        'payments',
        'results',
        'cbt',
        'library',
        'calendar',
        'promotions',
        'settings',
        'system'
    )),
    target_table VARCHAR(100),
    target_id UUID,
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    ip_address VARCHAR(50),
    device_info TEXT,
    status VARCHAR(10) DEFAULT 'success' CHECK (status IN ('success', 'failed')),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) CHECK (recipient_role IN (
        'admin',
        'class_teacher',
        'subject_teacher',
        'student',
        'all'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'payment_received',
        'payment_approved',
        'payment_rejected',
        'result_available',
        'token_generated',
        'invoice_generated',
        'exam_scheduled',
        'exam_started',
        'result_published',
        'attendance_alert',
        'promotion_done',
        'book_overdue',
        'fee_reminder',
        'system_alert',
        'general'
    )),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(10) NOT NULL CHECK (operation_type IN (
        'INSERT',
        'UPDATE',
        'DELETE'
    )),
    target_table VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    payload JSONB NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN (
        'pending',
        'syncing',
        'synced',
        'failed',
        'conflict'
    )),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);