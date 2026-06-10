import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES
// ============================================

// Allows frontend to talk to backend
app.use(cors());

// Adds security headers to every response
app.use(helmet());

// Logs every request in the terminal
app.use(morgan('dev'));

// Allows server to read JSON data from requests
app.use(express.json());

// Allows server to read form data from requests
app.use(express.urlencoded({ extended: true }));


// ============================================
// TEST ROUTE
// ============================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Comforters College Server is running',
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// ROUTES
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
// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Test URL: http://localhost:${PORT}`);
});

export default app;