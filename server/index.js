import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import './config/db.js';
import authRoutes from './routes/auth.routes.js';

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

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Test URL: http://localhost:${PORT}`);
});

export default app;