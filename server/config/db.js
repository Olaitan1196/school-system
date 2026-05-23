import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// LOCAL DATABASE CONNECTION
const localPool = new Pool({
    host: process.env.LOCAL_DB_HOST,
    port: process.env.LOCAL_DB_PORT,
    database: process.env.LOCAL_DB_NAME,
    user: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PASSWORD,
});

// SUPABASE DATABASE CONNECTION
const supabasePool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT,
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
});

// ACTIVE CONNECTION
// When NODE_ENV is development it uses local
// When NODE_ENV is production it uses Supabase
const db = process.env.NODE_ENV === 'production'
    ? supabasePool
    : localPool;

// TEST THE CONNECTION
const testConnection = async () => {
    try {
        const client = await db.connect();
        console.log(
            `Database connected successfully → ${
                process.env.NODE_ENV === 'production'
                    ? 'Supabase'
                    : 'Local PostgreSQL'
            }`
        );
        client.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

testConnection();

export default db;