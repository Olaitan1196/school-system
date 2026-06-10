import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { mkdirSync } from 'fs';

// ============================================
// DATABASE FILE LOCATION
// Stored in the user's AppData folder
// Example: C:\Users\John\AppData\Roaming\ComfortersCollege\local.db
// ============================================
const getDbPath = () => {
    const userDataPath = app.getPath('userData');
    mkdirSync(userDataPath, { recursive: true });
    return join(userDataPath, 'local.db');
};

let db;

export const getLocalDb = () => {
    if (!db) {
        db = new Database(getDbPath());
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initializeTables();
    }
    return db;
};

// ============================================
// CREATE ALL TABLES IN SQLITE
// These mirror your PostgreSQL tables
// ============================================
const initializeTables = () => {
    db.exec(`
        -- SCHOOLS
        CREATE TABLE IF NOT EXISTS schools (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            email TEXT,
            logo_url TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- ACADEMIC SESSIONS
        CREATE TABLE IF NOT EXISTS academic_sessions (
            id TEXT PRIMARY KEY,
            school_id TEXT,
            session_name TEXT NOT NULL,
            start_date TEXT,
            end_date TEXT,
            is_current INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- TERMS
        CREATE TABLE IF NOT EXISTS terms (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            term_name TEXT NOT NULL,
            start_date TEXT,
            end_date TEXT,
            is_current INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- STREAMS
        CREATE TABLE IF NOT EXISTS streams (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- CLASSES
        CREATE TABLE IF NOT EXISTS classes (
            id TEXT PRIMARY KEY,
            school_id TEXT,
            class_name TEXT NOT NULL,
            class_level TEXT,
            stream_id TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- SUBJECTS
        CREATE TABLE IF NOT EXISTS subjects (
            id TEXT PRIMARY KEY,
            subject_name TEXT NOT NULL,
            subject_code TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- CLASS SUBJECTS
        CREATE TABLE IF NOT EXISTS class_subjects (
            id TEXT PRIMARY KEY,
            class_id TEXT,
            subject_id TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- USERS
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- STUDENTS
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            admission_number TEXT UNIQUE,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            middle_name TEXT,
            date_of_birth TEXT,
            gender TEXT,
            address TEXT,
            phone TEXT,
            photo_url TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- TEACHERS
        CREATE TABLE IF NOT EXISTS teachers (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            staff_id TEXT UNIQUE,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            subject_specialization TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- ENROLLMENTS
        CREATE TABLE IF NOT EXISTS enrollments (
            id TEXT PRIMARY KEY,
            student_id TEXT,
            class_id TEXT,
            session_id TEXT,
            term_id TEXT,
            enrollment_date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- TEACHER ASSIGNMENTS
        CREATE TABLE IF NOT EXISTS teacher_assignments (
            id TEXT PRIMARY KEY,
            teacher_id TEXT,
            class_id TEXT,
            subject_id TEXT,
            session_id TEXT,
            term_id TEXT,
            is_class_teacher INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- SCORES
        CREATE TABLE IF NOT EXISTS scores (
            id TEXT PRIMARY KEY,
            student_id TEXT,
            subject_id TEXT,
            class_id TEXT,
            session_id TEXT,
            term_id TEXT,
            ca1 REAL DEFAULT 0,
            ca2 REAL DEFAULT 0,
            ca3 REAL DEFAULT 0,
            exam REAL DEFAULT 0,
            total REAL DEFAULT 0,
            grade TEXT,
            remark TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- ATTENDANCE
        CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            student_id TEXT,
            class_id TEXT,
            session_id TEXT,
            term_id TEXT,
            attendance_date TEXT,
            status TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- FEE ITEMS
        CREATE TABLE IF NOT EXISTS fee_items (
            id TEXT PRIMARY KEY,
            item_name TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- FEE STRUCTURES
        CREATE TABLE IF NOT EXISTS fee_structures (
            id TEXT PRIMARY KEY,
            class_id TEXT,
            session_id TEXT,
            term_id TEXT,
            fee_item_id TEXT,
            amount REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- INVOICES
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            student_id TEXT,
            session_id TEXT,
            term_id TEXT,
            total_amount REAL DEFAULT 0,
            amount_paid REAL DEFAULT 0,
            balance REAL DEFAULT 0,
            status TEXT DEFAULT 'unpaid',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- INVOICE ITEMS
        CREATE TABLE IF NOT EXISTS invoice_items (
            id TEXT PRIMARY KEY,
            invoice_id TEXT,
            fee_item_id TEXT,
            amount REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- PAYMENTS
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            invoice_id TEXT,
            student_id TEXT,
            amount REAL DEFAULT 0,
            payment_method TEXT,
            payment_date TEXT,
            receipt_number TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- NOTIFICATIONS
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            recipient_id TEXT,
            recipient_role TEXT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            notification_type TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            read_at TEXT,
            action_url TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- SYNC QUEUE
        CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            operation_type TEXT NOT NULL,
            target_table TEXT NOT NULL,
            record_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            sync_status TEXT DEFAULT 'pending',
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            error_message TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            synced_at TEXT,
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- AUDIT LOGS
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            user_role TEXT,
            action TEXT NOT NULL,
            module TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
    `);

    console.log('SQLite tables initialized successfully');
};

export default getLocalDb;