import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { networkInterfaces } from 'os';
import './config/db.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import studentRoutes from './routes/student.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import academicRoutes from './routes/academic.routes.js';
import scoresRoutes from './routes/scores.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import feesRoutes from './routes/fees.routes.js';
import cbtRoutes from './routes/cbt.routes.js';
import libraryRoutes from './routes/library.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import examAccessRoutes from './routes/examaccess.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import cbtTokenRoutes from './routes/cbtToken.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// DETECT LOCAL NETWORK IP ADDRESS
// This is the IP students will type in their
// browser to access the app
// ============================================
const getLocalIP = () => {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};

// ============================================
// MIDDLEWARES
// ============================================

// Allow any device on the local network to
// access the app — needed for student computers
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        // Allow localhost and any local network IP
        if (
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('192.168.') ||
            origin.includes('10.0.') ||
            origin.includes('comforterscollege.netlify.app')
        ) {
            return callback(null, true);
        }
        return callback(null, true); // Open for now
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
    contentSecurityPolicy: false // Allow local network serving
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/cbt', cbtRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/exam-access', examAccessRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cbt-tokens', cbtTokenRoutes);
// ============================================
// SERVE REACT FRONTEND
// Express serves the built React app to any
// student computer that connects on the network
// ============================================
const clientDistPath = join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Any route that is not an API route gets
// sent the React app — this handles React Router
app.get('/{*path}', (req, res) => {
    res.sendFile(join(clientDistPath, 'index.html'));
});

// ============================================
// START SERVER
// ============================================
const localIP = getLocalIP();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Online URL: http://localhost:${PORT}`);
    console.log(`📡 Local Network URL: http://${localIP}:${PORT}`);
    console.log(`👨‍💻 Share this with students: http://${localIP}:${PORT}`);
});

export default app;