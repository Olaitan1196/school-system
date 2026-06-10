import { getLocalDb } from '../database/localDb.js';
import { net } from 'electron';

// ============================================
// CHECK IF INTERNET IS AVAILABLE
// Uses Electron's built-in net module
// ============================================
export const isOnline = () => {
    return net.isOnline();
};

// ============================================
// PUSH LOCAL CHANGES TO SUPABASE
// Reads sync_queue and sends each pending
// record to the Supabase REST API
// ============================================
export const pushToSupabase = async (supabaseUrl, supabaseKey) => {
    const db = getLocalDb();

    const pendingItems = db.prepare(`
        SELECT * FROM sync_queue
        WHERE sync_status = 'pending'
        AND retry_count < max_retries
        ORDER BY created_at ASC
        LIMIT 50
    `).all();

    if (pendingItems.length === 0) {
        console.log('Sync: No pending items to push');
        return { pushed: 0, failed: 0 };
    }

    let pushed = 0;
    let failed = 0;

    for (const item of pendingItems) {
        try {
            // Mark as syncing
            db.prepare(`
                UPDATE sync_queue SET sync_status = 'syncing'
                WHERE id = ?
            `).run(item.id);

            const payload = JSON.parse(item.payload);
            const url = `${supabaseUrl}/rest/v1/${item.target_table}`;

            let method = 'POST';
            let finalUrl = url;

            if (item.operation_type === 'UPDATE') {
                method = 'PATCH';
                finalUrl = `${url}?id=eq.${item.record_id}`;
            } else if (item.operation_type === 'DELETE') {
                method = 'DELETE';
                finalUrl = `${url}?id=eq.${item.record_id}`;
            }

            const response = await fetch(finalUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: item.operation_type !== 'DELETE'
                    ? JSON.stringify(payload)
                    : undefined
            });

            if (response.ok || response.status === 201 || response.status === 204) {
                // Mark as synced
                db.prepare(`
                    UPDATE sync_queue
                    SET sync_status = 'synced', synced_at = datetime('now')
                    WHERE id = ?
                `).run(item.id);
                pushed++;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }

        } catch (error) {
            // Mark as failed and increment retry count
            db.prepare(`
                UPDATE sync_queue
                SET sync_status = 'pending',
                    retry_count = retry_count + 1,
                    error_message = ?
                WHERE id = ?
            `).run(error.message, item.id);
            failed++;
            console.error(`Sync failed for ${item.target_table}:`, error.message);
        }
    }

    console.log(`Sync complete: ${pushed} pushed, ${failed} failed`);
    return { pushed, failed };
};

// ============================================
// PULL FRESH DATA FROM SUPABASE TO SQLITE
// Downloads key tables and stores them locally
// ============================================
export const pullFromSupabase = async (supabaseUrl, supabaseKey) => {
    const db = getLocalDb();

    // These are the tables we pull from Supabase to keep local data fresh
    const tablesToPull = [
        'schools',
        'academic_sessions',
        'terms',
        'classes',
        'streams',
        'subjects',
        'class_subjects',
        'users',
        'students',
        'teachers',
        'enrollments',
        'teacher_assignments',
        'scores',
        'attendance',
        'fee_items',
        'fee_structures',
        'invoices',
        'invoice_items',
        'payments',
        'notifications'
    ];

    let pulled = 0;

    for (const table of tablesToPull) {
        try {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/${table}?select=*&limit=5000`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    }
                }
            );

            if (!response.ok) continue;

            const rows = await response.json();
            if (!Array.isArray(rows) || rows.length === 0) continue;

            // Insert or replace each row into SQLite
            for (const row of rows) {
                try {
                    const columns = Object.keys(row).join(', ');
                    const placeholders = Object.keys(row).map(() => '?').join(', ');
                    const values = Object.values(row);

                    db.prepare(`
                        INSERT OR REPLACE INTO ${table} (${columns})
                        VALUES (${placeholders})
                    `).run(values);
                } catch (rowError) {
                    // Skip rows with missing columns in SQLite schema
                }
            }

            pulled++;
            console.log(`Pulled ${rows.length} records from ${table}`);

        } catch (error) {
            console.error(`Failed to pull ${table}:`, error.message);
        }
    }

    console.log(`Pull complete: ${pulled} tables updated`);
    return { pulled };
};

// ============================================
// FULL SYNC — PUSH THEN PULL
// This is called automatically when internet
// is detected
// ============================================
export const runFullSync = async (supabaseUrl, supabaseKey) => {
    if (!isOnline()) {
        console.log('Sync skipped: No internet connection');
        return { success: false, reason: 'offline' };
    }

    console.log('Starting full sync...');

    const pushResult = await pushToSupabase(supabaseUrl, supabaseKey);
    const pullResult = await pullFromSupabase(supabaseUrl, supabaseKey);

    return {
        success: true,
        pushed: pushResult.pushed,
        failed: pushResult.failed,
        pulled: pullResult.pulled
    };
};