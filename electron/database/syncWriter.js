import { getLocalDb } from './localDb.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// WRITE A CHANGE TO THE SYNC QUEUE
// Call this every time you INSERT, UPDATE,
// or DELETE a record in SQLite
//
// Example usage:
// addToSyncQueue('INSERT', 'students', studentId, studentData)
// addToSyncQueue('UPDATE', 'scores', scoreId, scoreData)
// addToSyncQueue('DELETE', 'attendance', attendanceId, {})
// ============================================
export const addToSyncQueue = (operationType, targetTable, recordId, payload) => {
    const db = getLocalDb();

    const id = uuidv4();

    db.prepare(`
        INSERT INTO sync_queue (
            id,
            operation_type,
            target_table,
            record_id,
            payload,
            sync_status,
            retry_count,
            max_retries,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', 0, 3, datetime('now'), datetime('now'))
    `).run(
        id,
        operationType,
        targetTable,
        recordId,
        JSON.stringify(payload)
    );

    console.log(`Queued ${operationType} on ${targetTable} [${recordId}]`);
};

// ============================================
// GET COUNT OF PENDING SYNC ITEMS
// Used to show the admin how many changes
// are waiting to be synced
// ============================================
export const getPendingCount = () => {
    const db = getLocalDb();

    const result = db.prepare(`
        SELECT COUNT(*) as count
        FROM sync_queue
        WHERE sync_status = 'pending'
    `).get();

    return result.count;
};

// ============================================
// GET ALL PENDING ITEMS — for display purposes
// ============================================
export const getPendingItems = () => {
    const db = getLocalDb();

    return db.prepare(`
        SELECT id, operation_type, target_table, record_id, created_at, retry_count
        FROM sync_queue
        WHERE sync_status = 'pending'
        ORDER BY created_at ASC
    `).all();
};

// ============================================
// CLEAR ALL SYNCED ITEMS — housekeeping
// Removes records that already synced
// to keep the database clean
// ============================================
export const clearSyncedItems = () => {
    const db = getLocalDb();

    const result = db.prepare(`
        DELETE FROM sync_queue
        WHERE sync_status = 'synced'
    `).run();

    console.log(`Cleared ${result.changes} synced items`);
    return result.changes;
};